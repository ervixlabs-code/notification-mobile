// src/screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

/* ========= API BASE ========= */
const API_BASE =
  (process.env as any)?.EXPO_PUBLIC_API_BASE ??
  "https://notification-backend-production-9c18.up.railway.app";


/* ========= Tipler (Prisma ile uyumlu) ========= */
type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
type StressLevel = "LOW" | "MEDIUM" | "HIGH";
type ContentTypePreference =
  | "VIDEO"
  | "ARTICLE"
  | "QUIZ"
  | "PODCAST"
  | "SHORT_NOTES";
type MotivationType =
  | "MONEY"
  | "STATUS_APPROVAL"
  | "SECURITY_COMFORT"
  | "LOVE_ACCEPTANCE"
  | "FREEDOM"
  | "SUCCESS_POWER";
type BiggestStruggle =
  | "FOCUS"
  | "RELATIONSHIPS"
  | "MONEY_MANAGEMENT"
  | "SELF_CONFIDENCE"
  | "HEALTH_DISCIPLINE"
  | "WORK_LIFE"
  | "MOTIVATION";

type ProfileForm = {
  fullName: string;
  birthYear: string;
  city: string;
  occupation: string;

  gender?: Gender;
  stressLevel?: StressLevel;
  preferredContent: ContentTypePreference[];

  mainMotivation?: MotivationType;
  biggestStruggle?: BiggestStruggle;
};

type MeResponse = {
  user?: {
    fullName?: string | null;
    birthYear?: number | null;
    city?: string | null;
    occupation?: string | null;
    gender?: Gender | null;

    stressLevel?: StressLevel | null;
    preferredContent?: ContentTypePreference[] | null;

    mainMotivation?: MotivationType | null;
    biggestStruggle?: BiggestStruggle | null;
  };

  fullName?: string | null;
  birthYear?: number | null;
  city?: string | null;
  occupation?: string | null;
  gender?: Gender | null;

  stressLevel?: StressLevel | null;
  preferredContent?: ContentTypePreference[] | null;

  mainMotivation?: MotivationType | null;
  biggestStruggle?: BiggestStruggle | null;
};

const GENDER_OPTIONS: {
  label: string;
  value: Gender;
  icon?: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Kadın", value: "FEMALE", icon: "female-outline" },
  { label: "Erkek", value: "MALE", icon: "male-outline" },
  { label: "Diğer", value: "OTHER", icon: "sparkles-outline" },
  {
    label: "Söylemek istemiyorum",
    value: "PREFER_NOT_TO_SAY",
    icon: "eye-off-outline",
  },
];

const STRESS_OPTIONS: { label: string; value: StressLevel }[] = [
  { label: "Düşük", value: "LOW" },
  { label: "Orta", value: "MEDIUM" },
  { label: "Yüksek", value: "HIGH" },
];

const CONTENT_OPTIONS: {
  label: string;
  value: ContentTypePreference;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Video", value: "VIDEO", icon: "play-circle-outline" },
  { label: "Yazı", value: "ARTICLE", icon: "document-text-outline" },
  { label: "Quiz", value: "QUIZ", icon: "help-circle-outline" },
  { label: "Podcast", value: "PODCAST", icon: "mic-outline" },
  { label: "Kısa notlar", value: "SHORT_NOTES", icon: "reader-outline" },
];

const MOTIVATION_OPTIONS: { label: string; value: MotivationType }[] = [
  { label: "Para", value: "MONEY" },
  { label: "Statü & onay", value: "STATUS_APPROVAL" },
  { label: "Güvenlik & konfor", value: "SECURITY_COMFORT" },
  { label: "Sevgi & kabul görme", value: "LOVE_ACCEPTANCE" },
  { label: "Özgürlük", value: "FREEDOM" },
  { label: "Başarı & güç", value: "SUCCESS_POWER" },
];

const STRUGGLE_OPTIONS: { label: string; value: BiggestStruggle }[] = [
  { label: "Odaklanma", value: "FOCUS" },
  { label: "İlişkiler", value: "RELATIONSHIPS" },
  { label: "Para yönetimi", value: "MONEY_MANAGEMENT" },
  { label: "Kendine güven", value: "SELF_CONFIDENCE" },
  { label: "Sağlık & disiplin", value: "HEALTH_DISCIPLINE" },
  { label: "İş hayatı", value: "WORK_LIFE" },
  { label: "Motivasyon", value: "MOTIVATION" },
];

/* ========= Toast helpers (Login ile aynı) ========= */
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

