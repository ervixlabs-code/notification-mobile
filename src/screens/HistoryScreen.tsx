// src/screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

/* ========= API BASE ========= */
const API_BASE = "https://notification-backend-znes.onrender.com";

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/* ========= Toast helpers ========= */
const showError = (msg: string) => {
  Toast.show({
    type: "error",
    text1: msg,
    position: "bottom",
    visibilityTime: 2000,
  });
};

type FeedbackItem = {
  id: number;
  rating: number;
  note?: string | null;
  createdAt: string;
};

function formatRelative(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce`;
  const day = Math.floor(h / 24);
  return `${day} gün önce`;
}

function ratingLabel(r: number) {
  if (r >= 5) return "Harika";
  if (r === 4) return "Çok iyi";
  if (r === 3) return "İdare eder";
  if (r === 2) return "Zayıf";
  return "Kötü";
}

function ratingEmoji(r: number) {
  if (r >= 5) return "🔥";
  if (r === 4) return "✨";
  if (r === 3) return "🙂";
  if (r === 2) return "😕";
  return "🥶";
}

function ratingTone(r: number) {
  // “canlı” hissiyat için ton seti (renkleri theme’den bağımsız sabitliyoruz)
  if (r >= 5) return { ring: "#FF6A3D", soft: "rgba(255,106,61,0.14)" };
  if (r === 4) return { ring: "#FF8A3D", soft: "rgba(255,138,61,0.14)" };
  if (r === 3) return { ring: "#4F8BFF", soft: "rgba(79,139,255,0.14)" };
  if (r === 2) return { ring: "#A78BFA", soft: "rgba(167,139,250,0.14)" };
  return { ring: "#94A3B8", soft: "rgba(148,163,184,0.14)" };
}

function Hero({ item, COLORS }: { item: FeedbackItem; COLORS: any }) {
  const tone = ratingTone(item.rating);

  return (
    <View
      style={[
        styles.heroOuter,
        { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD },
      ]}
    >
      {/* Glow layer */}
      <View
        pointerEvents="none"
        style={[
          styles.heroGlow,
          {
            backgroundColor: tone.soft,
          },
        ]}
      />

      <View style={styles.heroHeader}>
        <View
          style={[
            styles.heroIconWrap,
            { backgroundColor: COLORS.PRIMARY_SOFT, borderColor: COLORS.PRIMARY },
          ]}
        >
          <Ionicons name="sparkles-outline" size={18} color={COLORS.PRIMARY} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: COLORS.TEXT }]}>
            Son feedback
          </Text>
          <Text style={[styles.heroMeta, { color: COLORS.MUTED }]}>
            {formatRelative(item.createdAt)}
          </Text>
        </View>

        <View
          style={[
            styles.scoreChip,
            { backgroundColor: tone.soft, borderColor: tone.ring },
          ]}
        >
          <Text style={[styles.scoreChipText, { color: tone.ring }]}>
            {ratingEmoji(item.rating)} {item.rating}/5
          </Text>
        </View>
      </View>

      <View style={[styles.heroBadgeRow]}>
        <View
          style={[
            styles.pill,
            { borderColor: COLORS.BORDER, backgroundColor: COLORS.BG },
          ]}
        >
          <Ionicons name="pulse-outline" size={14} color={COLORS.MUTED} />
          <Text style={[styles.pillText, { color: COLORS.MUTED }]}>
            {ratingLabel(item.rating)}
          </Text>
        </View>

        <View
          style={[
            styles.pill,
            { borderColor: COLORS.BORDER, backgroundColor: COLORS.BG },
          ]}
        >
          <Ionicons name="calendar-outline" size={14} color={COLORS.MUTED} />
          <Text style={[styles.pillText, { color: COLORS.MUTED }]}>
            Günlük değerlendirme
          </Text>
        </View>
      </View>

      {item.note?.trim() ? (
        <View
          style={[
            styles.noteBox,
            { borderColor: COLORS.BORDER, backgroundColor: COLORS.BG },
          ]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.MUTED} />
          <Text style={[styles.noteText, { color: COLORS.TEXT }]}>
            {item.note.trim()}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.noteBox,
            { borderColor: COLORS.BORDER, backgroundColor: COLORS.BG },
          ]}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.MUTED} />
          <Text style={[styles.noteMuted, { color: COLORS.MUTED }]}>
            Not bırakılmadı.
          </Text>
        </View>
      )}
    </View>
  );
}

function MiniCard({ item, COLORS }: { item: FeedbackItem; COLORS: any }) {
  const tone = ratingTone(item.rating);

  return (
    <View style={[styles.miniCard, { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD }]}>
      <View style={styles.miniTop}>
        <View style={[styles.miniDot, { backgroundColor: tone.soft, borderColor: tone.ring }]}>
          <Text style={{ color: tone.ring, fontWeight: "900" }}>{item.rating}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.miniTitle, { color: COLORS.TEXT }]}>
            {ratingLabel(item.rating)}
          </Text>
          <Text style={[styles.miniMeta, { color: COLORS.MUTED }]}>
            {formatRelative(item.createdAt)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.MUTED} />
      </View>

      {item.note?.trim() ? (
        <Text style={[styles.miniNote, { color: COLORS.MUTED }]} numberOfLines={2}>
          {item.note.trim()}
        </Text>
      ) : (
        <Text style={[styles.miniNoteMuted, { color: COLORS.MUTED }]}>
          Not yok
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { COLORS } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const top3 = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return arr.slice(0, 3);
  }, [items]);

  const hero = top3.length ? top3[0] : null;
  const others = top3.length > 1 ? top3.slice(1) : [];

  const fetchFeedbacks = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setRefreshing(true);
    else setLoading(true);

    try {
      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        setItems([]);
        return;
      }

      const res = await fetch(`${API_BASE}/mobile/feedback`, {
        method: "GET",
        headers: { Accept: "application/json", ...auth },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Feedback alınamadı (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      showError(e?.message || "Feedback alınamadı");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks({ silent: true });
  }, []);

  return (
    <Screen>
      <View style={[styles.root, { backgroundColor: COLORS.BG }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: COLORS.TEXT }]}>
              Feedback Merkezi
            </Text>
            <Text style={[styles.headerSub, { color: COLORS.MUTED }]}>
              Son 3 günlük değerlendirmelerin
            </Text>
          </View>

          <Pressable
            onPress={() => fetchFeedbacks()}
            disabled={refreshing}
            style={[
              styles.refreshBtn,
              {
                borderColor: COLORS.BORDER,
                backgroundColor: COLORS.CARD,
                opacity: refreshing ? 0.65 : 1,
              },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={COLORS.TEXT} />
                <Text style={[styles.refreshText, { color: COLORS.TEXT }]}>Yenile</Text>
              </>
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: COLORS.MUTED }]}>Yükleniyor…</Text>
          </View>
        ) : !hero ? (
          <View style={[styles.emptyBox, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
            <Text style={[styles.emptyTitle, { color: COLORS.TEXT }]}>Henüz feedback yok</Text>
            <Text style={[styles.emptyDesc, { color: COLORS.MUTED }]}>
              İlk feedback geldiğinde burada görünecek.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Hero item={hero} COLORS={COLORS} />

            {others.length ? (
              <View style={{ gap: 10 }}>
                <Text style={[styles.sectionTitle, { color: COLORS.MUTED }]}>
                  Önceki 2 feedback
                </Text>

                {others.map((x) => (
                  <MiniCard key={x.id} item={x} COLORS={COLORS} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.25 },
  headerSub: { fontSize: 12, marginTop: 4 },

  refreshBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: { fontSize: 12, fontWeight: "900" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13 },

  emptyBox: { borderWidth: 1, borderRadius: 18, padding: 14 },
  emptyTitle: { fontSize: 14, fontWeight: "900" },
  emptyDesc: { fontSize: 13, lineHeight: 18, marginTop: 6 },

  sectionTitle: { fontSize: 12, fontWeight: "900", letterSpacing: 0.2, marginTop: 2 },

  /* ===== Hero ===== */
  heroOuter: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    left: -40,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.9,
  },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 16, fontWeight: "900" },
  heroMeta: { fontSize: 12, marginTop: 2 },

  scoreChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scoreChipText: { fontSize: 12, fontWeight: "900" },

  heroBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },

  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: { fontSize: 12, fontWeight: "800" },

  noteBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  noteMuted: { flex: 1, fontSize: 13 },

  /* ===== Mini Cards ===== */
  miniCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  miniTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  miniDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniTitle: { fontSize: 14, fontWeight: "900" },
  miniMeta: { fontSize: 12, marginTop: 2 },
  miniNote: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  miniNoteMuted: { fontSize: 12, marginTop: 8 },
});
