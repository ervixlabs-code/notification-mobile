// src/components/Screen.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";

type Props = {
  children: React.ReactNode;
};

export default function Screen({ children }: Props) {
  const { COLORS } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: COLORS.BG }]}
      edges={["top", "right", "left", "bottom"]}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24, // 🔥 işte bu saatten mesafe veriyor
  },
});
