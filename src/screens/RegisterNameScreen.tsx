// src/screens/RegisterNameScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  View,
  Alert,
  Platform,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterName">;

type GenderUi = "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

type ZodiacKey =
  | "Koç"
  | "Boğa"
  | "İkizler"
  | "Yengeç"
  | "Aslan"
  | "Başak"
  | "Terazi"
  | "Akrep"
  | "Yay"
  | "Oğlak"
  | "Kova"
  | "Balık";

function getZodiac(date: Date): ZodiacKey {
  const d = date.getDate();
  const m = date.getMonth() + 1;

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Koç";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Boğa";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "İkizler";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Yengeç";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Aslan";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Başak";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Terazi";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Akrep";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Yay";
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "Oğlak";
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Kova";
  return "Balık";
}

const zodiacGreeting: Record<ZodiacKey, string> = {
  Koç: "enerjik bir Koç",
  Boğa: "sağlamcı bir Boğa",
  İkizler: "meraklı bir İkizler",
  Yengeç: "şefkatli bir Yengeç",
  Aslan: "parlayan bir Aslan",
  Başak: "detaycı bir Başak",
  Terazi: "dengeci bir Terazi",
  Akrep: "tutkulu bir Akrep",
  Yay: "özgür ruhlu bir Yay",
  Oğlak: "disiplinli bir Oğlak",
  Kova: "vizyoner bir Kova",
  Balık: "sezgisel bir Balık",
};

