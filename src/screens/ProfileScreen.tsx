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
import { useNavigation } from "@react-navigation/native";


/* ========= API BASE ========= */
const API_BASE = "https://notification-backend-znes.onrender.com";

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

/* ========= NovaMe profil soruları ========= */
type EnergyDipTime =
  | "AFTERNOON_14_16"
  | "EVENING_18"
  | "MORNING_07"
  | "NIGHT_23";

type ComfortZone =
  | "COFFEE_SMELL"
  | "PLAY_WITH_PET"
  | "LISTEN_MUSIC"
  | "CHOCOLATE"
  | "WALK";

type NegativeSelfTalk =
  | "INADEQUATE"
  | "TOO_LATE"
  | "MUST_BE_PERFECT"
  | "WHAT_WILL_THEY_SAY";

type WorkContext =
  | "OFFICE_PLAZA"
  | "HOME_OFFICE"
  | "CAFE_OUTSIDE"
  | "SCHOOL_LIBRARY";
type ToneOfVoice = "SERGEANT" | "ZEN" | "LOGIC";

type BigDayType =
  | "EXAM"
  | "PRESENTATION"
  | "WEDDING"
  | "PROJECT_DEADLINE"
  | "VACATION"
  | "OTHER";

type ChildrenAgeRange =
  | "BABY_0_2"
  | "CHILD_3_12"
  | "TEEN_13_17"
  | "ADULT_18_PLUS"
  | "MIXED";

type ProfileForm = {
  fullName: string;
  birthYear: string; // sadece yıl UI'si
  city: string;
  occupation: string;

  gender?: Gender;
  stressLevel?: StressLevel;
  preferredContent: ContentTypePreference[];

  mainMotivation?: MotivationType;
  biggestStruggle?: BiggestStruggle;

  // ✅ NovaMe
  energyDipTime?: EnergyDipTime;
  comfortZones: ComfortZone[];
  petName: string;

  negativeSelfTalk?: NegativeSelfTalk;
  workContext?: WorkContext;
  toneOfVoice?: ToneOfVoice;

  bigDayType?: BigDayType;
  bigDayLabel: string;
  bigDayDate: string; // YYYY-MM-DD

  hasChildren?: boolean;
  childrenAgeRange?: ChildrenAgeRange;
};

