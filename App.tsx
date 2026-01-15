import React, { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { OneSignal } from "react-native-onesignal";

import * as Notifications from "expo-notifications";

import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { startSseBridge } from "./src/services/sseBridge";


// Splash otomatik kapanmasın
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Local notification handler (foreground’ta da göster) */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureLocalNotificationSetup() {
  // Permission
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    await Notifications.requestPermissionsAsync();
  }

  // Android channel (özellikle Android 13+ / bazı emülatörlerde şart)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

function AppInner({ appIsReady }: { appIsReady: boolean }) {
  const { ready } = useTheme();

  /** OneSignal init (senin mevcut yapı) */
  useEffect(() => {
    if (!appIsReady || !ready) return;

    const appId =
      (Constants as any)?.expoConfig?.extra?.oneSignalAppId ||
      (Constants as any)?.manifest?.extra?.oneSignalAppId;

    if (!appId) {
      console.warn(
        "❌ OneSignal AppId bulunamadı. app.json -> extra.oneSignalAppId kontrol et."
      );
      return;
    }

    OneSignal.initialize(appId);

    // İstersen prod’da açarsın:
    // OneSignal.Notifications.requestPermission(true);
  }, [appIsReady, ready]);

  /** Local notification + SSE bridge setup */
  useEffect(() => {
    if (!appIsReady || !ready) return;

    (async () => {
      try {
        await ensureLocalNotificationSetup();

        // Token varsa SSE'yi otomatik başlatır (yoksa sessizce çıkar)
        await startSseBridge();
      } catch (e) {
        console.log("[App] setup error:", e);
      }
    })();
  }, [appIsReady, ready]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && ready) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, ready]);

  if (!appIsReady || !ready) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <RootNavigator />
      <Toast />
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // splash biraz uzun kalsın
        await new Promise((r) => setTimeout(r, 5000));
      } finally {
        setAppIsReady(true);
      }
    };

    prepare();
  }, []);

  return (
    <ThemeProvider>
      <AppInner appIsReady={appIsReady} />
    </ThemeProvider>
  );
}
