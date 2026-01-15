import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";

const API_BASE =
  (process.env as any)?.EXPO_PUBLIC_API_BASE ??
  "https://notification-backend-production-9c18.up.railway.app";


async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("accessToken");
  console.log("DEBUG: accessToken present?", !!token);
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

const showSuccess = (msg: string) =>
  Toast.show({ type: "success", text1: msg, position: "bottom", visibilityTime: 1200 });

const showError = (msg: string) =>
  Toast.show({ type: "error", text1: msg, position: "bottom", visibilityTime: 2000 });

type SurveyItem = {
  id: number;
  title: string;
  description?: string | null;
  questionCount?: number;
  createdAt?: string | null;
  publishedAt?: string | null;
  status?: string;
  startAt?: string | null;
  endAt?: string | null;
};

/** ✅ Manuel statik test anketleri (her zaman listede gözüksün) */
const STATIC_TEST_SURVEYS: SurveyItem[] = [
  {
    id: 900001,
    title: "Deneme 2",
    description: "Tüm kullanıcılar • Taslak • 30.12.2025 14:54",
    questionCount: 0,
    publishedAt: "2025-12-30T14:54:00.000Z",
    status: "DRAFT",
  },
  {
    id: 900002,
    title: "Deneme",
    description: "Tüm kullanıcılar • Aktif • 30.12.2025 13:59",
    questionCount: 0,
    publishedAt: "2025-12-30T13:59:00.000Z",
    status: "ACTIVE",
  },
];

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
  return `${Math.floor(h / 24)} gün önce`;
}

