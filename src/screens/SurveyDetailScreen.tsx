import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
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
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

const showSuccess = (msg: string) =>
  Toast.show({ type: "success", text1: msg, position: "bottom", visibilityTime: 1400 });

const showError = (msg: string) =>
  Toast.show({ type: "error", text1: msg, position: "bottom", visibilityTime: 2200 });

type SurveyOption = { id: number; text: string };
type SurveyQuestion = { id: number; text: string; options: SurveyOption[] };

type SurveyDetail = {
  id: number;
  title: string;
  description?: string | null;
  questions: SurveyQuestion[];
  answered?: boolean;
};

/* =======================
   ✅ STATIK TEST DETAYLAR
   ======================= */
const STATIC_SURVEY_DETAILS: Record<number, SurveyDetail> = {
  900001: {
    id: 900001,
    title: "asfdhıjnkfdsışujdansşıjofdsakşnjfds",
    description: "Tüm kullanıcılar • Taslak • 30.12.2025 14:54",
    answered: false,
    questions: [
      {
        id: 910001,
        text: "Bu anketi nasıl buldun?",
        options: [
          { id: 920001, text: "Harika" },
          { id: 920002, text: "İdare eder" },
          { id: 920003, text: "Kötü" },
        ],
      },
      {
        id: 910002,
        text: "Uygulamayı bir arkadaşına önerir misin?",
        options: [
          { id: 920004, text: "Evet" },
          { id: 920005, text: "Belki" },
          { id: 920006, text: "Hayır" },
        ],
      },
    ],
  },

  900002: {
    id: 900002,
    title: "ndjsfşfjsdnfkdsajfdşdfsajkşşfdsfds",
    description: "Tüm kullanıcılar • Aktif • 30.12.2025 13:59",
    answered: false,
    questions: [
      {
        id: 910003,
        text: "Bildirim sıklığı senin için uygun mu?",
        options: [
          { id: 920007, text: "Az" },
          { id: 920008, text: "Tam kararında" },
          { id: 920009, text: "Fazla" },
        ],
      },
      {
        id: 910004,
        text: "En çok hangi içerik türünü seversin?",
        options: [
          { id: 920010, text: "Motivasyon" },
          { id: 920011, text: "Alışkanlık" },
          { id: 920012, text: "Sağlık" },
        ],
      },
      {
        id: 910005,
        text: "Genel memnuniyetin kaç?",
        options: [
          { id: 920013, text: "1" },
          { id: 920014, text: "2" },
          { id: 920015, text: "3" },
          { id: 920016, text: "4" },
          { id: 920017, text: "5" },
        ],
      },
    ],
  },
};

