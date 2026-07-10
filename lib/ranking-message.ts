import { LIST_MESSAGE_MAX_LENGTH } from "./constants";

export function normalizeListMessage(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new Error("Mensagem inválida");
  }

  const normalized = value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) return null;

  if (normalized.length > LIST_MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Mensagem deve ter no máximo ${LIST_MESSAGE_MAX_LENGTH} caracteres`
    );
  }

  return normalized;
}