export default function SurveysScreen({ navigation }: any) {
  const { COLORS } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<SurveyItem[]>([]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setRefreshing(true);
    else setLoading(true);

    try {
      const auth = await getAuthHeaders();

      // debug: token detay (kısaltılmış) — tam token'ı loglamıyoruz
      const _token = await SecureStore.getItemAsync("accessToken");
      if (_token) {
        console.log("DEBUG: token preview", _token.slice(0, 6) + "...", "len:", _token.length);
      } else {
        console.log("DEBUG: no token present");
      }

      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        setItems([...STATIC_TEST_SURVEYS]); // statikler yine görünsün
        return;
      }

      const res = await fetch(`${API_BASE}/mobile/surveys/active`, {
        method: "GET",
        headers: { Accept: "application/json", ...auth },
      });

      // detaylı debug: status + body (JSON veya text)
      const resText = await res.text().catch(() => "");
      console.log("DEBUG: /mobile/surveys/active status", res.status);
      console.log("DEBUG: /mobile/surveys/active body", resText);

      let data: any = null;
      try {
        data = resText ? JSON.parse(resText) : null;
      } catch {
        data = resText;
      }

      // ✅ ProfileScreen mantığı: 401/403 → oturum hatası
      if (res.status === 401 || res.status === 403) {
        try {
          await SecureStore.deleteItemAsync("accessToken");
        } catch {}

        showError("Geçersiz oturum. Lütfen tekrar giriş yap.");
        setItems([...STATIC_TEST_SURVEYS]); // statikler yine görünsün
        navigation.replace?.("Auth");
        return;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || `Anketler alınamadı (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      /**
       * ✅ Backend şu an: survey ?? null döndürüyor (tek obje).
       * O yüzden burada normalize ediyoruz:
       * - null => []
       * - obje => [obje]
       * - array => array
       */
      const listRaw: any[] = Array.isArray(data) ? data : data ? [data] : [];

      const mapped: SurveyItem[] = listRaw
        .filter(Boolean)
        .map((s: any) => ({
          id: Number(s.id ?? s.surveyId ?? 0),
          title: String(s.title ?? "Başlıksız anket"),
          description: s.description ?? null,
          // active endpoint select'inde questionCount yok; detail'den gelecek.
          questionCount: Number(s.questionCount ?? s.questionsCount ?? s.questions?.length ?? 0),
          createdAt: s.createdAt ?? null,
          publishedAt: s.publishedAt ?? null,
          startAt: s.startAt ?? null,
          endAt: s.endAt ?? null,
          status: (s.status ?? "PUBLISHED").toString(),
        }))
        .filter((x) => x.id > 0);

      /** ✅ Statikleri en üste ekle */
      const combined = [...STATIC_TEST_SURVEYS, ...mapped];

      setItems(combined);
      if (!silent) showSuccess("Güncellendi ✅");
    } catch (e: any) {
      showError(e?.message || "Anketler alınamadı");
      setItems([...STATIC_TEST_SURVEYS]); // hata olsa bile statikler görünsün
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load({ silent: true });
  }, [load]);

  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.BG }]}>
      <View style={{ height: topSpacer }} />

      <View style={[styles.root, { backgroundColor: COLORS.BG }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              hitSlop={12}
              onPress={() => navigation?.openDrawer?.()}
              style={[
                styles.iconBtn,
                { backgroundColor: "rgba(255,255,255,0.06)", borderColor: COLORS.BORDER },
              ]}
            >
              <Ionicons name="menu" size={20} color={COLORS.TEXT} />
            </Pressable>

            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: COLORS.TEXT }]}>Anketler</Text>
              <Text style={[styles.sub, { color: COLORS.MUTED }]}>
                Sana özel gönderilen anketleri cevapla
              </Text>

              {/* ✅ senin istediğin gibi */}
              <Text style={[styles.countText, { color: COLORS.MUTED }]}>
                Toplam {items.length} anket. Pagination ileride eklen.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => load({ silent: false })}
            disabled={refreshing}
            style={[
              styles.refreshBtn,
              {
                borderColor: COLORS.BORDER,
                backgroundColor: "rgba(255,255,255,0.06)",
                opacity: refreshing ? 0.6 : 1,
              },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={18} color={COLORS.TEXT} />
                <Text style={[styles.refreshText, { color: COLORS.TEXT }]}>Yenile</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: COLORS.MUTED }]}>Yükleniyor…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
              <Ionicons name="clipboard-outline" size={22} color={COLORS.PRIMARY} />
            </View>

            <Text style={[styles.emptyTitle, { color: COLORS.TEXT }]}>Henüz anket yok</Text>
            <Text style={[styles.emptyDesc, { color: COLORS.MUTED }]}>
              Yeni bir anket geldiğinde burada görünecek.
            </Text>

            <Pressable
              onPress={() => load({ silent: false })}
              style={[styles.primaryBtn, { backgroundColor: COLORS.PRIMARY }]}
            >
              <Ionicons name="refresh" size={18} color={"#0B1220"} />
              <Text style={styles.primaryBtnText}>Kontrol Et</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 12 }}>
              {items.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => navigation.navigate("SurveyDetail", { id: s.id })}
                  style={[
                    styles.card,
                    { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, { color: COLORS.TEXT }]} numberOfLines={2}>
                      {s.title}
                    </Text>

                    <View style={styles.metaWrap}>
                      <Ionicons name="time-outline" size={14} color={COLORS.MUTED} />
                      <Text style={[styles.cardMeta, { color: COLORS.MUTED }]}>
                        {formatRelative(s.publishedAt || s.createdAt || null)}
                      </Text>
                    </View>
                  </View>

                  {s.description ? (
                    <Text style={[styles.cardDesc, { color: COLORS.MUTED }]} numberOfLines={3}>
                      {s.description}
                    </Text>
                  ) : null}

                  <View style={styles.cardBottom}>
                    <View
                      style={[
                        styles.pill,
                        { backgroundColor: COLORS.PRIMARY_SOFT, borderColor: COLORS.PRIMARY },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: COLORS.PRIMARY }]}>
                        {Number.isFinite(s.questionCount || 0) ? s.questionCount : 0} soru
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.cta, { color: COLORS.MUTED }]}>Detaya git</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.MUTED} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  root: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  headerTextWrap: { flex: 1, gap: 2 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 22, fontWeight: "900", letterSpacing: 0.2 },
  sub: { fontSize: 12, marginTop: 0 },
  countText: { fontSize: 12, marginTop: 6 },

  refreshBtn: {
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshText: { fontSize: 12, fontWeight: "900" },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { fontSize: 13 },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    gap: 10,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "900" },
  emptyDesc: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  primaryBtn: {
    marginTop: 6,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#0B1220", fontSize: 14, fontWeight: "900" },

  card: { borderWidth: 1, borderRadius: 18, padding: 14 },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: "900" },

  metaWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  cardMeta: { fontSize: 12 },

  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 8 },

  cardBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: "900" },
  cta: { fontSize: 12, fontWeight: "800" },
});
