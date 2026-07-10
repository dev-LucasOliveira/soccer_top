import { customAlphabet, nanoid } from "nanoid";

const generateCode = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function createSessionCode() {
  return generateCode();
}

export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  const key = "soccer_top_guest_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = nanoid(32);
    localStorage.setItem(key, token);
  }
  return token;
}

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("soccer_top_guest_token");
}
