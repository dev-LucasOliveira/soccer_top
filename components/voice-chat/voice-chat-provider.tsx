"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalAudioTrack,
  type RemoteAudioTrack,
  type RemoteParticipant,
} from "livekit-client";
import { getGuestToken } from "@/lib/guest";
import {
  canAccessMicrophone,
  fetchVoiceAvailability,
  fetchVoiceToken,
  getInsecureContextError,
  mapMediaError,
} from "./voice-chat.service";
import {
  getStoredParticipantVolume,
  rememberVoiceAutoJoin,
  setStoredParticipantVolume,
  shouldAutoJoinVoice,
  type VoiceAvailability,
  type VoiceChatError,
  type VoiceConnectionStatus,
  type VoiceParticipant,
} from "./voice-chat.types";

const VOICE_STATUS_POLL_MS = 60_000;
const VOICE_CONNECTION_KEY = "voice-chat-active-connection";

type VoiceChatContextValue = {
  status: VoiceConnectionStatus;
  availability: VoiceAvailability;
  participants: VoiceParticipant[];
  isMicrophoneEnabled: boolean;
  inputDeviceId?: string;
  inputDevices: MediaDeviceInfo[];
  error?: VoiceChatError;
  canJoin: boolean;
  joinVoice: () => Promise<void>;
  leaveVoice: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  selectInputDevice: (deviceId: string) => Promise<void>;
  setParticipantVolume: (participantId: string, volume: number) => void;
  toggleParticipantLocalMute: (participantId: string) => void;
  dismissUnavailableBanner: () => void;
  showUnavailableBanner: boolean;
};

const VoiceChatContext = createContext<VoiceChatContextValue | null>(null);