type MeResponse = {
  user?: any;
  data?: any;
  me?: any;
  [k: string]: any;
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

/* ===== NovaMe seçenekler ===== */
const ENERGY_OPTIONS: { label: string; value: EnergyDipTime }[] = [
  { label: "Öğleden sonra (14:00-16:00)", value: "AFTERNOON_14_16" },
  { label: "Akşamüstü (18:00)", value: "EVENING_18" },
  { label: "Sabah (07:00)", value: "MORNING_07" },
  { label: "Gece (23:00)", value: "NIGHT_23" },
];

const COMFORT_OPTIONS: {
  label: string;
  value: ComfortZone;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Kahve kokusu", value: "COFFEE_SMELL", icon: "cafe-outline" },
  { label: "Evcil hayvanımla", value: "PLAY_WITH_PET", icon: "paw-outline" },
  { label: "Müzik", value: "LISTEN_MUSIC", icon: "musical-notes-outline" },
  { label: "Çikolata", value: "CHOCOLATE", icon: "heart-outline" },
  { label: "Yürüyüş", value: "WALK", icon: "walk-outline" },
];

const NEGATIVE_OPTIONS: { label: string; value: NegativeSelfTalk }[] = [
  { label: "“Yetersizim / Yapamayacağım”", value: "INADEQUATE" },
  { label: "“Çok geç kaldım”", value: "TOO_LATE" },
  { label: "“Mükemmel olmalı”", value: "MUST_BE_PERFECT" },
  { label: "“İnsanlar ne der?”", value: "WHAT_WILL_THEY_SAY" },
];

const WORK_OPTIONS: { label: string; value: WorkContext }[] = [
  { label: "Ofis/Plaza", value: "OFFICE_PLAZA" },
  { label: "Ev/Home Office", value: "HOME_OFFICE" },
  { label: "Kafe/Dışarısı", value: "CAFE_OUTSIDE" },
  { label: "Okul/Kütüphane", value: "SCHOOL_LIBRARY" },
];

const TONE_OPTIONS: { label: string; value: ToneOfVoice }[] = [
  { label: "🎖️ Sert (Çavuş modu)", value: "SERGEANT" },
  { label: "🌿 Yumuşak (Zen modu)", value: "ZEN" },
  { label: "🧠 Analitik (Mantık modu)", value: "LOGIC" },
];

const BIGDAY_OPTIONS: { label: string; value: BigDayType }[] = [
  { label: "Sınav", value: "EXAM" },
  { label: "Sunum", value: "PRESENTATION" },
  { label: "Düğün", value: "WEDDING" },
  { label: "Proje deadline", value: "PROJECT_DEADLINE" },
  { label: "Tatil", value: "VACATION" },
  { label: "Diğer", value: "OTHER" },
];

const CHILDREN_OPTIONS: { label: string; value: ChildrenAgeRange }[] = [
  { label: "0-2 (Bebek)", value: "BABY_0_2" },
  { label: "3-12 (Çocuk)", value: "CHILD_3_12" },
  { label: "13-17 (Ergen)", value: "TEEN_13_17" },
  { label: "18+ (Yetişkin)", value: "ADULT_18_PLUS" },
  { label: "Karışık", value: "MIXED" },
];

/* ========= Toast helpers ========= */
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
  const token =
    (await SecureStore.getItemAsync("accessToken")) ||
    (await SecureStore.getItemAsync("dolapai_access_token")) ||
    (await SecureStore.getItemAsync("token"));

  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/**
 * ✅ /mobile/me response şekli değişken olabiliyor:
 * - { user: {...} }
 * - { data: {...} }
 * - { user: { user: {...} } } gibi nested
 * - { data: { user: {...} } }
 *
 * Bu fonksiyon olabildiğince "gerçek user objesini" çıkarır.
 */
function normalizeMeDeep(payload: any) {
  let cur = payload;

  // ilk aday
  cur = cur?.user ?? cur?.data ?? cur?.me ?? cur ?? {};

  // bazen user içinde tekrar user var
  // (ör: { user: { user: {...} } })
  let guard = 0;
  while (cur && typeof cur === "object" && cur.user && guard < 6) {
    // eğer cur.user gerçekten daha "dolgun" obje ise ona in
    cur = cur.user;
    guard++;
  }

  // bazen { data: { user: {...}} }
  guard = 0;
  while (cur && typeof cur === "object" && cur.data && guard < 6) {
    cur = cur.data;
    guard++;
  }

  return cur ?? {};
}

function toYmd(dateIso: any): string {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function ymdToIso(ymd: string): string | null {
  const t = (ymd || "").trim();
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const iso = new Date(`${t}T00:00:00.000Z`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

/** ✅ birthYear’i mümkün olan her alandan çıkar (birthDate -> yıl türetme dahil) */
function extractBirthYear(src: any): string {
  const direct = src?.birthYear ?? src?.yearOfBirth ?? src?.birth_year;
  if (direct != null && String(direct).trim()) return String(direct);

  const birthDate =
    src?.birthDate ??
    src?.dateOfBirth ??
    src?.dob ??
    src?.birthdate ??
    src?.birth_day;

  if (birthDate) {
    // 1) Date parse
    try {
      const d = new Date(birthDate);
      if (!Number.isNaN(d.getTime())) return String(d.getFullYear());
    } catch {}

    // 2) "1998-01-01" gibi stringin başından yıl al
    const s = String(birthDate);
    const m = s.match(/^(\d{4})/);
    if (m) return m[1];
  }

  return "";
}

/** ✅ city için fallback */
function extractCity(src: any): string {
  return (
    (src?.city ??
      src?.locationCity ??
      src?.livingCity ??
      src?.residenceCity ??
      src?.town ??
      src?.location ??
      src?.hometown ??
      "") as string
  );
}

/** ✅ gender için fallback + normalize */
function extractGender(src: any): Gender | undefined {
  const g = src?.gender ?? src?.sex ?? undefined;
  const s = typeof g === "string" ? g.toUpperCase() : g;

  if (
    s === "MALE" ||
    s === "FEMALE" ||
    s === "OTHER" ||
    s === "PREFER_NOT_TO_SAY"
  ) {
    return s;
  }
  return undefined;
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

    energyDipTime: undefined,
    comfortZones: [],
    petName: "",
    negativeSelfTalk: undefined,
    workContext: undefined,
    toneOfVoice: undefined,
    bigDayType: undefined,
    bigDayLabel: "",
    bigDayDate: "",
    hasChildren: undefined,
    childrenAgeRange: undefined,
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

  const toggleComfort = (v: ComfortZone) => {
    setForm((p) => {
      const exists = p.comfortZones.includes(v);
      const next = exists
        ? p.comfortZones.filter((x) => x !== v)
        : [...p.comfortZones, v];

      const hasPet = next.includes("PLAY_WITH_PET");
      return {
        ...p,
        comfortZones: next,
        petName: hasPet ? p.petName : "",
      };
    });
  };

  const hasPetSelected = useMemo(
    () => form.comfortZones.includes("PLAY_WITH_PET"),
    [form.comfortZones]
  );

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

        const src = normalizeMeDeep(data);

        if (!mounted) return;

        const birthYearStr = extractBirthYear(src);
        const cityStr = extractCity(src);
        const genderVal = extractGender(src);

        // Debug amaçlı istersen 1 kere logla:
        // console.log("ME RAW:", data);
        // console.log("ME NORMALIZED:", src);

        setForm((p) => ({
          ...p,
          fullName: (src.fullName ?? src.name ?? "") || "",
          birthYear: birthYearStr || "",
          city: (cityStr ?? "") || "",
          occupation: (src.occupation ?? "") || "",
          gender: genderVal ?? undefined,

          stressLevel: (src.stressLevel ?? undefined) || undefined,
          preferredContent: (src.preferredContent ?? []) || [],
          mainMotivation: (src.mainMotivation ?? undefined) || undefined,
          biggestStruggle: (src.biggestStruggle ?? undefined) || undefined,

          // ✅ NovaMe
          energyDipTime: (src.energyDipTime ?? undefined) || undefined,
          comfortZones: (src.comfortZones ?? []) || [],
          petName: (src.petName ?? "") || "",
          negativeSelfTalk: (src.negativeSelfTalk ?? undefined) || undefined,
          workContext: (src.workContext ?? undefined) || undefined,
          toneOfVoice: (src.toneOfVoice ?? undefined) || undefined,
          bigDayType: (src.bigDayType ?? undefined) || undefined,
          bigDayLabel: (src.bigDayLabel ?? "") || "",
          bigDayDate: toYmd(src.bigDayDate),
          hasChildren:
            typeof src.hasChildren === "boolean" ? src.hasChildren : undefined,
          childrenAgeRange: (src.childrenAgeRange ?? undefined) || undefined,
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

  const navigation = useNavigation();

  const handleLogout = async () => {
  try {
    await SecureStore.deleteItemAsync("accessToken").catch(() => {});
    await SecureStore.deleteItemAsync("dolapai_access_token").catch(() => {});
    await SecureStore.deleteItemAsync("token").catch(() => {});

    showSuccess("Çıkış yapıldı ✅");

    // 👇 Login ekranına git
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  } catch (e: any) {
    showError("Çıkış yapılamadı");
  }
};



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

      const bigDayIso = ymdToIso(form.bigDayDate);

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

        // ✅ NovaMe
        energyDipTime: form.energyDipTime ?? null,
        comfortZones: form.comfortZones ?? [],
        petName: hasPetSelected ? form.petName.trim() || null : null,
        negativeSelfTalk: form.negativeSelfTalk ?? null,
        workContext: form.workContext ?? null,
        toneOfVoice: form.toneOfVoice ?? null,
        bigDayType: form.bigDayType ?? null,
        bigDayLabel: form.bigDayLabel.trim() || null,
        bigDayDate: bigDayIso,
        hasChildren:
          typeof form.hasChildren === "boolean" ? form.hasChildren : null,
        childrenAgeRange:
          form.hasChildren ? form.childrenAgeRange ?? null : null,
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
  <View style={{ flexDirection: "row", alignItems: "center" }}>
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

  {/* ✅ Logout */}
  <Pressable
    onPress={handleLogout}
    style={[
      styles.logoutBtn,
      { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER },
    ]}
  >
    <Ionicons name="log-out-outline" size={16} color={COLORS.MUTED} />
    <Text style={[styles.logoutText, { color: COLORS.MUTED }]}>
      Çıkış
    </Text>
  </Pressable>
</View>


            <Text style={[styles.h1, { color: COLORS.TEXT }]}>
              Profil & Ayarlar
            </Text>
            <Text style={[styles.desc, { color: COLORS.MUTED }]}>
              Seni daha iyi tanıyalım; bildirimleri tam sana göre düzenleyelim. ✨
            </Text>

            {loading ? (
              <Text style={[styles.loadingText, { color: COLORS.MUTED }]}>
                Yükleniyor…
              </Text>
            ) : null}
          </View>

          {/* Tema */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>Tema</Text>
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

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
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

          <View style={[styles.divider, { backgroundColor: COLORS.BORDER }]} />

          {/* F. NovaMe Kişiselleştirme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT }]}>
              F. NovaMe Kişiselleştirme
            </Text>
            <Text style={[styles.sectionSub, { color: COLORS.MUTED }]}>
              Bu sorular bildirimleri sana göre şekillendirir.
            </Text>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Günün hangi saatlerinde enerjin daha çok tükeniyor?
            </Text>
            <View style={styles.chipsWrap}>
              {ENERGY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.energyDipTime === o.value}
                  onPress={() => updateField("energyDipTime", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Sana anında iyi gelen şeyler neler? (Birden fazla seçebilirsin)
            </Text>
            <View style={styles.chipsWrap}>
              {COMFORT_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.comfortZones.includes(o.value)}
                  onPress={() => toggleComfort(o.value)}
                  COLORS={COLORS}
                  iconName={o.icon}
                />
              ))}
            </View>

            {hasPetSelected ? (
              <>
                <Text style={[styles.label, { color: COLORS.MUTED }]}>
                  Evcil hayvanının adı (opsiyonel)
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
                  placeholder="Boncuk, Maya..."
                  placeholderTextColor={COLORS.MUTED}
                  value={form.petName}
                  onChangeText={(t) => updateField("petName", t)}
                />
              </>
            ) : null}

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Kendi kendine en çok söylediğin negatif cümle hangisi?
            </Text>
            <View style={styles.chipsWrap}>
              {NEGATIVE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.negativeSelfTalk === o.value}
                  onPress={() => updateField("negativeSelfTalk", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Genelde nerede çalışıyorsun / vakit geçiriyorsun?
            </Text>
            <View style={styles.chipsWrap}>
              {WORK_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.workContext === o.value}
                  onPress={() => updateField("workContext", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              İster misin sana nasıl konuşayım?
            </Text>
            <View style={styles.chipsWrap}>
              {TONE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.toneOfVoice === o.value}
                  onPress={() => updateField("toneOfVoice", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Yaklaşan büyük bir gün var mı?
            </Text>
            <View style={styles.chipsWrap}>
              {BIGDAY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={form.bigDayType === o.value}
                  onPress={() => updateField("bigDayType", o.value)}
                  COLORS={COLORS}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Büyük gün etiketi (opsiyonel)
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
              placeholder="TUS, sunum, düğün..."
              placeholderTextColor={COLORS.MUTED}
              value={form.bigDayLabel}
              onChangeText={(t) => updateField("bigDayLabel", t)}
            />

            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Büyük gün tarihi (YYYY-AA-GG)
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
              placeholder="2026-02-10"
              placeholderTextColor={COLORS.MUTED}
              value={form.bigDayDate}
              onChangeText={(t) => updateField("bigDayDate", t)}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: COLORS.MUTED, marginTop: 12 }]}>
              Ebeveyn misin?
            </Text>
            <View style={styles.chipsWrap}>
              <Chip
                label="Evet"
                active={form.hasChildren === true}
                onPress={() => updateField("hasChildren", true)}
                COLORS={COLORS}
              />
              <Chip
                label="Hayır"
                active={form.hasChildren === false}
                onPress={() => updateField("hasChildren", false)}
                COLORS={COLORS}
              />
            </View>

            {form.hasChildren ? (
              <>
                <Text style={[styles.label, { color: COLORS.MUTED }]}>
                  Çocuk yaş aralığı (opsiyonel)
                </Text>
                <View style={styles.chipsWrap}>
                  {CHILDREN_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      label={o.label}
                      active={form.childrenAgeRange === o.value}
                      onPress={() => updateField("childrenAgeRange", o.value)}
                      COLORS={COLORS}
                    />
                  ))}
                </View>
              </>
            ) : null}
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

  logoutBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
},
logoutText: {
  fontSize: 12,
  fontWeight: "800",
},


  saveBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
});
