// src/navigation/RootNavigator.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";

import RegisterNameScreen from "../screens/RegisterNameScreen";
import RegisterLocationScreen from "../screens/RegisterLocationScreen";
import RegisterEmailScreen from "../screens/RegisterEmailScreen";
import RegisterEmailOtpScreen from "../screens/RegisterEmailOtpScreen";
import RegisterPasswordScreen from "../screens/RegisterPasswordScreen";

// ✅ NEW: Surveys
import SurveysScreen from "../screens/SurveysScreen";
import SurveyDetailScreen from "../screens/SurveyDetailScreen";

import { useTheme } from "../theme/ThemeProvider";
import { getToken } from "../lib/api"; // ✅ token bootstrap buradan

/** Register akışı boyunca taşıyacağımız base payload */
export type RegisterPayload = {
  fullName: string;
  gender: "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";
  birthDate: string; // YYYY-MM-DD
  zodiacSign?: string;

  city: string; // yaşadığın şehir
  hometown?: string; // memleket (opsiyonel)

  email: string; // email adımında dolacak (OTP ve password için gerekli)
};

export type RootStackParamList = {
  Auth: undefined;

  RegisterName: undefined;

  RegisterLocation: {
    fullName: string;
    gender: "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";
    birthDate: string; // YYYY-MM-DD
    zodiacSign?: string;
  };

  RegisterEmail: {
    fullName: string;
    gender: "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";
    birthDate: string; // YYYY-MM-DD
    zodiacSign?: string;

    city: string;
    hometown?: string;
  };

  RegisterPassword: {
    fullName: string;
    gender: "FEMALE" | "MALE" | "PREFER_NOT_TO_SAY";
    birthDate: string; // YYYY-MM-DD
    zodiacSign?: string;

    city: string;
    hometown?: string;

    email: string;
  };

  // ✅ OTP ekranı: verify sonrası devam / debug için full payload taşıyoruz
  RegisterEmailOtp: RegisterPayload;

  MainTabs: undefined;

  // ✅ NEW: Survey detail
  SurveyDetail: { id: number };
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Surveys: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { COLORS } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.MUTED,
        tabBarStyle: {
          backgroundColor: COLORS.CARD,
          borderTopColor: COLORS.BORDER,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

          if (route.name === "Home") iconName = "flame-outline";
          else if (route.name === "History") iconName = "time-outline";
          else if (route.name === "Surveys") iconName = "list-outline";
          else if (route.name === "Profile") iconName = "person-circle-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Bugün" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "Geçmiş" }} />
      <Tab.Screen name="Surveys" component={SurveysScreen} options={{ title: "Anketler" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isDark, COLORS } = useTheme();

  const [booting, setBooting] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = await getToken();
        if (!alive) return;
        setHasToken(!!token);
      } catch {
        if (!alive) return;
        setHasToken(false);
      } finally {
        if (!alive) return;
        setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ Uygulama açılışında token kontrol ederken küçük loader
  if (booting) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator size="small" color={COLORS?.PRIMARY ?? "#ff5a2a"} />
      </View>
    );
  }

  const initialRoute = hasToken ? "MainTabs" : "Auth";

  return (
    <NavigationContainer theme={isDark ? NavDarkTheme : NavLightTheme}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={LoginScreen} />

        <Stack.Screen name="RegisterName" component={RegisterNameScreen} />
        <Stack.Screen name="RegisterLocation" component={RegisterLocationScreen} />
        <Stack.Screen name="RegisterEmail" component={RegisterEmailScreen} />
        <Stack.Screen name="RegisterPassword" component={RegisterPasswordScreen} />
        <Stack.Screen name="RegisterEmailOtp" component={RegisterEmailOtpScreen} />

        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SurveyDetail" component={SurveyDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