function buildParticipantList(
  room: Room | null,
  activeSpeakerIds: Set<string>,
  volumeMap: Record<string, number>,
  localMuteMap: Record<string, boolean>
): VoiceParticipant[] {
  if (!room) return [];

  const participants: VoiceParticipant[] = [];

  const local = room.localParticipant;
  participants.push({
    id: local.identity,
    name: local.name || local.identity,
    isLocal: true,
    isSpeaking: activeSpeakerIds.has(local.identity),
    isMicrophoneEnabled: local.isMicrophoneEnabled,
    canPublish: true,
    volume: 1,
    isLocallyMuted: false,
  });

  for (const remote of room.remoteParticipants.values()) {
    participants.push({
      id: remote.identity,
      name: remote.name || remote.identity,
      isLocal: false,
      isSpeaking: activeSpeakerIds.has(remote.identity),
      isMicrophoneEnabled: remote.isMicrophoneEnabled,
      canPublish: remote.isMicrophoneEnabled,
      volume: volumeMap[remote.identity] ?? getStoredParticipantVolume(remote.identity),
      isLocallyMuted: localMuteMap[remote.identity] ?? false,
    });
  }

  return participants.sort((a, b) => {
    if (a.isLocal) return -1;
    if (b.isLocal) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function VoiceChatProvider({
  sessionCode,
  participantId,
  sessionCompleted = false,
  children,
}: {
  sessionCode: string;
  participantId: string | null;
  sessionCompleted?: boolean;
  children: ReactNode;
}) {
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const connectionOwnerRef = useRef<string | null>(null);
  const autoJoinAttemptedRef = useRef(false);
  const activeSpeakerIdsRef = useRef<Set<string>>(new Set());
  const volumeMapRef = useRef<Record<string, number>>({});
  const localMuteMapRef = useRef<Record<string, boolean>>({});
  const [status, setStatus] = useState<VoiceConnectionStatus>("idle");
  const [availability, setAvailability] = useState<VoiceAvailability>({
    enabled: true,
  });
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [inputDeviceId, setInputDeviceId] = useState<string | undefined>();
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<VoiceChatError | undefined>();
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<Set<string>>(
    () => new Set()
  );
  const [volumeMap, setVolumeMap] = useState<Record<string, number>>({});
  const [localMuteMap, setLocalMuteMap] = useState<Record<string, boolean>>({});
  volumeMapRef.current = volumeMap;
  localMuteMapRef.current = localMuteMap;
  const [showUnavailableBanner, setShowUnavailableBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const canJoin = Boolean(
    participantId &&
      availability.enabled &&
      !sessionCompleted &&
      status !== "connected" &&
      status !== "connecting" &&
      status !== "requesting-permission" &&
      status !== "reconnecting"
  );

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    setParticipants(
      buildParticipantList(
        room,
        activeSpeakerIdsRef.current,
        volumeMapRef.current,
        localMuteMapRef.current
      )
    );
    if (room) {
      setIsMicrophoneEnabled(room.localParticipant.isMicrophoneEnabled);
    }
  }, []);

  const cleanupAudioElements = useCallback(() => {
    for (const element of audioElementsRef.current.values()) {
      element.remove();
    }
    audioElementsRef.current.clear();
  }, []);

  const detachRemoteTrack = useCallback((participantId: string) => {
    const element = audioElementsRef.current.get(participantId);
    if (element) {
      element.remove();
      audioElementsRef.current.delete(participantId);
    }
  }, []);

  const applyTrackVolume = useCallback(
    (participantId: string) => {
      const element = audioElementsRef.current.get(participantId);
      if (!element) return;
      const locallyMuted = localMuteMap[participantId] ?? false;
      const volume = locallyMuted
        ? 0
        : (volumeMap[participantId] ?? getStoredParticipantVolume(participantId));
      element.volume = volume;
    },
    [localMuteMap, volumeMap]
  );

  const attachRemoteTrack = useCallback(
    (participantId: string, track: RemoteAudioTrack) => {
      detachRemoteTrack(participantId);
      const element = track.attach();
      element.dataset.voiceParticipantId = participantId;
      element.autoplay = true;
      document.body.appendChild(element);
      audioElementsRef.current.set(participantId, element);
      applyTrackVolume(participantId);
    },
    [applyTrackVolume, detachRemoteTrack]
  );

  const leaveVoice = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      await room.disconnect();
      roomRef.current = null;
    }
    cleanupAudioElements();
    if (connectionOwnerRef.current) {
      sessionStorage.removeItem(VOICE_CONNECTION_KEY);
      connectionOwnerRef.current = null;
    }
    setStatus("disconnected");
    setParticipants([]);
    setIsMicrophoneEnabled(false);
    activeSpeakerIdsRef.current = new Set();
    setActiveSpeakerIds(new Set());
  }, [cleanupAudioElements]);

  const refreshAvailability = useCallback(async () => {
    try {
      const next = await fetchVoiceAvailability();
      setAvailability(next);
      if (!next.enabled) {
        if (!bannerDismissed) {
          setShowUnavailableBanner(true);
        }
        if (roomRef.current) {
          const room = roomRef.current;
          roomRef.current = null;
          await room.disconnect();
          cleanupAudioElements();
          sessionStorage.removeItem(VOICE_CONNECTION_KEY);
          connectionOwnerRef.current = null;
          setParticipants([]);
          setIsMicrophoneEnabled(false);
        }
        setStatus("unavailable");
      } else {
        setStatus((current) => (current === "unavailable" ? "idle" : current));
        if (!bannerDismissed) {
          setShowUnavailableBanner(false);
        }
      }
    } catch {
      // Keep last known availability; voice is optional.
    }
  }, [bannerDismissed, cleanupAudioElements]);

  const loadInputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputDevices(devices.filter((device) => device.kind === "audioinput"));
  }, []);

  const bindRoomEvents = useCallback(
    (room: Room) => {
      const sync = () => refreshParticipants();

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) {
          setStatus("connected");
          setError(undefined);
        } else if (state === ConnectionState.Reconnecting) {
          setStatus("reconnecting");
        } else if (state === ConnectionState.Disconnected) {
          setStatus("disconnected");
        }
      });

      room.on(RoomEvent.Reconnecting, async () => {
        setStatus("reconnecting");
        if (!participantId) return;
        try {
          const guestToken = getGuestToken();
          if (!guestToken) return;
          const tokenPayload = await fetchVoiceToken(
            sessionCode,
            participantId,
            guestToken
          );
          if (roomRef.current) {
            await roomRef.current.connect(tokenPayload.url, tokenPayload.token);
          }
        } catch {
          // LiveKit will keep retrying with the existing session when possible.
        }
      });
      room.on(RoomEvent.Reconnected, () => setStatus("connected"));
      room.on(RoomEvent.ParticipantConnected, sync);
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        detachRemoteTrack(participant.identity);
        sync();
      });
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          attachRemoteTrack(participant.identity, track as RemoteAudioTrack);
        }
        sync();
      });
      room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Audio) {
          detachRemoteTrack(participant.identity);
        }
        sync();
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const ids = new Set(speakers.map((speaker) => speaker.identity));
        activeSpeakerIdsRef.current = ids;
        setActiveSpeakerIds(ids);
        refreshParticipants();
      });
      room.on(RoomEvent.LocalTrackPublished, sync);
      room.on(RoomEvent.LocalTrackUnpublished, sync);
      room.on(RoomEvent.MediaDevicesChanged, loadInputDevices);
      room.on(RoomEvent.Disconnected, () => {
        cleanupAudioElements();
        sessionStorage.removeItem(VOICE_CONNECTION_KEY);
        connectionOwnerRef.current = null;
      });
    },
    [
      attachRemoteTrack,
      cleanupAudioElements,
      detachRemoteTrack,
      loadInputDevices,
      participantId,
      refreshParticipants,
      sessionCode,
    ]
  );

  const connectToRoom = useCallback(
    async (startMuted: boolean) => {
      if (!participantId) {
        throw new Error("Participante não identificado");
      }

      const guestToken = getGuestToken();
      if (!guestToken) {
        throw new Error("Sessão do navegador não encontrada");
      }

      const connectionKey = `${sessionCode}:${participantId}`;
      const existingOwner = sessionStorage.getItem(VOICE_CONNECTION_KEY);
      if (existingOwner && existingOwner !== connectionKey) {
        throw Object.assign(new Error("Voice chat já ativo em outra aba"), {
          voiceError: {
            code: "connection_failed",
            message: "Voice chat já ativo em outra aba desta sala.",
          } satisfies VoiceChatError,
        });
      }

      setStatus("connecting");
      setError(undefined);

      const tokenPayload = await fetchVoiceToken(
        sessionCode,
        participantId,
        guestToken
      );

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      bindRoomEvents(room);
      roomRef.current = room;

      await room.connect(tokenPayload.url, tokenPayload.token);
      sessionStorage.setItem(VOICE_CONNECTION_KEY, connectionKey);
      connectionOwnerRef.current = connectionKey;

      if (tokenPayload.canPublish) {
        await room.localParticipant.setMicrophoneEnabled(!startMuted, {
          deviceId: inputDeviceId,
        });
        setIsMicrophoneEnabled(!startMuted);
      } else {
        setIsMicrophoneEnabled(false);
      }

      for (const remote of room.remoteParticipants.values()) {
        remote.audioTrackPublications.forEach((publication) => {
          if (publication.track && publication.track.kind === Track.Kind.Audio) {
            attachRemoteTrack(
              remote.identity,
              publication.track as RemoteAudioTrack
            );
          }
        });
      }

      await loadInputDevices();
      setStatus("connected");
      refreshParticipants();
    },
    [
      attachRemoteTrack,
      bindRoomEvents,
      inputDeviceId,
      loadInputDevices,
      participantId,
      refreshParticipants,
      sessionCode,
    ]
  );

  const joinVoice = useCallback(async () => {
    if (!availability.enabled) {
      setShowUnavailableBanner(true);
      setStatus("unavailable");
      return;
    }

    try {
      setStatus("requesting-permission");
      if (!canAccessMicrophone()) {
        throw Object.assign(new Error(getInsecureContextError().message), {
          voiceError: getInsecureContextError(),
        });
      }
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      rememberVoiceAutoJoin();
      await connectToRoom(true);
    } catch (err) {
      const voiceError =
        (err as { voiceError?: VoiceChatError }).voiceError ??
        mapMediaError(err);
      setError(voiceError);
      setStatus("error");
      await leaveVoice();
    }
  }, [availability.enabled, connectToRoom, leaveVoice]);

  const toggleMicrophone = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next, {
      deviceId: inputDeviceId,
    });
    setIsMicrophoneEnabled(next);
    refreshParticipants();
  }, [inputDeviceId, refreshParticipants]);

  const selectInputDevice = useCallback(
    async (deviceId: string) => {
      const room = roomRef.current;
      setInputDeviceId(deviceId);
      if (!room) return;

      const enabled = room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(false);
      const audioTrack = room.localParticipant.getTrackPublication(
        Track.Source.Microphone
      )?.track as LocalAudioTrack | undefined;
      if (audioTrack) {
        await audioTrack.restartTrack({ deviceId });
      }
      if (enabled) {
        await room.localParticipant.setMicrophoneEnabled(true, { deviceId });
      }
      setIsMicrophoneEnabled(enabled);
      refreshParticipants();
    },
    [refreshParticipants]
  );

  const setParticipantVolume = useCallback(
    (targetParticipantId: string, volume: number) => {
      const clamped = Math.min(1, Math.max(0, volume));
      setVolumeMap((current) => ({ ...current, [targetParticipantId]: clamped }));
      setStoredParticipantVolume(targetParticipantId, clamped);
      if (clamped > 0) {
        setLocalMuteMap((current) => ({ ...current, [targetParticipantId]: false }));
      }
      applyTrackVolume(targetParticipantId);
      refreshParticipants();
    },
    [applyTrackVolume, refreshParticipants]
  );

  const toggleParticipantLocalMute = useCallback(
    (targetParticipantId: string) => {
      setLocalMuteMap((current) => {
        const next = !current[targetParticipantId];
        return { ...current, [targetParticipantId]: next };
      });
      applyTrackVolume(targetParticipantId);
      refreshParticipants();
    },
    [applyTrackVolume, refreshParticipants]
  );

  const dismissUnavailableBanner = useCallback(() => {
    setBannerDismissed(true);
    setShowUnavailableBanner(false);
  }, []);

  useEffect(() => {
    refreshAvailability();
    const interval = setInterval(refreshAvailability, VOICE_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [refreshAvailability]);

  useEffect(() => {
    if (sessionCompleted && roomRef.current) {
      void leaveVoice();
    }
  }, [leaveVoice, sessionCompleted]);

  useEffect(() => {
    if (
      autoJoinAttemptedRef.current ||
      !participantId ||
      !availability.enabled ||
      sessionCompleted ||
      roomRef.current ||
      status === "connected" ||
      status === "connecting"
    ) {
      return;
    }

    if (shouldAutoJoinVoice()) {
      autoJoinAttemptedRef.current = true;
      void joinVoice();
    }
  }, [availability.enabled, joinVoice, participantId, sessionCompleted, status]);

  useEffect(() => {
    refreshParticipants();
  }, [activeSpeakerIds, volumeMap, localMuteMap, refreshParticipants]);

  useEffect(() => {
    return () => {
      const room = roomRef.current;
      if (room) {
        void room.disconnect();
        roomRef.current = null;
      }
      for (const element of audioElementsRef.current.values()) {
        element.remove();
      }
      audioElementsRef.current.clear();
      sessionStorage.removeItem(VOICE_CONNECTION_KEY);
    };
  }, []);

  const value = useMemo<VoiceChatContextValue>(
    () => ({
      status,
      availability,
      participants,
      isMicrophoneEnabled,
      inputDeviceId,
      inputDevices,
      error,
      canJoin,
      joinVoice,
      leaveVoice,
      toggleMicrophone,
      selectInputDevice,
      setParticipantVolume,
      toggleParticipantLocalMute,
      dismissUnavailableBanner,
      showUnavailableBanner,
    }),
    [
      availability,
      canJoin,
      dismissUnavailableBanner,
      error,
      inputDeviceId,
      inputDevices,
      isMicrophoneEnabled,
      joinVoice,
      leaveVoice,
      participants,
      selectInputDevice,
      setParticipantVolume,
      showUnavailableBanner,
      status,
      toggleMicrophone,
      toggleParticipantLocalMute,
    ]
  );

  return (
    <VoiceChatContext.Provider value={value}>{children}</VoiceChatContext.Provider>
  );
}

export function useVoiceChat() {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error("useVoiceChat deve ser usado dentro de VoiceChatProvider");
  }
  return context;
}