function Chip({
  label,
  active,
  onPress,
  COLORS,
  iconName,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  COLORS: any;
  iconName?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? COLORS.PRIMARY_SOFT : COLORS.CARD,
          borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
        },
      ]}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={16}
          color={active ? COLORS.PRIMARY : COLORS.MUTED}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? COLORS.PRIMARY : COLORS.TEXT },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export default function ProfileScreen() {
  const { COLORS, isDark, setIsDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    birthYear: "",
    city: "",
    occupation: "",
    gender: undefined,
    stressLevel: undefined,
    preferredContent: [],
    mainMotivation: undefined,
    biggestStruggle: undefined,
  });

  const updateField = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const toggleContent = (v: ContentTypePreference) => {
    setForm((p) => {
      const exists = p.preferredContent.includes(v);
      return {
        ...p,
        preferredContent: exists
          ? p.preferredContent.filter((x) => x !== v)
          : [...p.preferredContent, v],
      };
    });
  };

  const canSave = useMemo(() => true, [form]);

  /* ========= Prefill: /mobile/me ========= */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const auth = await getAuthHeaders();
        if (!auth) {
          showError("Token bulunamadı. Lütfen tekrar giriş yapın.");
          return;
        }

        const res = await fetch(`${API_BASE}/mobile/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...auth,
          },
        });

        const data: MeResponse = await res.json();

        if (!res.ok) {
          const msg =
            (data as any)?.message ||
            (data as any)?.error ||
            "Profil bilgileri alınamadı";
          throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
        }

        const src = data.user ?? data;

        if (!mounted) return;

        setForm((p) => ({
          ...p,
          fullName: (src.fullName ?? "") || "",
          birthYear: src.birthYear ? String(src.birthYear) : "",
          city: (src.city ?? "") || "",
          occupation: (src.occupation ?? "") || "",
          gender: (src.gender ?? undefined) || undefined,
          stressLevel: (src.stressLevel ?? undefined) || undefined,
          preferredContent: (src.preferredContent ?? []) || [],
          mainMotivation: (src.mainMotivation ?? undefined) || undefined,
          biggestStruggle: (src.biggestStruggle ?? undefined) || undefined,
        }));
      } catch (e: any) {
        showError(e?.message || "Profil bilgileri alınamadı");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========= Save: /mobile/profile PATCH ========= */
  const handleSave = async () => {
    try {
      setSaving(true);

      const auth = await getAuthHeaders();
      if (!auth) {
        showError("Token bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }

      const birthYearNum = form.birthYear.trim()
        ? Number(form.birthYear.trim())
        : null;

      const payload: any = {
        fullName: form.fullName.trim() || null,
        birthYear: Number.isFinite(birthYearNum as any) ? birthYearNum : null,
        city: form.city.trim() || null,
        occupation: form.occupation.trim() || null,
        gender: form.gender ?? null,
        stressLevel: form.stressLevel ?? null,
        preferredContent: form.preferredContent ?? [],
        mainMotivation: form.mainMotivation ?? null,
        biggestStruggle: form.biggestStruggle ?? null,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === null) delete payload[k];
      });

      const res = await fetch(`${API_BASE}/mobile/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...auth,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message || data?.error || "Kaydetme sırasında hata oluştu";
        throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
      }

      showSuccess("Ayarlar kaydedildi ✅");
    } catch (e: any) {
      showError(e?.message || "Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={[styles.root, { backgroundColor: COLORS.BG }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.brandMark,
                  { backgroundColor: COLORS.PRIMARY_SOFT },
                ]}
              >
                <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
              </View>
              <Text style={[styles.brandText, { color: COLORS.TEXT }]}>
                NovaMe
              </Text>
            </View>

            <Text style={[styles.h1, { color: COLORS.TEXT }]}>
              Profil & Ayarlar
            </Text>
            <Text style={[styles.desc, { color: COLORS.MUTED }]}>
              Seni daha iyi tanıyalım; böylece bildirimleri tam sana göre
              düzenleyelim. ✨
            </Text>

            {loading ? (
              <Text style={[styles.loadingText, { color: COLORS.MUTED }]}>
                Yükleniyor…
              </Text>
            ) : null}
          </View>

          {/* Tema */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>
              Tema
            </Text>
            <Text style={[styles.sectionSub, { color: COLORS.MUTED }]}>
              Görünümü dilediğin gibi ayarla.
            </Text>

            <View
              style={[
                styles.themeRow,
                { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER },
              ]}
            >
              <Pressable
                onPress={() => setIsDark(true)}
                style={[
                  styles.themeBtn,
                  isDark && {
                    borderColor: COLORS.PRIMARY,
                    backgroundColor: COLORS.PRIMARY_SOFT,
                  },
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={16}
                  color={isDark ? COLORS.PRIMARY : COLORS.MUTED}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: isDark ? COLORS.PRIMARY : COLORS.MUTED,
                    fontWeight: "700",
                  }}
                >
                  Dark
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setIsDark(false)}
                style={[
                  styles.themeBtn,
                  !isDark && {
                    borderColor: COLORS.PRIMARY,
                    backgroundColor: COLORS.PRIMARY_SOFT,
                  },
                ]}
              >
                <Ionicons
                  name="sunny-outline"
                  size={16}
                  color={!isDark ? COLORS.PRIMARY : COLORS.MUTED}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: !isDark ? COLORS.PRIMARY : COLORS.MUTED,
                    fontWeight: "700",
                  }}
                >
                  Light
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: COLORS.BORDER }]} />

          {/* A. Temel Bilgiler */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>
              A. Temel Bilgiler
            </Text>
            <Text style={[styles.sectionSub, { color: COLORS.MUTED }]}>
              Kısa bilgiler; daha iyi öneriler için.
            </Text>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>Ad Soyad</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.CARD,
                  borderColor: COLORS.BORDER,
                  color: COLORS.TEXT,
                },
              ]}
              placeholder="Adını ve soyadını gir"
              placeholderTextColor={COLORS.MUTED}
              value={form.fullName}
              onChangeText={(t) => updateField("fullName", t)}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.label, { color: COLORS.MUTED }]}>
                  Doğum Yılı
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: COLORS.CARD,
                      borderColor: COLORS.BORDER,
                      color: COLORS.TEXT,
                    },
                  ]}
                  placeholder="1995"
                  placeholderTextColor={COLORS.MUTED}
                  keyboardType="numeric"
                  value={form.birthYear}
                  onChangeText={(t) => updateField("birthYear", t)}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.label, { color: COLORS.MUTED }]}>Şehir</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: COLORS.CARD,
                      borderColor: COLORS.BORDER,
                      color: COLORS.TEXT,
                    },
                  ]}
                  placeholder="Yaşadığın şehir"
                  placeholderTextColor={COLORS.MUTED}
                  value={form.city}
                  onChangeText={(t) => updateField("city", t)}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>Meslek</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.CARD,
                  borderColor: COLORS.BORDER,
                  color: COLORS.TEXT,
                },
              ]}
              placeholder="Ne işle meşgulsün?"
              placeholderTextColor={COLORS.MUTED}
              value={form.occupation}
              onChangeText={(t) => updateField("occupation", t)}
            />

            <Text
              style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}
            >
              Cinsiyet
            </Text>
            <View style={styles.chipsWrap}>
              {GENDER_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.gender === o.value}
                  onPress={() => updateField("gender", o.value)}
                  COLORS={COLORS}
                  iconName={o.icon}
                />
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: COLORS.BORDER }]} />

          {/* D. Yaşam tarzı & içerik */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>
              D. Yaşam Tarzı & İçerik
            </Text>
            <Text style={[styles.sectionSub, { color: COLORS.MUTED }]}>
              Günlük ritmine göre içerik seçelim.
            </Text>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Son dönemde stres seviyen
            </Text>
            <View style={styles.chipsWrap}>
              {STRESS_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.stressLevel === o.value}
                  onPress={() => updateField("stressLevel", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Hangi formatta içeriklerden hoşlanırsın?
            </Text>
            <View style={styles.chipsWrap}>
              {CONTENT_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.preferredContent.includes(o.value)}
                  onPress={() => toggleContent(o.value)}
                  COLORS={COLORS}
                  iconName={o.icon}
                />
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: COLORS.BORDER }]} />

          {/* E. Psikoloji & motivasyon */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>
              E. Psikoloji & Motivasyon
            </Text>
            <Text style={[styles.sectionSub, { color: COLORS.MUTED }]}>
              Seni en çok ne harekete geçiriyor?
            </Text>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Ana motivasyon
            </Text>
            <View style={styles.chipsWrap}>
              {MOTIVATION_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.mainMotivation === o.value}
                  onPress={() => updateField("mainMotivation", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              En çok nerede zorlanıyorsun?
            </Text>
            <View style={styles.chipsWrap}>
              {STRUGGLE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.biggestStruggle === o.value}
                  onPress={() => updateField("biggestStruggle", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>
          </View>

          {/* Kaydet */}
          <Pressable
            disabled={!canSave || saving}
            onPress={handleSave}
            style={[
              styles.saveBtn,
              {
                backgroundColor: saving ? COLORS.PRIMARY_SOFT : COLORS.PRIMARY,
                opacity: !canSave ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.saveText, { color: COLORS.CARD }]}>
              {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Text>
          </Pressable>

          <View style={{ height: 18 }} />
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20 },

  header: { marginBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  brandText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.2 },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  loadingText: { fontSize: 12, marginTop: 10 },

  section: { paddingVertical: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionSub: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 10 },

  divider: { height: 1, marginVertical: 12 },

  label: { fontSize: 12, marginTop: 10, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
  },

  twoColRow: { flexDirection: "row", marginTop: 10 },

  themeRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginHorizontal: 4,
  },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: { fontSize: 13, fontWeight: "700" },

  saveBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
});
