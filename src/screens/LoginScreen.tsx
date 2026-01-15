// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { OneSignal } from "react-native-onesignal";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

/**
 * ✅ ÖNEMLİ:
 * - Android emulator: 10.0.2.2 çalışır
 * - iOS simulator: localhost çalışır
 * - GERÇEK CİHAZ: localhost / 10.0.2.2 ÇALIŞMAZ → bilgisayarının LAN IP'si lazım
 *
 * En temizi: EXPO_PUBLIC_API_BASE tanımla:
 * EXPO_PUBLIC_API_BASE="http://192.168.1.XX:3000"
 */
const API_BASE =
  (process.env as any)?.EXPO_PUBLIC_API_BASE ??
  "https://notification-backend-production-9c18.up.railway.app";


const ONESIGNAL_PERMISSION_ASKED_KEY = "onesignalPermissionAsked";

export default function LoginScreen({ navigation }: Props) {
  const { COLORS } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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

  // ✅ Login sonrası 1 kez izin iste
  const maybeRequestPushPermissionAfterLogin = async () => {
    try {
      const asked = await SecureStore.getItemAsync(
        ONESIGNAL_PERMISSION_ASKED_KEY
      );
      if (asked === "1") return;

      await OneSignal.Notifications.requestPermission(true);
      await SecureStore.setItemAsync(ONESIGNAL_PERMISSION_ASKED_KEY, "1");
    } catch {
      // sessiz geç
    }
  };

  // ✅ OneSignal playerId(deviceId) alıp backend'e yaz
  const syncOneSignalDeviceIdToBackend = async (token: string) => {
    try {
      let playerId: string | null = null;

      // ✅ FIX: OneSignal bazen geç hazır oluyor → retry
      for (let i = 0; i < 6; i++) {
        playerId = await OneSignal.User.pushSubscription.getIdAsync();
        console.log("🔔 OneSignal playerId try", i + 1, playerId);

        if (playerId) break;
        await new Promise((r) => setTimeout(r, 800));
      }

      if (!playerId) {
        console.log("❌ OneSignal playerId alınamadı (null).");
        return;
      }

      console.log("✅ OneSignal playerId:", playerId);
      console.log("🌐 API_BASE:", API_BASE);

      const res = await fetch(`${API_BASE}/mobile/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: playerId }),
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) {
        console.log("❌ deviceId sync failed:", res.status, txt);
        return;
      }

      console.log("✅ deviceId synced:", res.status, txt);
    } catch (e) {
      console.log("❌ deviceId sync error:", e);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) return showError("Lütfen e-posta girin.");
    if (!password.trim()) return showError("Lütfen şifre girin.");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showError(
          Array.isArray(data?.message)
            ? data.message.join("\n")
            : data.message || "Giriş başarısız"
        );
      }

      if (data?.accessToken) {
        await SecureStore.setItemAsync("accessToken", data.accessToken);
      }
      await SecureStore.setItemAsync("rememberMe", rememberMe ? "1" : "0");

      showSuccess("Giriş başarılı 🎉");

      // ✅ izin (1 kez)
      await maybeRequestPushPermissionAfterLogin();

      // ✅ FIX: izin sonrası biraz bekleyip playerId sync
      if (data?.accessToken) {
        setTimeout(() => {
          syncOneSignalDeviceIdToBackend(data.accessToken);
        }, 1200);
      }

      setTimeout(() => {
        navigation.replace("MainTabs");
      }, 800);
    } catch (error) {
      showError("Sunucuya bağlanılamadı");
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View
            style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}
          >
            <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
          </View>
          <Text style={[styles.logoText, { color: COLORS.TEXT }]}>
            NovaMe
          </Text>
        </View>

        {/* Başlıklar */}
        <Text style={[styles.title, { color: COLORS.TEXT }]}>
          Hesabınıza Giriş Yapın
        </Text>
        <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
          Günlük motivasyon kıvılcımınıza ulaşmak için giriş yapın.
        </Text>

        {/* E-posta input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: COLORS.MUTED }]}>
            E-posta Adresi
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
            placeholder="ornek@mail.com"
            placeholderTextColor={COLORS.MUTED}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Şifre + göz ikonu */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: COLORS.MUTED }]}>Şifre</Text>

          <View
            style={[
              styles.passwordWrapper,
              { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: COLORS.TEXT }]}
              placeholder="••••••••"
              placeholderTextColor={COLORS.MUTED}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={COLORS.MUTED}
              />
            </Pressable>
          </View>
        </View>

        {/* Beni Hatırla + Şifremi Unuttum */}
        <View style={styles.rowBetween}>
          <Pressable
            style={styles.rowCenter}
            onPress={() => setRememberMe((v) => !v)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: rememberMe ? COLORS.PRIMARY : COLORS.BORDER,
                  backgroundColor: rememberMe ? COLORS.PRIMARY : "transparent",
                },
              ]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={14} color={COLORS.CARD} />
              )}
            </View>
            <Text style={[styles.rememberText, { color: COLORS.MUTED }]}>
              Beni Hatırla
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              showError("Şifremi unuttum akışı daha sonra eklenecek.")
            }
          >
            <Text style={[styles.linkText, { color: COLORS.PRIMARY }]}>
              Şifremi Unuttum
            </Text>
          </Pressable>
        </View>

        {/* Giriş Yap */}
        <Pressable
          style={[styles.primaryButton, { backgroundColor: COLORS.PRIMARY }]}
          onPress={handleLogin}
        >
          <Text style={[styles.primaryButtonText, { color: COLORS.CARD }]}>
            Giriş Yap
          </Text>
        </Pressable>

        {/* Kayıt Ol */}
        <View style={styles.centerRow}>
          <Text style={[styles.smallText, { color: COLORS.MUTED }]}>
            Hesabınız yok mu?{" "}
          </Text>
          <Pressable onPress={() => navigation.navigate("RegisterName")}>
            <Text style={[styles.linkText, { color: COLORS.PRIMARY }]}>
              Kayıt Olun
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View
            style={[styles.dividerLine, { backgroundColor: COLORS.BORDER }]}
          />
          <Text style={[styles.smallText, { color: COLORS.MUTED }]}>veya</Text>
          <View
            style={[styles.dividerLine, { backgroundColor: COLORS.BORDER }]}
          />
        </View>

        {/* Sosyal login */}
        <View style={styles.socialRow}>
          <Pressable
            style={[styles.socialButton, { borderColor: COLORS.BORDER }]}
            onPress={() => showError("Google ile giriş daha sonra eklenecek.")}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.TEXT} />
          </Pressable>
          <Pressable
            style={[styles.socialButton, { borderColor: COLORS.BORDER }]}
            onPress={() => showError("Facebook ile giriş daha sonra eklenecek.")}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          </Pressable>
          <Pressable
            style={[styles.socialButton, { borderColor: COLORS.BORDER }]}
            onPress={() => showError("Apple ile giriş daha sonra eklenecek.")}
          >
            <Ionicons name="logo-apple" size={20} color={COLORS.TEXT} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  logoRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: 10,
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: { fontSize: 13 },

  linkText: { fontSize: 13, fontWeight: "600" },

  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  centerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
  },
  smallText: { fontSize: 13 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },

  socialRow: { flexDirection: "row", justifyContent: "space-between" },
  socialButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
});
