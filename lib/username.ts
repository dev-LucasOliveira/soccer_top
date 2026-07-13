const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) {
    return "Username é obrigatório";
  }
  if (trimmed.length < 3 || trimmed.length > 20) {
    return "Username deve ter entre 3 e 20 caracteres";
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Use apenas letras, números e underscore";
  }
  return null;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
