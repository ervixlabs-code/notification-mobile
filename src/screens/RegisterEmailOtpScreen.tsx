// src/screens/RegisterEmailOtpScreen.tsx

import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterEmailOtp">;

const API_BASE = "https://notification-backend-znes.onrender.com";


export default function RegisterEmailOtpScreen({ route, navigation }: Props) {
  const { COLORS } = useTheme();
  const { fullName, email } = route.params;

  // fullName şimdilik sadece akış için, istersen kullanırsın
  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60); // 5 dakika
  const [loading, setLoading] = useState(false);

  // Basit geri sayım
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const digits = Array.from({ length: 6 }).map((_, i) => code[i] || "");

  const handleChangeCode = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(cleaned);
  };

  const canContinue = code.length === 6 && !loading;

  const handleContinue = async () => {
    if (code.length < 6) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code, // 🔥 backend VerifyEmailDto ile birebir uyumlu
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join("\n")
            : data?.message || "Doğrulama kodu geçersiz."
        );
      }

      // Email doğrulandı → Auth ekranına dön
      Alert.alert(
        "Başarılı",
        "E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz.",
        [
          {
            text: "Tamam",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Hata", err?.message || "Doğrulama kodu bulunamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View
            style={[
              styles.logoMark,
              { backgroundColor: COLORS.PRIMARY_SOFT },
            ]}
          >
            <Ionicons
              name="flame"
              size={18}
              color={COLORS.PRIMARY}
            />
          </View>
          <Text style={[styles.logoText, { color: COLORS.TEXT }]}>
            DailySpark
          </Text>
        </View>

        {/* Başlık */}
        <Text style={[styles.title, { color: COLORS.TEXT }]}>
          İletişim Bilgileri
        </Text>
        <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
          {email} adresinize gönderdiğimiz 6 haneli doğrulama kodunu girin.
        </Text>

        {/* Kod kutucukları */}
        <View style={styles.codeWrapper}>
          <View style={styles.codeRow}>
            {digits.map((d, index) => {
              const isActive = isFocused && index === code.length;

              return (
                <View
                  key={index}
                  style={[
                    styles.codeBox,
                    {
                      borderColor: isActive
                        ? COLORS.PRIMARY
                        : COLORS.BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.codeText,
                      { color: COLORS.TEXT },
                    ]}
                  >
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Gizli input — gerçek odak burada */}
          <TextInput
            value={code}
            onChangeText={handleChangeCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={styles.hiddenInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        {/* Sayaç */}
        <View style={styles.timerRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={COLORS.MUTED}
          />
          <Text style={[styles.timerText, { color: COLORS.MUTED }]}>
            {mm}:{ss}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Devam butonu */}
        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: canContinue
                ? COLORS.PRIMARY
                : COLORS.PRIMARY_SOFT,
              shadowColor: COLORS.PRIMARY,
              opacity: canContinue ? 1 : 0.9,
            },
          ]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: canContinue
                  ? COLORS.CARD
                  : COLORS.MUTED,
              },
            ]}
          >
            {loading ? "Kontrol ediliyor..." : "Devam et"}
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
  codeWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 8,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 20,
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
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