const ZODIAC_TO_ENUM: Record<ZodiacKey, string> = {
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


export default function RegisterNameScreen({ navigation }: Props) {
  const { COLORS, isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<GenderUi | null>(null);

  const [birthDate, setBirthDate] = useState<Date | null>(null);

  // ✅ iOS: modal bottom sheet
  const [iosDateOpen, setIosDateOpen] = useState(false);
  const [iosTempDate, setIosTempDate] = useState<Date>(birthDate || new Date(2000, 0, 1));

  // ✅ Android: native dialog toggle
  const [androidDateOpen, setAndroidDateOpen] = useState(false);

  const zodiac = useMemo(() => (birthDate ? getZodiac(birthDate) : null), [birthDate]);

  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);

  const allChecked = agree1 && agree2 && agree3;

  const canContinue =
    fullName.trim().length > 0 &&
    !!gender &&
    !!birthDate &&
    allChecked;

  const openDatePicker = () => {
    const base = birthDate || new Date(2000, 0, 1);
    if (Platform.OS === "ios") {
      setIosTempDate(base);
      setIosDateOpen(true);
    } else {
      setAndroidDateOpen(true);
    }
  };

  const handleNext = () => {
    if (!fullName.trim()) {
      return Alert.alert("Uyarı", "Lütfen adınızı ve soyadınızı girin.");
    }
    if (!gender) {
      return Alert.alert("Uyarı", "Lütfen cinsiyet seçiminizi yapın.");
    }
    if (!birthDate) {
      return Alert.alert("Uyarı", "Lütfen doğum tarihinizi seçin.");
    }
    if (!allChecked) {
      return Alert.alert("Uyarı", "Devam etmek için tüm sözleşmeleri onaylamanız gerekiyor.");
    }

    const yyyy = birthDate.getFullYear();
    const mm = birthDate.getMonth() + 1;
    const dd = birthDate.getDate();

    navigation.navigate("RegisterLocation", {
      fullName: fullName.trim(),
      // RootNavigator tipini sonra genişletirsin — şimdilik patlamasın
      gender,
      birthDate: `${yyyy}-${pad2(mm)}-${pad2(dd)}`,
      zodiacSign: zodiac ? ZODIAC_TO_ENUM[zodiac] : undefined,
    });
  };

  const GenderPill = ({
    value,
    label,
  }: {
    value: GenderUi;
    label: string;
  }) => {
    const active = gender === value;
    return (
      <Pressable
        onPress={() => setGender(value)}
        style={[
          styles.pill,
          {
            backgroundColor: active ? COLORS.PRIMARY : COLORS.CARD,
            borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
          },
        ]}
      >
        <Text
          style={{
            color: active ? COLORS.CARD : COLORS.TEXT,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const birthDateLabel = birthDate
    ? birthDate.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Doğum tarihinizi seçin";

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* FORM: scroll */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 18 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo satırı */}
          <View style={styles.logoRow}>
            <View style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
              <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
            </View>
            <Text style={[styles.logoText, { color: COLORS.TEXT }]}>NovaMe</Text>
          </View>

          {/* Başlık */}
          <Text style={[styles.title, { color: COLORS.TEXT }]}>Kişisel Bilgiler</Text>
          <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
            Lütfen aşağıdaki alanları doldurarak kayıt işleminize devam edin.
          </Text>

          {/* Ad Soyad */}
          <View style={{ marginBottom: 18 }}>
            <Text style={[styles.label, { color: COLORS.MUTED }]}>Ad-Soyad</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER, color: COLORS.TEXT },
              ]}
              placeholder="Örn. Muhammed N. Duymaz"
              placeholderTextColor={COLORS.MUTED}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Cinsiyet */}
          <View style={{ marginBottom: 18 }}>
            <Text style={[styles.label, { color: COLORS.MUTED }]}>Cinsiyet</Text>
            <View style={styles.pillRow}>
              <GenderPill value="FEMALE" label="Kadın" />
              <GenderPill value="MALE" label="Erkek" />
              <GenderPill value="PREFER_NOT_TO_SAY" label="Belirtmek istemiyorum" />
            </View>
          </View>

          {/* Doğum Tarihi */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { color: COLORS.MUTED }]}>Doğum Tarihi</Text>

            <Pressable
              onPress={openDatePicker}
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.CARD,
                  borderColor: COLORS.BORDER,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text style={{ color: birthDate ? COLORS.TEXT : COLORS.MUTED, fontSize: 15 }}>
                {birthDateLabel}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={COLORS.MUTED} />
            </Pressable>

            {!!zodiac && fullName.trim().length > 0 && (
              <View
                style={[
                  styles.magicCard,
                  { backgroundColor: COLORS.PRIMARY_SOFT, borderColor: COLORS.BORDER },
                ]}
              >
                <Ionicons name="sparkles" size={18} color={COLORS.PRIMARY} />
                <Text style={[styles.magicText, { color: COLORS.TEXT }]}>
                  Vay, {zodiacGreeting[zodiac]}! Hoş geldin {fullName.trim().split(" ")[0]}.
                </Text>
              </View>
            )}
          </View>

          {/* Checkbox alanları */}
          <View style={styles.checkList}>
            <Pressable style={styles.checkRow} onPress={() => setAgree1((v) => !v)}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agree1 ? COLORS.PRIMARY : COLORS.BORDER,
                    backgroundColor: agree1 ? COLORS.PRIMARY : "transparent",
                  },
                ]}
              >
                {agree1 && <Ionicons name="checkmark" size={14} color={COLORS.CARD} />}
              </View>
              <Text style={[styles.checkText, { color: COLORS.MUTED }]}>
                Kullanıcı Sözleşmesi ve Gizlilik Politikası'nı okudum ve onaylıyorum.
              </Text>
            </Pressable>

            <Pressable style={styles.checkRow} onPress={() => setAgree2((v) => !v)}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agree2 ? COLORS.PRIMARY : COLORS.BORDER,
                    backgroundColor: agree2 ? COLORS.PRIMARY : "transparent",
                  },
                ]}
              >
                {agree2 && <Ionicons name="checkmark" size={14} color={COLORS.CARD} />}
              </View>
              <Text style={[styles.checkText, { color: COLORS.MUTED }]}>
                Kişisel verilerin işlenmesine ilişkin Aydınlatma Metni'ni okudum.
              </Text>
            </Pressable>

            <Pressable style={styles.checkRow} onPress={() => setAgree3((v) => !v)}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agree3 ? COLORS.PRIMARY : COLORS.BORDER,
                    backgroundColor: agree3 ? COLORS.PRIMARY : "transparent",
                  },
                ]}
              >
                {agree3 && <Ionicons name="checkmark" size={14} color={COLORS.CARD} />}
              </View>
              <Text style={[styles.checkText, { color: COLORS.MUTED }]}>
                Açık rıza metni kapsamında kişisel verilerimin işlenmesini onaylıyorum.
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* ALT SABİT ALAN */}
        <View style={[styles.bottomArea, { borderTopColor: COLORS.BORDER, backgroundColor: COLORS.BG }]}>
          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: canContinue ? COLORS.PRIMARY : COLORS.PRIMARY_SOFT,
                shadowColor: COLORS.PRIMARY,
                opacity: canContinue ? 1 : 0.85,
              },
            ]}
            disabled={!canContinue}
            onPress={handleNext}
          >
            <Text style={[styles.primaryButtonText, { color: canContinue ? COLORS.CARD : COLORS.MUTED }]}>
              Devam et
            </Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: COLORS.MUTED }]}>Zaten hesabın var mı? </Text>
            <Pressable onPress={() => navigation.replace("Auth")}>
              <Text style={[styles.footerLink, { color: COLORS.PRIMARY }]}>Giriş yap</Text>
            </Pressable>
          </View>
        </View>

        {/* ANDROID PICKER (native dialog) */}
        {Platform.OS !== "ios" && androidDateOpen && (
          <DateTimePicker
            value={birthDate || new Date(2000, 0, 1)}
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setAndroidDateOpen(false);
              if (event.type === "dismissed") return;
              if (selectedDate) setBirthDate(selectedDate);
            }}
          />
        )}

        {/* iOS MODAL (bottom sheet + iptal/seç) */}
        {Platform.OS === "ios" && (
          <Modal
            visible={iosDateOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIosDateOpen(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIosDateOpen(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.sheet, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setIosDateOpen(false)} style={styles.sheetBtn}>
                  <Text style={{ color: COLORS.MUTED, fontWeight: "600" }}>İptal</Text>
                </Pressable>

                <Text style={{ color: COLORS.TEXT, fontWeight: "700" }}>Tarih Seç</Text>

                <Pressable
                  onPress={() => {
                    setBirthDate(iosTempDate);
                    setIosDateOpen(false);
                  }}
                  style={styles.sheetBtn}
                >
                  <Text style={{ color: COLORS.PRIMARY, fontWeight: "700" }}>Seç</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={iosTempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                themeVariant={isDark ? "dark" : "light"}
                onChange={(_, d) => {
                  if (d) setIosTempDate(d);
                }}
              />
            </View>
          </Modal>
        )}
      </View>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  magicCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  magicText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  checkList: {
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  bottomArea: {
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "600",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    paddingBottom: 18,
  },
  sheetHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 70,
  },
});
