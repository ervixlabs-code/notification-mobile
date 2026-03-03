// src/screens/LoginScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { OneSignal } from "react-native-onesignal";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

import { API_BASE, setToken } from "../lib/api";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

const ONESIGNAL_PERMISSION_ASKED_KEY = "onesignalPermissionAsked";

export default function LoginScreen({ navigation }: Props) {
  const { COLORS } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ double navigate engeli
  const didNavigateRef = useRef(false);

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

  useEffect(() => {
    didNavigateRef.current = false;
  }, []);

  /** ✅ Login sonrası 1 kez izin iste */
  const maybeRequestPushPermissionAfterLogin = async () => {
    try {
      const asked = await SecureStore.getItemAsync(ONESIGNAL_PERMISSION_ASKED_KEY);
      if (asked === "1") return;

      await OneSignal.Notifications.requestPermission(true);
      await SecureStore.setItemAsync(ONESIGNAL_PERMISSION_ASKED_KEY, "1");
    } catch {
      // sessiz geç
    }
  };

  /** ✅ OneSignal bind (External ID + optIn) */
  const bindOneSignalToUser = async (userId: string | number) => {
    const id = String(userId);

    try {
      // ✅ External ID set
      OneSignal.login(id);

      // ✅ permission (1 kez)
      await maybeRequestPushPermissionAfterLogin();

      // ✅ subscribe zorla (pushSubscription)
      try {
        OneSignal.User.pushSubscription.optIn();
      } catch {}

      console.log("✅ OneSignal bound to user:", id);
    } catch (e) {
      console.log("❌ OneSignal bind error:", e);
    }
  };

  /** ✅ OneSignal pushSubscription id alıp backend'e yaz */
  const syncOneSignalDeviceIdToBackend = async (token: string) => {
    try {
      let subId: string | null = null;

      for (let i = 0; i < 10; i++) {
        // bazı sürümlerde id gecikebiliyor
        try {
          // Bazı SDK’larda getIdAsync var
          // @ts-ignore
          if (OneSignal?.User?.pushSubscription?.getIdAsync) {
            // @ts-ignore
            subId = await OneSignal.User.pushSubscription.getIdAsync();
          } else {
            // fallback: property
            // @ts-ignore
            subId = OneSignal?.User?.pushSubscription?.id ?? null;
          }
        } catch {
          subId = null;
        }

        console.log("🔔 OneSignal pushSubscriptionId try", i + 1, subId);

        if (subId) break;
        await new Promise((r) => setTimeout(r, 700));
      }

      if (!subId) {
        console.log("❌ OneSignal subscription id alınamadı (null).");
        return;
      }

      const res = await fetch(`${API_BASE}/mobile/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: subId }),
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
    if (submitting) return;

    const safeEmail = email.trim().toLowerCase();
    const safePass = password.trim();

    if (!safeEmail) return showError("Lütfen e-posta girin.");
    if (!safePass) return showError("Lütfen şifre girin.");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password: safePass }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(
          Array.isArray((data as any)?.message)
            ? (data as any).message.join("\n")
            : (data as any).message || "Giriş başarısız"
        );
        return;
      }

      const accessToken = (data as any)?.accessToken as string | undefined;
      const userId = (data as any)?.user?.id as string | number | undefined;

      if (!accessToken) {
        showError("Token alınamadı. Lütfen tekrar deneyin.");
        return;
      }

      // ✅ token kaydet
      await setToken(accessToken);

      // ✅ rememberMe kaydet
      await SecureStore.setItemAsync("rememberMe", rememberMe ? "1" : "0");

      showSuccess("Giriş başarılı 🎉");

      // ✅ OneSignal bağla + optIn
      if (userId !== undefined && userId !== null) {
        await bindOneSignalToUser(userId);
      } else {
        await maybeRequestPushPermissionAfterLogin();
        console.log("⚠️ Login response user.id yok → OneSignal.login atlandı.");
      }

      // ✅ deviceId sync (await)
      await syncOneSignalDeviceIdToBackend(accessToken);

      // ✅ yalnızca 1 kez navigate
      if (!didNavigateRef.current) {
        didNavigateRef.current = true;
        navigation.replace("MainTabs");
      }
    } catch (e) {
      showError("Sunucuya bağlanılamadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
            <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
          </View>
          <Text style={[styles.logoText, { color: COLORS.TEXT }]}>NovaMe</Text>
        </View>

        {/* Başlıklar */}
        <Text style={[styles.title, { color: COLORS.TEXT }]}>Hesabınıza Giriş Yapın</Text>
        <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
          Günlük motivasyon kıvılcımınıza ulaşmak için giriş yapın.
        </Text>

        {/* E-posta input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: COLORS.MUTED }]}>E-posta Adresi</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: COLORS.CARD,
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
            editable={!submitting}
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
              {
                backgroundColor: COLORS.CARD,
                borderColor: COLORS.BORDER,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: COLORS.TEXT }]}
              editable={!submitting}
              placeholder="••••••••"
              placeholderTextColor={COLORS.MUTED}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable disabled={submitting} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={COLORS.MUTED} />
            </Pressable>
          </View>
        </View>

        {/* Beni Hatırla + Şifremi Unuttum */}
        <View style={styles.rowBetween}>
          <Pressable
            disabled={submitting}
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
              {rememberMe && <Ionicons name="checkmark" size={14} color={COLORS.CARD} />}
            </View>
            <Text style={[styles.rememberText, { color: COLORS.MUTED }]}>Beni Hatırla</Text>
          </Pressable>

          <Pressable
            disabled={submitting}
            onPress={() => showError("Şifremi unuttum akışı daha sonra eklenecek.")}
          >
            <Text style={[styles.linkText, { color: COLORS.PRIMARY }]}>Şifremi Unuttum</Text>
          </Pressable>
        </View>

        {/* Giriş Yap */}
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: COLORS.PRIMARY, opacity: submitting ? 0.75 : 1 },
          ]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color={COLORS.CARD} />
              <Text style={[styles.primaryButtonText, { color: COLORS.CARD, marginLeft: 10 }]}>
                Giriş yapılıyor…
              </Text>
            </View>
          ) : (
            <Text style={[styles.primaryButtonText, { color: COLORS.CARD }]}>Giriş Yap</Text>
          )}
        </Pressable>

        {/* Kayıt Ol */}
        <View style={styles.centerRow}>
          <Text style={[styles.smallText, { color: COLORS.MUTED }]}>Hesabınız yok mu? </Text>
          <Pressable disabled={submitting} onPress={() => navigation.navigate("RegisterName")}>
            <Text style={[styles.linkText, { color: COLORS.PRIMARY }]}>Kayıt Olun</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: COLORS.BORDER }]} />
          <Text style={[styles.smallText, { color: COLORS.MUTED }]}>veya</Text>
          <View style={[styles.dividerLine, { backgroundColor: COLORS.BORDER }]} />
        </View>

        {/* Sosyal login */}
        <View style={styles.socialRow}>
          <Pressable
            disabled={submitting}
            style={[
              styles.socialButton,
              { borderColor: COLORS.BORDER, opacity: submitting ? 0.6 : 1 },
            ]}
            onPress={() => showError("Google ile giriş daha sonra eklenecek.")}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.TEXT} />
          </Pressable>
          <Pressable
            disabled={submitting}
            style={[
              styles.socialButton,
              { borderColor: COLORS.BORDER, opacity: submitting ? 0.6 : 1 },
            ]}
            onPress={() => showError("Facebook ile giriş daha sonra eklenecek.")}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          </Pressable>
          <Pressable
            disabled={submitting}
            style={[
              styles.socialButton,
              { borderColor: COLORS.BORDER, opacity: submitting ? 0.6 : 1 },
            ]}
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
  rowCenter: { flexDirection: "row", alignItems: "center" },
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
  primaryButtonText: { fontSize: 16, fontWeight: "600" },

  centerRow: { flexDirection: "row", justifyContent: "center", marginBottom: 18 },
  smallText: { fontSize: 13 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
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