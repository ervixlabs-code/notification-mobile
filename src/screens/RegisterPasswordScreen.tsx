// src/screens/RegisterPasswordScreen.tsx

import React, { useState } from "react";
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

type Props = NativeStackScreenProps<RootStackParamList, "RegisterPassword">;

const API_BASE =
  (process.env as any)?.EXPO_PUBLIC_API_BASE ??
  "https://notification-backend-production-9c18.up.railway.app";


export default function RegisterPasswordScreen({ route, navigation }: Props) {
  const { COLORS } = useTheme();
  const { fullName, email } = route.params;

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

  const handleRegister = async () => {
    if (password.length < 8) {
      return Alert.alert(
        "Uyarı",
        "Şifreniz en az 8 karakter olmalıdır."
      );
    }

    if (password !== passwordAgain) {
      return Alert.alert("Uyarı", "Şifreler birbiriyle eşleşmiyor.");
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          password,
          role: "USER",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join("\n")
            : data?.message || "Kayıt işlemi başarısız oldu."
        );
      }

      // Burada backend zaten OTP üretip mail gönderiyor 🔥
      Alert.alert(
        "Kayıt Başarılı",
        "E-posta adresinize gönderilen doğrulama kodunu girin.",
        [
          {
            text: "Tamam",
            onPress: () => {
              navigation.replace("RegisterEmailOtp", {
                fullName,
                email,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Hata",
        err?.message || "Kayıt sırasında bir sorun oluştu."
      );
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
            NovaMe
          </Text>
        </View>

        {/* Başlık */}
        <Text style={[styles.title, { color: COLORS.TEXT }]}>
          Şifre Oluşturma
        </Text>
        <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
          Kayıt işleminizin sonuna geldiniz. Şifrenizi belirleyerek
          uygulamaya erişebilirsiniz.
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
              name={
                showPasswordAgain ? "eye-off-outline" : "eye-outline"
              }
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
            Şifreniz en az 8 karakter olmalıdır. Güvenliğiniz için
            harf ve rakam kombinasyonları kullanmanızı öneririz.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Hesabı oluştur butonu */}
        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: canSubmit
                ? COLORS.PRIMARY
                : COLORS.PRIMARY_SOFT,
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
