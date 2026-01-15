// src/screens/RegisterFocusScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useRegisterWizard } from "./RegisterWizardContext";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterFocusScreen">;

type FocusArea =
  | "EDUCATION"
  | "CAREER"
  | "FINANCE"
  | "HEALTH_SPORTS"
  | "RELATIONSHIPS";

export default function RegisterFocusScreen({ navigation }: Props) {
  const { COLORS } = useTheme();
  const { draft, patch } = useRegisterWizard();

  const [focusArea, setFocusArea] = useState<FocusArea | null>(
    draft.focusArea ?? null
  );
  const [focusDetail, setFocusDetail] = useState(draft.focusDetail ?? "");

  const canContinue = useMemo(() => !!focusArea, [focusArea]);

  const handleNext = () => {
    if (!focusArea) {
      return Alert.alert("Uyarı", "Lütfen bir odak alanı seçin.");
    }

    patch({
      focusArea,
      focusDetail:
        focusArea === "FINANCE" || focusArea === "HEALTH_SPORTS"
          ? focusDetail
          : "",
    });

    navigation.navigate("RegisterMotivation");
  };

  return (
    <Screen>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
          <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.logoText, { color: COLORS.TEXT }]}>NovaMe</Text>
      </View>

      {/* Başlık */}
      <Text style={[styles.title, { color: COLORS.TEXT }]}>
        Odak Alanın
      </Text>
      <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
        Şu an hayatının hangi alanına odaklanmak istiyorsun?
      </Text>

      {/* Ana odak seçenekleri */}
      <View style={styles.grid}>
        {[
          { key: "EDUCATION", label: "Eğitim", icon: "school-outline" },
          { key: "CAREER", label: "Kariyer", icon: "briefcase-outline" },
          { key: "FINANCE", label: "Finans", icon: "cash-outline" },
          { key: "HEALTH_SPORTS", label: "Sağlık & Spor", icon: "fitness-outline" },
          { key: "RELATIONSHIPS", label: "İlişkiler", icon: "heart-outline" },
        ].map((it) => {
          const active = focusArea === it.key;
          return (
            <Pressable
              key={it.key}
              onPress={() => {
                setFocusArea(it.key as FocusArea);
                setFocusDetail("");
              }}
              style={[
                styles.card,
                {
                  borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                  backgroundColor: active ? COLORS.PRIMARY_SOFT : COLORS.CARD,
                },
              ]}
            >
              <Ionicons
                name={it.icon as any}
                size={20}
                color={active ? COLORS.PRIMARY : COLORS.MUTED}
              />
              <Text
                style={[
                  styles.cardText,
                  { color: active ? COLORS.PRIMARY : COLORS.TEXT },
                ]}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Conditional alt seçimler */}
      {focusArea === "FINANCE" && (
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.subTitle, { color: COLORS.TEXT }]}>
            Finans alanında hangisiyle ilgileniyorsun?
          </Text>

          <View style={styles.segmentRow}>
            {["Borsa", "Kripto", "Altın / Döviz", "Tasarruf"].map((opt) => {
              const active = focusDetail === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setFocusDetail(opt)}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active
                        ? COLORS.PRIMARY_SOFT
                        : COLORS.CARD,
                      borderColor: active
                        ? COLORS.PRIMARY
                        : COLORS.BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active
                          ? COLORS.PRIMARY
                          : COLORS.TEXT,
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {focusArea === "HEALTH_SPORTS" && (
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.subTitle, { color: COLORS.TEXT }]}>
            Favori aktiviten hangisi?
          </Text>

          <View style={styles.segmentRow}>
            {["Fitness", "Yoga / Pilates", "Yürüyüş", "Koşu", "Takım Sporları"].map(
              (opt) => {
                const active = focusDetail === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setFocusDetail(opt)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: active
                          ? COLORS.PRIMARY_SOFT
                          : COLORS.CARD,
                        borderColor: active
                          ? COLORS.PRIMARY
                          : COLORS.BORDER,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: active
                            ? COLORS.PRIMARY
                            : COLORS.TEXT,
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>
      )}

      {/* Devam */}
      <Pressable
        style={[
          styles.primaryButton,
          {
            backgroundColor: canContinue
              ? COLORS.PRIMARY
              : COLORS.PRIMARY_SOFT,
            shadowColor: COLORS.PRIMARY,
            opacity: canContinue ? 1 : 0.8,
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

      {/* Geri */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backRow, { borderColor: COLORS.BORDER }]}
      >
        <Ionicons name="chevron-back" size={18} color={COLORS.MUTED} />
        <Text style={[styles.backText, { color: COLORS.MUTED }]}>
          Geri
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
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
  },
  cardText: {
    fontSize: 13,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  segmentBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
});
