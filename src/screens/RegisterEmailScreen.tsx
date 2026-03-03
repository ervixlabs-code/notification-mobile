// src/screens/RegisterEmailScreen.tsx
import React, { useState } from "react";
import { Text, StyleSheet, TextInput, Pressable, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterEmail">;

export default function RegisterEmailScreen({ route, navigation }: Props) {
  const { COLORS } = useTheme();

  // ✅ Tüm register context'i burada var:
  const { fullName, gender, birthDate, zodiacSign, city, hometown } = route.params;

  const [email, setEmail] = useState("");

  const isValidEmail =
    email.trim().length > 0 && email.includes("@") && email.includes(".");

  const canContinue = isValidEmail;

  const handleNext = () => {
    if (!isValidEmail) {
      return Alert.alert("Uyarı", "Lütfen geçerli bir e-posta adresi girin.");
    }

    // ✅ Password ekranına full payload ile geç
    navigation.navigate("RegisterPassword", {
      fullName,
      gender,
      birthDate,
      zodiacSign,
      city,
      hometown,
      email: email.trim(),
    });
  };

  return (
    <Screen>
      {/* Logo satırı */}
      <View style={styles.logoRow}>
        <View style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
          <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.logoText, { color: COLORS.TEXT }]}>NovaMe</Text>
      </View>

      {/* Başlık */}
      <Text style={[styles.title, { color: COLORS.TEXT }]}>İletişim Bilgileri</Text>
      <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
        Aktif olarak kullandığınız e-posta adresinizi girin.
      </Text>

      {/* E-posta alanı */}
      <View style={{ marginBottom: 24, marginTop: 8 }}>
        <Text style={[styles.label, { color: COLORS.MUTED }]}>E-Posta Adresi</Text>
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

      <View style={{ flex: 1 }} />

      {/* Devam Et butonu */}
      <Pressable
        style={[
          styles.primaryButton,
          {
            backgroundColor: canContinue ? COLORS.PRIMARY : COLORS.PRIMARY_SOFT,
            shadowColor: COLORS.PRIMARY,
            opacity: canContinue ? 1 : 0.9,
          },
        ]}
        disabled={!canContinue}
        onPress={handleNext}
      >
        <Text
          style={[
            styles.primaryButtonText,
            { color: canContinue ? COLORS.CARD : COLORS.MUTED },
          ]}
        >
          Devam et
        </Text>
      </Pressable>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
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
