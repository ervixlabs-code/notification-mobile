// src/screens/HomeScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

/* ========= API BASE ========= */
const API_BASE = "https://notification-backend-znes.onrender.com";


/* ========= Toast helpers ========= */
const showSuccess = (msg: string) => {
  Toast.show({
    type: "success",
    text1: msg,
    position: "bottom",
    visibilityTime: 1200,
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

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* =========================
   ✅ FEEDBACK STORE HELPERS
   ========================= */
const FEEDBACK_DAY_KEY = "dailyFeedbackSubmittedDate";

async function hasSubmittedFeedbackToday() {
  const today = todayISO();
  const v = await SecureStore.getItemAsync(FEEDBACK_DAY_KEY);
  return v === today;
}

async function markFeedbackSubmittedToday() {
  const today = todayISO();
  await SecureStore.setItemAsync(FEEDBACK_DAY_KEY, today);
}

/* ================= Types ================= */
type RecentNotif = {
  userNotificationId: number;
  notificationId: number;
  title: string;
  body: string;
  status: "PENDING" | "SCHEDULED" | "SENT" | "FAILED" | string;
  deliveredAt?: string | null;
  shownAt?: string | null;
  openedAt?: string | null;
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

function statusLabel(s: string) {
  const v = String(s || "").toUpperCase();
  if (v === "SENT") return "Gönderildi";
  if (v === "FAILED") return "Başarısız";
  if (v === "SCHEDULED") return "Planlandı";
  if (v === "PENDING") return "Bekliyor";
  return v;
}

/**
 * ✅ Dedupe + sort
 */
function normalizeRecent(input: RecentNotif[]) {
  const arr = Array.isArray(input) ? input : [];

  const byUserNotif = new Map<number, RecentNotif>();
  for (const n of arr) {
    if (!n || typeof n.userNotificationId !== "number") continue;
    if (!byUserNotif.has(n.userNotificationId)) byUserNotif.set(n.userNotificationId, n);
  }
  const step1 = Array.from(byUserNotif.values());

  const seen = new Set<string>();
  const out: RecentNotif[] = [];
  for (const n of step1) {
    const key = `${n.notificationId || 0}::${n.deliveredAt || ""}::${(n.title || "").slice(0, 32)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }

  out.sort((a, b) => {
    const ta = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
    const tb = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
    return tb - ta;
  });

  return out;
}

/**
 * ✅ “Son 24 saat” filtresi
 */
function isWithinLast24Hours(n: RecentNotif) {
  const dStr = n.deliveredAt || n.shownAt || n.openedAt;
  if (!dStr) return false;
  const t = new Date(dStr).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= 24 * 60 * 60 * 1000;
}

function Pill({
  text,
  active,
  COLORS,
}: {
  text: string;
  active?: boolean;
  COLORS: any;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: active ? COLORS.PRIMARY_SOFT : COLORS.CARD,
          borderColor: COLORS.BORDER,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: active ? COLORS.PRIMARY : COLORS.MUTED },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SmallCard({
  n,
  COLORS,
  onPress,
}: {
  n: RecentNotif;
  COLORS: any;
  onPress: () => void;
}) {
  const isOpened = !!n.openedAt;

  return (
    <Pressable onPress={onPress} style={{ borderRadius: 18 }}>
      <View
        style={[
          styles.smallCard,
          { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD },
        ]}
      >
        <View style={styles.smallTop}>
          <Text style={[styles.smallTitle, { color: COLORS.TEXT }]} numberOfLines={1}>
            {n.title}
          </Text>
          <Text style={[styles.smallMeta, { color: COLORS.MUTED }]}>
            {formatRelative(n.deliveredAt)}
          </Text>
        </View>

        <Text style={[styles.smallBody, { color: COLORS.MUTED }]} numberOfLines={2}>
          {n.body}
        </Text>

        <View style={styles.pillsRow}>
          <Pill text={isOpened ? "Okundu" : "Okunmadı"} active={!isOpened} COLORS={COLORS} />
          <Pill text={statusLabel(n.status)} COLORS={COLORS} />
        </View>
      </View>
    </Pressable>
  );
}

/* =========================
   ✅ FEEDBACK MODAL (ONLY rating)
   ========================= */
function FeedbackModal({
  visible,
  onClose,
  COLORS,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  COLORS: any;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const canSend = !!rating && !sending;

  const reset = () => {
    setRating(null);
    setSending(false);
  };

  const close = () => {
    onClose();
    reset();
  };

  const send = async () => {
    if (!rating) return showError("Lütfen bir puan seç.");

    try {
      setSending(true);

      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        return;
      }

      // ✅ Backend sadece rating kabul ediyor
      const payload = { rating };

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
        const msg =
          data?.message ||
          data?.error ||
          (typeof data === "string" ? data : null) ||
          `Feedback gönderilemedi (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      await markFeedbackSubmittedToday();
      showSuccess("Teşekkürler! ✅");
      onSubmitted();
      close();
    } catch (e: any) {
      showError(e?.message || "Feedback gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconWrap, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
              <Ionicons name="sparkles-outline" size={16} color={COLORS.PRIMARY} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: COLORS.TEXT }]}>Bugün nasıldı?</Text>
              <Text style={[styles.modalDesc, { color: COLORS.MUTED }]}>
                Gün içindeki bildirimleri genel olarak değerlendirir misin?
              </Text>
            </View>

            <Pressable onPress={close} hitSlop={10} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={18} color={COLORS.MUTED} />
            </Pressable>
          </View>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  style={[
                    styles.ratingPill,
                    {
                      backgroundColor: COLORS.CARD,
                      borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                    },
                  ]}
                >
                  <Text style={[styles.ratingPillText, { color: active ? COLORS.PRIMARY : COLORS.TEXT }]}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalBtnRow}>
            <Pressable
              onPress={close}
              disabled={sending}
              style={[
                styles.modalSecondaryBtn,
                { backgroundColor: COLORS.BG, borderColor: COLORS.BORDER },
                sending && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.modalSecondaryText, { color: COLORS.MUTED }]}>Sonra</Text>
            </Pressable>

            <Pressable
              onPress={send}
              disabled={!canSend}
              style={[
                styles.modalPrimaryBtn,
                { backgroundColor: COLORS.PRIMARY },
                (!canSend || sending) && { opacity: 0.6 },
              ]}
            >
              {sending ? <ActivityIndicator /> : (
                <Text style={[styles.modalPrimaryText, { color: COLORS.CARD }]}>Gönder</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { COLORS } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentRaw, setRecentRaw] = useState<RecentNotif[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const recent = useMemo(() => normalizeRecent(recentRaw), [recentRaw]);
  const recent24 = useMemo(() => recent.filter(isWithinLast24Hours), [recent]);

  const top3 = useMemo(() => (recent24.length ? recent24.slice(0, 3) : []), [recent24]);
  const hero = useMemo(() => (top3.length ? top3[0] : null), [top3]);
  const others = useMemo(() => (top3.length > 1 ? top3.slice(1) : []), [top3]);

  const maybeShowFeedback = useCallback(async () => {
    try {
      if (recent24.length < 3) return;
      const submitted = await hasSubmittedFeedbackToday();
      if (submitted) return;
      setFeedbackOpen(true);
    } catch {
      // sessiz
    }
  }, [recent24.length]);

  const fetchRecent = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setRefreshing(true);
    else setLoading(true);

    try {
      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        setRecentRaw([]);
        return;
      }

      const res = await fetch(`${API_BASE}/user-notifications/recent?limit=10`, {
        method: "GET",
        headers: { Accept: "application/json", ...auth },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Bildirimler alınamadı (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      setRecentRaw(Array.isArray(data) ? data : []);
      if (!silent) showSuccess("Güncellendi ✅");

      setTimeout(() => {
        maybeShowFeedback();
      }, 0);
    } catch (e: any) {
      showError(e?.message || "Bildirimler alınamadı");
      setRecentRaw([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markOpened = useCallback(async (userNotificationId: number) => {
    const auth = await getAuthHeaders();
    if (!auth) {
      showError("Token bulunamadı. Lütfen tekrar giriş yap.");
      return false;
    }

    const res = await fetch(`${API_BASE}/user-notifications/${userNotificationId}/open`, {
      method: "PATCH",
      headers: { Accept: "application/json", ...auth },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.message || data?.error || `Okundu işaretlenemedi (${res.status})`;
      showError(Array.isArray(msg) ? msg.join("\n") : String(msg));
      return false;
    }

    return true;
  }, []);

  const onOpenNotification = useCallback(
    async (n: RecentNotif) => {
      if (!n?.userNotificationId) return;
      if (n.openedAt) return;

      const optimisticTime = new Date().toISOString();
      setRecentRaw((prev) =>
        prev.map((x) =>
          x.userNotificationId === n.userNotificationId
            ? { ...x, openedAt: x.openedAt ?? optimisticTime }
            : x
        )
      );

      const ok = await markOpened(n.userNotificationId);

      if (!ok) {
        setRecentRaw((prev) =>
          prev.map((x) =>
            x.userNotificationId === n.userNotificationId
              ? { ...x, openedAt: null }
              : x
          )
        );
      }
    },
    [markOpened]
  );

  useEffect(() => {
    fetchRecent({ silent: true });
  }, []);

  useEffect(() => {
    if (!loading) maybeShowFeedback();
  }, [loading, maybeShowFeedback]);

  return (
    <Screen>
      <View style={[styles.root, { backgroundColor: COLORS.BG }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.bellDot,
                { backgroundColor: COLORS.PRIMARY_SOFT, borderColor: COLORS.PRIMARY },
              ]}
            >
              <Ionicons name="notifications-outline" size={16} color={COLORS.PRIMARY} />
            </View>
            <Text style={[styles.headerTitle, { color: COLORS.TEXT }]}>Son Bildirimler</Text>
          </View>

          <Pressable
            onPress={() => fetchRecent()}
            disabled={refreshing}
            style={[
              styles.refreshBtn,
              { borderColor: COLORS.BORDER, opacity: refreshing ? 0.6 : 1 },
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
            <Text style={[styles.emptyTitle, { color: COLORS.TEXT }]}>Henüz bildirim yok</Text>
            <Text style={[styles.emptyDesc, { color: COLORS.MUTED }]}>
              Yeni bir bildirim geldiğinde burada görünecek.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Pressable onPress={() => onOpenNotification(hero)} style={{ borderRadius: 18 }}>
              <View style={[styles.hero, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
                <View style={styles.heroTop}>
                  <Text style={[styles.heroTitle, { color: COLORS.TEXT }]} numberOfLines={2}>
                    {hero.title}
                  </Text>
                  <Text style={[styles.heroMeta, { color: COLORS.MUTED }]}>
                    {formatRelative(hero.deliveredAt)}
                  </Text>
                </View>

                <Text style={[styles.heroBody, { color: COLORS.MUTED }]} numberOfLines={4}>
                  {hero.body}
                </Text>

                <View style={styles.pillsRow}>
                  <Pill text={hero.openedAt ? "Okundu" : "Okunmadı"} active={!hero.openedAt} COLORS={COLORS} />
                  <Pill text={statusLabel(hero.status)} COLORS={COLORS} />
                </View>
              </View>
            </Pressable>

            {others.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Text style={[styles.sectionTitle, { color: COLORS.MUTED }]}>Diğer Bildirimler</Text>
                <View style={{ gap: 10 }}>
                  {others.map((n) => (
                    <SmallCard
                      key={n.userNotificationId}
                      n={n}
                      COLORS={COLORS}
                      onPress={() => onOpenNotification(n)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}

        <FeedbackModal
          visible={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          COLORS={COLORS}
          onSubmitted={() => {
            // istersen burada refresh yap:
            // fetchRecent({ silent: true })
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", letterSpacing: -0.2 },

  refreshBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: { fontSize: 12, fontWeight: "800" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13 },

  emptyBox: { borderWidth: 1, borderRadius: 18, padding: 14 },
  emptyTitle: { fontSize: 14, fontWeight: "900" },
  emptyDesc: { fontSize: 13, lineHeight: 18, marginTop: 6 },

  hero: { borderWidth: 1, borderRadius: 18, padding: 14 },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitle: { flex: 1, fontSize: 22, fontWeight: "900", letterSpacing: -0.25 },
  heroMeta: { fontSize: 12, marginTop: 4 },
  heroBody: { fontSize: 14, lineHeight: 20, marginTop: 10 },

  sectionTitle: { fontSize: 12, fontWeight: "900", letterSpacing: 0.2 },

  smallCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  smallTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  smallTitle: { flex: 1, fontSize: 14, fontWeight: "900" },
  smallMeta: { fontSize: 12 },
  smallBody: { fontSize: 13, lineHeight: 18, marginTop: 6 },

  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: "800" },

  /* ===== Modal ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  modalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontWeight: "900" },
  modalDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  ratingRow: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 12 },
  ratingPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPillText: { fontSize: 16, fontWeight: "900" },

  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: { fontSize: 14, fontWeight: "900" },
  modalPrimaryBtn: { flex: 1, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  modalPrimaryText: { fontSize: 14, fontWeight: "900" },
});
