import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";

/* ========= API BASE (senin pattern) ========= */
const API_BASE = "https://notification-backend-znes.onrender.com";


async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/* ========= Toast helpers (Profile ile aynı) ========= */
const showSuccess = (msg: string) => {
  Toast.show({
    type: "success",
    text1: msg,
    position: "bottom",
    visibilityTime: 1500,
  });
};
const showError = (msg: string) => {
  Toast.show({
    type: "error",
    text1: msg,
    position: "bottom",
    visibilityTime: 2000,
  });
};

type Props = {
  visible: boolean;
  onClose: () => void; // kullanıcı kapatırsa (istersen “sonra”)
  onSubmitted?: () => void; // başarılı gönderim sonrası
};

export default function DailyFeedbackModal({
  visible,
  onClose,
  onSubmitted,
}: Props) {
  const { COLORS } = useTheme();

  const [rating, setRating] = useState<number | null>(null);
  const [noteText, setNoteText] = useState(""); // UI’de “yorum” ama backend’e note gidecek
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => !!rating && !loading, [rating, loading]);

  const send = async () => {
    if (!rating) {
      showError("Lütfen bir puan seç.");
      return;
    }

    try {
      setLoading(true);

      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }

      // ✅ Prisma/DTO: comment yok, note var → sadece rating + note
      const payload: any = {
        rating: Number(rating), // garanti int
      };

      const n = noteText.trim();
      if (n) payload.note = n; // ✅ comment DEĞİL note!

      const res = await fetch(`${API_BASE}/mobile/feedback`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || "Feedback gönderilemedi";
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      showSuccess("Teşekkürler! ✅");
      onSubmitted?.();
      onClose();

      // reset
      setRating(null);
      setNoteText("");
    } catch (e: any) {
      showError(e?.message || "Feedback gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View
              style={[styles.badge, { backgroundColor: COLORS.PRIMARY_SOFT }]}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={COLORS.PRIMARY}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: COLORS.TEXT }]}>
                Bugün nasıldı?
              </Text>
              <Text style={[styles.sub, { color: COLORS.MUTED }]}>
                Gün içindeki bildirimleri genel olarak değerlendirir misin?
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.MUTED} />
            </Pressable>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: COLORS.CARD,
                      borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? COLORS.PRIMARY : COLORS.TEXT },
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <Text style={[styles.label, { color: COLORS.MUTED }]}>
            Yorum (opsiyonel)
          </Text>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="İstersen kısa bir not bırak…"
            placeholderTextColor={COLORS.MUTED}
            style={[
              styles.input,
              {
                backgroundColor: COLORS.CARD,
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT,
              },
            ]}
            multiline
          />

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable
              onPress={onClose}
              style={[
                styles.secondaryBtn,
                { borderColor: COLORS.BORDER, backgroundColor: COLORS.BG },
              ]}
              disabled={loading}
            >
              <Text style={[styles.secondaryText, { color: COLORS.MUTED }]}>
                Sonra
              </Text>
            </Pressable>

            <Pressable
              onPress={send}
              disabled={!canSend}
              style={[
                styles.primaryBtn,
                { backgroundColor: COLORS.PRIMARY },
                (!canSend || loading) && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={[styles.primaryText, { color: COLORS.CARD }]}>
                  Gönder
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  ratingRow: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 12 },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 16, fontWeight: "800" },

  label: { fontSize: 12, marginBottom: 6 },
  input: {
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
  },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 14, fontWeight: "800" },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: 14, fontWeight: "800" },
});
