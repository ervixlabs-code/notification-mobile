// src/screens/RegisterLocationScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Screen from "../components/Screen";
import { useTheme } from "../theme/ThemeProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterLocation">;

const CITIES_TR = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin",
  "Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa",
  "Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum",
  "Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay","Iğdır","Isparta","İstanbul","İzmir",
  "Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale","Kırklareli","Kırşehir",
  "Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir",
  "Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Şanlıurfa","Şırnak",
  "Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"
];

function includesTr(haystack: string, needle: string) {
  const h = haystack.toLocaleLowerCase("tr-TR");
  const n = needle.toLocaleLowerCase("tr-TR");
  return h.includes(n);
}

function normalizeCityName(name: string) {
  // "Istanbul" -> "İstanbul" gibi durumlar için TR locale ile normalize
  const n = name.trim();
  // Liste içinde birebir yakalamaya çalış
  const found = CITIES_TR.find((c) => c.toLocaleLowerCase("tr-TR") === n.toLocaleLowerCase("tr-TR"));
  return found || n;
}

export default function RegisterLocationScreen({ route, navigation }: Props) {
  const { COLORS } = useTheme();

  const { fullName, gender, birthDate, zodiacSign } = route.params;

  const [city, setCity] = useState("");
  const [hometown, setHometown] = useState("");

  const [cityQuery, setCityQuery] = useState("");
  const [homeQuery, setHomeQuery] = useState("");

  const [gpsLoading, setGpsLoading] = useState(false);

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim();
    if (!q) return [];
    return CITIES_TR.filter((c) => includesTr(c, q)).slice(0, 6);
  }, [cityQuery]);

  const homeSuggestions = useMemo(() => {
    const q = homeQuery.trim();
    if (!q) return [];
    return CITIES_TR.filter((c) => includesTr(c, q)).slice(0, 6);
  }, [homeQuery]);

  const canContinue = city.trim().length > 0;

  const goNext = (skipHometown: boolean) => {
    if (!city.trim()) {
      return Alert.alert("Uyarı", "Lütfen yaşadığınız şehri seçin.");
    }

    navigation.navigate("RegisterEmail", {
      fullName,
      gender,
      birthDate,
      zodiacSign,
      city: city.trim(),
      hometown: skipHometown ? undefined : hometown.trim() || undefined,
    });
  };

  const handleDetectCity = async () => {
    try {
      setGpsLoading(true);

      // 1) permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert(
          "İzin Gerekli",
          "Şehrinizi otomatik seçebilmemiz için konum izni vermeniz gerekiyor."
        );
      }

      // 2) get current position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3) reverse geocode -> city/region
      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const first = results?.[0];
      const cityCandidate =
        first?.city ||
        first?.subregion || // bazı cihazlarda şehir burada gelebiliyor
        first?.region;      // il

      if (!cityCandidate) {
        return Alert.alert(
          "Bulunamadı",
          "Şehrinizi otomatik tespit edemedik. Lütfen manuel seçin."
        );
      }

      const normalized = normalizeCityName(cityCandidate);

      // 4) Sadece şehir doldur
      setCity(normalized);
      setCityQuery(normalized);

      // (Opsiyonel) Memleketi dokunmuyoruz.
    } catch (e: any) {
      Alert.alert(
        "Hata",
        e?.message || "Konum alınırken bir sorun oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
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
          <Text style={[styles.title, { color: COLORS.TEXT }]}>Konum & Kökler</Text>
          <Text style={[styles.subtitle, { color: COLORS.MUTED }]}>
            Yaşadığınız şehri seçin. İsterseniz memleket bilginizi de ekleyebilirsiniz.
          </Text>

          {/* Yaşadığın şehir */}
          <View style={{ marginBottom: 18 }}>
            <Text style={[styles.label, { color: COLORS.MUTED }]}>Yaşadığın Şehir</Text>

            <View
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.CARD,
                  borderColor: COLORS.BORDER,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                },
              ]}
            >
              <Ionicons name="location-outline" size={18} color={COLORS.MUTED} />
              <TextInput
                style={{ flex: 1, color: COLORS.TEXT, fontSize: 15 }}
                placeholder="Şehir ara (örn. İstanbul)"
                placeholderTextColor={COLORS.MUTED}
                value={cityQuery}
                onChangeText={(t) => {
                  setCityQuery(t);
                  setCity(t);
                }}
              />
              {!!cityQuery && (
                <Pressable
                  onPress={() => {
                    setCityQuery("");
                    setCity("");
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.MUTED} />
                </Pressable>
              )}
            </View>

            {/* suggestions */}
            {citySuggestions.length > 0 && (
              <View style={[styles.suggestBox, { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD }]}>
                {citySuggestions.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setCity(s);
                      setCityQuery(s);
                    }}
                    style={styles.suggestRow}
                  >
                    <Text style={{ color: COLORS.TEXT, fontSize: 14 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* GPS butonu */}
            <Pressable
              onPress={gpsLoading ? undefined : handleDetectCity}
              disabled={gpsLoading}
              style={[
                styles.ghostButton,
                { borderColor: COLORS.BORDER, opacity: gpsLoading ? 0.7 : 1 },
              ]}
            >
              {gpsLoading ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="navigate-outline" size={16} color={COLORS.PRIMARY} />
              )}
              <Text style={{ marginLeft: 8, color: COLORS.PRIMARY, fontWeight: "700" }}>
                {gpsLoading ? "Bulunuyor..." : "Konumumu Bul"}
              </Text>
            </Pressable>
          </View>

          {/* Memleket (opsiyonel) */}
          <View style={{ marginBottom: 6 }}>
            <Text style={[styles.label, { color: COLORS.MUTED }]}>
              Nerelisin? (Memleket) <Text style={{ color: COLORS.MUTED }}>(Opsiyonel)</Text>
            </Text>

            <View
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.CARD,
                  borderColor: COLORS.BORDER,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                },
              ]}
            >
              <Ionicons name="home-outline" size={18} color={COLORS.MUTED} />
              <TextInput
                style={{ flex: 1, color: COLORS.TEXT, fontSize: 15 }}
                placeholder="Memleket ara (örn. Trabzon)"
                placeholderTextColor={COLORS.MUTED}
                value={homeQuery}
                onChangeText={(t) => {
                  setHomeQuery(t);
                  setHometown(t);
                }}
              />
              {!!homeQuery && (
                <Pressable
                  onPress={() => {
                    setHomeQuery("");
                    setHometown("");
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.MUTED} />
                </Pressable>
              )}
            </View>

            {homeSuggestions.length > 0 && (
              <View style={[styles.suggestBox, { borderColor: COLORS.BORDER, backgroundColor: COLORS.CARD }]}>
                {homeSuggestions.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setHometown(s);
                      setHomeQuery(s);
                    }}
                    style={styles.suggestRow}
                  >
                    <Text style={{ color: COLORS.TEXT, fontSize: 14 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* küçük bilgilendirme */}
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.MUTED} />
            <Text style={[styles.infoText, { color: COLORS.MUTED }]}>
              Konum yalnızca şehrinizi otomatik seçmek için kullanılır.
            </Text>
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
            onPress={() => goNext(false)}
          >
            <Text style={[styles.primaryButtonText, { color: canContinue ? COLORS.CARD : COLORS.MUTED }]}>
              Devam et
            </Text>
          </Pressable>

          <Pressable onPress={() => goNext(true)} style={styles.skipRow}>
            <Text style={{ color: COLORS.MUTED, fontSize: 13 }}>Memleketi eklemek istemiyorum</Text>
            <Text style={{ color: COLORS.PRIMARY, fontSize: 13, fontWeight: "700", marginLeft: 6 }}>
              Atla
            </Text>
          </Pressable>
        </View>
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
    marginBottom: 18,
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
  },
  suggestBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  suggestRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ghostButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
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
  skipRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
});
