"use client";

import { useVoiceChat } from "./voice-chat-provider";

export function DeviceSelector() {
  const { inputDevices, inputDeviceId, selectInputDevice, status } = useVoiceChat();

  if (status !== "connected" && status !== "reconnecting") {
    return null;
  }

  if (inputDevices.length === 0) {
    return null;
  }

  return (
    <label className="block text-xs text-on-pitch-subtle">
      <span className="mb-1 block">Microfone</span>
      <select
        value={inputDeviceId ?? ""}
        onChange={(event) => selectInputDevice(event.target.value)}
        className="w-full rounded-lg border border-off-white/10 bg-off-white/[0.04] px-2 py-1.5 text-sm text-off-white"
      >
        <option value="">Padrão do sistema</option>
        {inputDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microfone ${device.deviceId.slice(0, 6)}`}
          </option>
        ))}
      </select>
    </label>
  );
}
