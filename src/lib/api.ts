// src/lib/api.ts
import * as SecureStore from "expo-secure-store";

/**
 * ✅ PROD default
 * Expo'da env kullanacaksan mutlaka EXPO_PUBLIC_ prefix'i gerekir.
 * EXPO_PUBLIC_API_BASE tanımlı değilse direkt PROD'a gider.
 */
const DEFAULT_BASE = "https://notification-backend-znes.onrender.com";

const ENV_BASE = (process.env as any)?.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

export const API_BASE = String(ENV_BASE).replace(/\/$/, "");

export const TOKEN_KEY = "accessToken";

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: any;
  auth?: boolean;
};

function safeParseJson(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function pickErrorMessage(data: any, fallback: string) {
  const msg = data?.message || data?.error || fallback;
  return Array.isArray(msg) ? msg.join("\n") : String(msg);
}

export async function api<T = any>(path: string, opts: ApiOptions = {}) {
  const method = opts.method ?? "GET";
  const auth = opts.auth ?? true;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text().catch(() => "");
  const data = safeParseJson(text);

  /**
   * ✅ KRİTİK FIX
   * - SADECE 401 => token invalid/expired => token sil + login'e düş
   * - 403 => yetki/rol hatası olabilir => token SİLME (yoksa her seferinde login ister)
   */
  if (res.status === 401) {
    try {
      await clearToken();
    } catch {}
    const err = new Error(pickErrorMessage(data, "Unauthorized"));
    (err as any).status = 401;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error(pickErrorMessage(data, "Forbidden"));
    (err as any).status = 403;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(
      pickErrorMessage(data, `HTTP ${res.status} ${res.statusText}`)
    );
    (err as any).status = res.status;
    throw err;
  }

  return data as T;
}
