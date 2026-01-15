// src/screens/RegisterMotivationScreen.tsx
import React, { useMemo, useState } from "react";
import { Text, StyleSheet, Pressable, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useRegisterWizard } from "./RegisterWizardContext";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterMotivation">;

type MotivationCard =
  | "FAMILY_LOVED_ONES"
  | "FREEDOM_INDEPENDENCE"
  | "PROVE_YOURSELF"
  | "COMFORT_LUXURY"
  | "CURIOSITY_GROWTH"
  | "INNER_PEACE_BALANCE";

const CARDS: Array<{
  key: MotivationCard;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: "FAMILY_LOVED_ONES",
    title: "Ailem ve Sevdiklerim",
    desc: "Sevdiklerin için daha iyi bir gelecek kurmak.",
    icon: "home-outline",
  },
  {
    key: "FREEDOM_INDEPENDENCE",
    title: "Özgürlük ve Bağımsızlık",
    desc: "Kendi kurallarınla yaşamak, kimseye muhtaç olmamak.",
    icon: "airplane-outline",
  },
  {
    key: "PROVE_YOURSELF",
    title: "Kendini Kanıtlamak",
    desc: "Potansiyelini göstermek, “yapamazsın” diyenleri şaşırtmak.",
    icon: "trophy-outline",
  },
  {
    key: "COMFORT_LUXURY",
    title: "Konfor ve Lüks",
    desc: "Daha rahat bir yaşam, finansal kaygılardan uzak olmak.",
    icon: "diamond-outline",
  },
  {
    key: "CURIOSITY_GROWTH",
    title: "Merak ve Gelişim",
    desc: "Yeni şeyler öğrenmek, en iyi versiyonuna yaklaşmak.",
    icon: "rocket-outline",
  },
  {
    key: "INNER_PEACE_BALANCE",
    title: "İç Huzur ve Denge",
    desc: "Stresten uzaklaşmak, kontrolü eline almak.",
    icon: "leaf-outline",
  },
];

export default function RegisterMotivationScreen({ navigation }: Props) {
  const { COLORS } = useTheme();
  const { draft, patch } = useRegisterWizard();

  const [selected, setSelected] = useState<MotivationCard | null>(
    (draft.motivationCard as MotivationCard) ?? null
  );

  const canContinue = useMemo(() => !!selected, [selected]);

  const handleNext = () => {
    if (!selected) {
      return Alert.alert("Uyarı", "Lütfen bir motivasyon kartı seçin.");
    }

    patch({ motivationCard: selected });
    navigation.navigate("RegisterEmail");
  };

  return (
    <Screen>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={[styles.logoMark, { backgroundColor: COLORS.PRIMARY_SOFT }]}>
          <Ionicons name="flame" size={18} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.logoText, { color: COLORS.TEXT }]}>DailySpark</Text>
      </View>

      {/* Başlık */}
      <Text style={[styles.title, { color: COLORS.TEXT }]}>
        Seni Harekete Geçiren Güç
      </Text>
      <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
        Seni bu yola çıkaran asıl kıvılcım ne? Birini seç, sana göndereceğimiz
        bildirimlerin tonu buna göre şekillensin.
      </Text>

      {/* Kartlar */}
      <View style={styles.list}>
        {CARDS.map((c) => {
          const active = selected === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setSelected(c.key)}
              style={[
                styles.card,
                {
                  borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                  backgroundColor: active ? COLORS.PRIMARY_SOFT : COLORS.CARD,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active ? COLORS.PRIMARY : COLORS.PRIMARY_SOFT,
                  },
                ]}
              >
                <Ionicons
                  name={c.icon}
                  size={18}
                  color={active ? COLORS.CARD : COLORS.PRIMARY}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: active ? COLORS.PRIMARY : COLORS.TEXT },
                  ]}
                >
                  {c.title}
                </Text>
                <Text style={[styles.cardDesc, { color: COLORS.MUTED }]}>
                  {c.desc}
                </Text>
              </View>

              {active ? (
                <View style={[styles.checkPill, { backgroundColor: COLORS.PRIMARY }]}>
                  <Ionicons name="checkmark" size={14} color={COLORS.CARD} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={COLORS.MUTED} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Devam */}
      <Pressable
        style={[
          styles.primaryButton,
          {
            backgroundColor: canContinue ? COLORS.PRIMARY : COLORS.PRIMARY_SOFT,
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
        <Text style={[styles.backText, { color: COLORS.MUTED }]}>Geri</Text>
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

  list: {
    gap: 10,
    marginBottom: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
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
