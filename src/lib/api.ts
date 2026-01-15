// src/lib/api.ts
import * as SecureStore from "expo-secure-store";

/**
 * ✅ PROD default
 * Expo'da env kullanacaksan mutlaka EXPO_PUBLIC_ prefix'i gerekir.
 * EXPO_PUBLIC_API_BASE tanımlı değilse direkt Railway'e düşer.
 */
const DEFAULT_BASE = "https://notification-backend-production-9c18.up.railway.app";

const ENV_BASE =
  (process.env as any)?.EXPO_PUBLIC_API_BASE ||
  DEFAULT_BASE;

export const API_BASE = String(ENV_BASE).replace(/\/$/, "");

const TOKEN_KEY = "accessToken";

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
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401 || res.status === 403) {
    try {
      await clearToken();
    } catch {}
    const msg = (data && (data.message || data.error)) || "Unauthorized";
    const message = Array.isArray(msg) ? msg.join("\n") : String(msg);
    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(Array.isArray(message) ? message.join("\n") : String(message));
  }

  return data as T;
}
