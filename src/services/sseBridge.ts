import EventSource from "react-native-sse";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";

const API_BASE = "https://notification-backend-znes.onrender.com";



let es: EventSource | null = null;

export async function startSseBridge() {
  const token =
    (await SecureStore.getItemAsync("accessToken")) ||
    (await SecureStore.getItemAsync("token")) ||
    "";

  if (!token) {
    console.log("[SSE] no token, skip");
    return;
  }

  stopSseBridge();

  es = new EventSource(`${API_BASE}/mobile/stream`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  es.addEventListener("open", () => console.log("[SSE] connected"));

  es.addEventListener("message", async (evt: any) => {
    try {
      const payload = JSON.parse(evt.data);

      if (payload?.type === "ping") return;

      if (payload?.type === "notification") {
        console.log("[SSE] notification event:", payload);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title || "DailySpark ✨",
            body: payload.body || "Yeni mesajın var.",
            data: payload.data || {},
            sound: "default", // ✅ iOS için doğru
          },
          trigger: null, // hemen göster
        });
      }
    } catch (e) {
      console.log("[SSE] parse error:", e);
    }
  });

  es.addEventListener("error", (e: any) => {
    console.log("[SSE] error", e);
  });
}

export function stopSseBridge() {
  try {
    es?.close?.();
  } catch {}
  es = null;
}