export default function SurveyDetailScreen({ route, navigation }: any) {
  const { COLORS } = useTheme();
  const surveyId = Number(route?.params?.id);

  const isStatic = Number.isFinite(surveyId) && !!STATIC_SURVEY_DETAILS[surveyId];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<SurveyDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);

      if (isStatic) {
        setDetail(STATIC_SURVEY_DETAILS[surveyId]);
        setAnswers({});
        return;
      }

      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        setDetail(null);
        return;
      }

      const res = await fetch(`${API_BASE}/mobile/surveys/${surveyId}`, {
        method: "GET",
        headers: { Accept: "application/json", ...auth },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.message || data?.error || `Anket alınamadı (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      const questionsRaw: any[] = Array.isArray(data?.questions) ? data.questions : [];

      const mapped: SurveyDetail = {
        id: Number(data?.id ?? surveyId),
        title: String(data?.title ?? "Anket"),
        description: data?.description ?? null,
        answered: !!(data?.answered ?? data?.isAnswered ?? false),
        questions: questionsRaw.map((q: any) => ({
          id: Number(q?.id ?? q?.questionId),
          text: String(q?.text ?? q?.title ?? ""),
          options: (Array.isArray(q?.options) ? q.options : []).map((o: any) => ({
            id: Number(o?.id ?? o?.optionId),
            text: String(o?.text ?? o?.title ?? ""),
          })),
        })),
      };

      setDetail(mapped);
      setAnswers({});
    } catch (e: any) {
      showError(e?.message || "Anket yüklenemedi");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [isStatic, surveyId]);

  useEffect(() => {
    if (!Number.isFinite(surveyId) || surveyId <= 0) {
      showError("Geçersiz anket");
      navigation.goBack();
      return;
    }
    load();
  }, [load, navigation, surveyId]);

  const totalQuestions = detail?.questions?.length ?? 0;

  const answeredCount = useMemo(() => {
    if (!detail?.questions?.length) return 0;
    let c = 0;
    for (const q of detail.questions) if (answers[q.id]) c += 1;
    return c;
  }, [answers, detail]);

  const canSubmit = useMemo(() => {
    if (!detail) return false;
    if (detail.answered) return false;
    if (submitting) return false;
    return totalQuestions > 0 && answeredCount === totalQuestions;
  }, [detail, submitting, totalQuestions, answeredCount]);

  const pick = (questionId: number, optionId: number) => {
    if (detail?.answered) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submit = useCallback(async () => {
    if (!detail) return;

    if (answeredCount !== totalQuestions) {
      showError("Lütfen tüm soruları cevapla.");
      return;
    }

    if (isStatic) {
      showSuccess("Cevapların alındı ✅");
      setDetail((prev) => (prev ? { ...prev, answered: true } : prev));
      return;
    }

    try {
      setSubmitting(true);

      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yap.");
        return;
      }

      const payload = {
        answers: Object.entries(answers).map(([qId, oId]) => ({
          questionId: Number(qId),
          optionId: Number(oId),
        })),
      };

      const res = await fetch(`${API_BASE}/mobile/surveys/${detail.id}/submit`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", ...auth },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.message || data?.error || `Gönderilemedi (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      showSuccess("Cevapların alındı ✅");
      setDetail((prev) => (prev ? { ...prev, answered: true } : prev));
    } catch (e: any) {
      showError(e?.message || "Cevaplar gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }, [answers, answeredCount, detail, isStatic, totalQuestions]);

  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.BG }]}>
      <View style={{ height: topSpacer }} />

      <View style={[styles.root, { backgroundColor: COLORS.BG }]}>
        {/* Top */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD }]}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.TEXT} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={[styles.topTitle, { color: COLORS.TEXT }]} numberOfLines={1}>
              Anket
            </Text>

            <View style={styles.progressRow}>
              <View
                style={[
                  styles.progressPill,
                  { backgroundColor: COLORS.PRIMARY_SOFT, borderColor: COLORS.PRIMARY },
                ]}
              >
                <Ionicons name="checkmark-circle" size={14} color={COLORS.PRIMARY} />
                <Text style={[styles.progressText, { color: COLORS.PRIMARY }]}>
                  {answeredCount}/{totalQuestions} tamamlandı
                </Text>
              </View>

              {detail?.answered ? (
                <View
                  style={[
                    styles.answeredPill,
                    { backgroundColor: "rgba(255,255,255,0.06)", borderColor: COLORS.BORDER },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={14} color={COLORS.MUTED} />
                  <Text style={[styles.answeredText, { color: COLORS.MUTED }]}>Cevaplandı</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={load}
            disabled={loading}
            style={[
              styles.iconBtn,
              { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD, opacity: loading ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="refresh-outline" size={16} color={COLORS.TEXT} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: COLORS.MUTED }]}>Yükleniyor…</Text>
          </View>
        ) : !detail ? (
          <View style={[styles.empty, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
            <Text style={[styles.emptyTitle, { color: COLORS.TEXT }]}>Anket yüklenemedi</Text>
            <Text style={[styles.emptyDesc, { color: COLORS.MUTED }]}>Yenile veya geri dön.</Text>

            <Pressable
              onPress={load}
              style={[
                styles.retryBtn,
                { backgroundColor: COLORS.PRIMARY, opacity: 1 },
              ]}
            >
              <Ionicons name="refresh" size={18} color={"#0B1220"} />
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
              <Text style={[styles.title, { color: COLORS.TEXT }]}>{detail.title}</Text>

              {detail.description ? (
                <Text style={[styles.desc, { color: COLORS.MUTED }]}>{detail.description}</Text>
              ) : null}
            </View>

            {/* Questions */}
            <View style={{ gap: 12, marginTop: 12 }}>
              {detail.questions.map((q, idx) => {
                const selected = answers[q.id];

                return (
                  <View
                    key={q.id}
                    style={[styles.qCard, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}
                  >
                    <Text style={[styles.qTitle, { color: COLORS.TEXT }]}>
                      {idx + 1}. {q.text}
                    </Text>

                    <View style={{ gap: 10, marginTop: 10 }}>
                      {q.options.map((opt) => {
                        const active = selected === opt.id;

                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => pick(q.id, opt.id)}
                            disabled={detail.answered}
                            style={[
                              styles.opt,
                              {
                                borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                                backgroundColor: active ? COLORS.PRIMARY_SOFT : COLORS.CARD,
                                opacity: detail.answered ? 0.7 : 1,
                              },
                              active && styles.optActiveShadow,
                            ]}
                          >
                            <View
                              style={[
                                styles.checkWrap,
                                {
                                  borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                                  backgroundColor: active ? COLORS.PRIMARY : "transparent",
                                },
                              ]}
                            >
                              {active ? (
                                <Ionicons name="checkmark" size={14} color={COLORS.CARD} />
                              ) : null}
                            </View>

                            <Text
                              style={[
                                styles.optText,
                                { color: active ? COLORS.TEXT : COLORS.TEXT, opacity: active ? 1 : 0.92 },
                              ]}
                              numberOfLines={2}
                            >
                              {opt.text}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Submit */}
            <View style={{ marginTop: 14 }}>
              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: COLORS.PRIMARY },
                  (!canSubmit || submitting) && { opacity: 0.55 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="send" size={16} color={"#0B1220"} />
                    <Text style={[styles.submitText, { color: "#0B1220" }]}>
                      {detail.answered ? "Cevaplandı" : "Gönder"}
                    </Text>
                  </View>
                )}
              </Pressable>

              {!detail.answered && answeredCount !== totalQuestions ? (
                <Text style={[styles.hint, { color: COLORS.MUTED }]}>
                  Göndermek için tüm soruları cevapla.
                </Text>
              ) : null}

              {detail.answered ? (
                <Text style={[styles.hint, { color: COLORS.MUTED }]}>
                  Bu anket daha önce cevaplandı.
                </Text>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  root: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 18, fontWeight: "900" },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
  progressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressText: { fontSize: 12, fontWeight: "900" },

  answeredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  answeredText: { fontSize: 12, fontWeight: "800" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  loadingText: { fontSize: 13 },

  empty: { borderWidth: 1, borderRadius: 18, padding: 14 },
  emptyTitle: { fontSize: 14, fontWeight: "900" },
  emptyDesc: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  retryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  retryText: { color: "#0B1220", fontSize: 14, fontWeight: "900" },

  hero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    // soft "card" hissi
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "900", lineHeight: 24 },
  desc: { fontSize: 13, marginTop: 8, lineHeight: 18 },

  qCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  qTitle: { fontSize: 14, fontWeight: "900", lineHeight: 20 },

  opt: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optActiveShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  optText: { fontSize: 13, fontWeight: "800" },

  submitBtn: { height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 14, fontWeight: "900" },
  hint: { marginTop: 10, fontSize: 12, textAlign: "center" },
});
