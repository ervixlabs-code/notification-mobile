// src/screens/RegisterPasswordScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Toast from "react-native-toast-message";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterPassword">;

const API_BASE = "https://notification-backend-znes.onrender.com";

// UI gender -> backend Gender enum
type GenderUi = "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";
type GenderBackend = "FEMALE" | "MALE" | "OTHER" | "PREFER_NOT_TO_SAY";

function toBirthYear(birthDateYmd: string): number | null {
  const t = (birthDateYmd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const y = Number(t.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function ymdToIsoUtc(birthDateYmd: string): string | null {
  const t = (birthDateYmd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function mapGender(g: GenderUi): GenderBackend {
  // UI: FEMALE | MALE | PREFER_NOT_TO_SAY
  // Backend: FEMALE | MALE | OTHER | PREFER_NOT_TO_SAY
  return g;
}

/** ✅ Toast helpers */
const showSuccess = (msg: string) => {
  Toast.show({
    type: "success",
    text1: msg,
    position: "bottom",
    visibilityTime: 1800,
  });
};

const showError = (msg: string) => {
  Toast.show({
    type: "error",
    text1: msg,
    position: "bottom",
    visibilityTime: 2200,
  });
};

/** ✅ Zodiac TR -> backend enum (eğer Türkçe gelirse patlamasın) */
const ZODIAC_TR_TO_ENUM: Record<string, string> = {
  Koç: "ARIES",
  Boğa: "TAURUS",
  İkizler: "GEMINI",
  Yengeç: "CANCER",
  Aslan: "LEO",
  Başak: "VIRGO",
  Terazi: "LIBRA",
  Akrep: "SCORPIO",
  Yay: "SAGITTARIUS",
  Oğlak: "CAPRICORN",
  Kova: "AQUARIUS",
  Balık: "PISCES",
};

export default function RegisterPasswordScreen({ route, navigation }: Props) {
  const { COLORS } = useTheme();

  // ✅ Burada artık tüm register payload elimizde
  const {
    fullName,
    email,
    gender,
    birthDate, // YYYY-MM-DD
    zodiacSign,
    city,
    hometown,
  } = route.params;

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    password.length >= 8 &&
    passwordAgain.length >= 8 &&
    password === passwordAgain &&
    !loading;

  const zodiacEnum = useMemo(() => {
    if (!zodiacSign) return undefined;
    // eğer "Koç" gibi TR gelirse enum’a çevir, zaten "ARIES" geliyorsa olduğu gibi bırak
    return ZODIAC_TR_TO_ENUM[zodiacSign] || zodiacSign;
  }, [zodiacSign]);

  const handleRegister = async () => {
    if (password.length < 8) {
      return Alert.alert("Uyarı", "Şifreniz en az 8 karakter olmalıdır.");
    }
    if (password !== passwordAgain) {
      return Alert.alert("Uyarı", "Şifreler birbiriyle eşleşmiyor.");
    }

    try {
      setLoading(true);

      // ✅ birthYear + birthDate ikisini de gönderelim (schema’da ikisi de var)
      const birthYear = toBirthYear(birthDate);
      const birthDateIso = ymdToIsoUtc(birthDate);

      const body: any = {
        email,
        fullName,
        password,
        role: "USER",

        // ✅ Onboarding alanları
        gender: mapGender(gender),
        city: city?.trim() || undefined,
        hometown: hometown?.trim() || undefined,
        zodiacSign: zodiacEnum || undefined,

        // DB’de mevcut alanlar
        birthYear: birthYear ?? undefined,
        birthDate: birthDateIso ?? undefined,
      };

      // undefined temizle
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join("\n")
          : data?.message || "Kayıt işlemi başarısız oldu.";
        throw new Error(msg);
      }

      // ✅ OTP'ye gitme — toast + login
      showSuccess("Kayıt oluşturuldu ✅ Şimdi giriş yapabilirsin.");

      // Login ekranına at (stack temiz)
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }], // ✅ sende login'e buradan gidiyordu
      });
    } catch (err: any) {
      const msg = err?.message || "Kayıt sırasında bir sorun oluştu.";
      // hem toast hem alert (istersen alert'i kaldırırız)
      showError(msg);
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View
            style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}
          >
            <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
          </View>
          <Text style={[styles.logoText, { color: COLORS.TEXT }]}>NovaMe</Text>
        </View>

        {/* Başlık */}
        <Text style={[styles.title, { color: COLORS.TEXT }]}>Şifre Oluşturma</Text>
        <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
          Kayıt işleminizin sonuna geldiniz. Şifrenizi belirleyerek uygulamaya erişebilirsiniz.
        </Text>

        {/* Yeni şifre */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: COLORS.CARD,
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT,
              },
            ]}
            placeholder="Yeni Şifre"
            placeholderTextColor={COLORS.MUTED}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.MUTED}
            />
          </Pressable>
        </View>

        {/* Yeni şifre tekrarı */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.input,
              styles.inputOutlined,
              {
                borderColor: COLORS.PRIMARY,
                backgroundColor: COLORS.CARD,
                color: COLORS.TEXT,
              },
            ]}
            placeholder="Yeni Şifre Tekrarı"
            placeholderTextColor={COLORS.MUTED}
            secureTextEntry={!showPasswordAgain}
            value={passwordAgain}
            onChangeText={setPasswordAgain}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPasswordAgain((v) => !v)}
          >
            <Ionicons
              name={showPasswordAgain ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.MUTED}
            />
          </Pressable>
        </View>

        {/* Bilgi metni */}
        <View style={styles.infoRow}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={COLORS.MUTED}
          />
          <Text style={[styles.infoText, { color: COLORS.MUTED }]}>
            Şifreniz en az 8 karakter olmalıdır. Güvenliğiniz için harf ve rakam kombinasyonları
            kullanmanızı öneririz.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Hesabı oluştur butonu */}
        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: canSubmit ? COLORS.PRIMARY : COLORS.PRIMARY_SOFT,
              shadowColor: COLORS.PRIMARY,
              opacity: canSubmit ? 1 : 0.9,
            },
          ]}
          disabled={!canSubmit}
          onPress={handleRegister}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: canSubmit ? COLORS.CARD : COLORS.MUTED },
            ]}
          >
            {loading ? "Oluşturuluyor..." : "Hesabı Oluştur"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 14,
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputOutlined: {
    borderWidth: 1.5,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 8,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
