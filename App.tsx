import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { OneSignal } from "react-native-onesignal";

import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import Toast from "react-native-toast-message";
import { startSseBridge } from "./src/services/sseBridge";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner({ appIsReady }: { appIsReady: boolean }) {
  const { ready } = useTheme();

  useEffect(() => {
    if (!appIsReady || !ready) return;

    const appId =
      (Constants as any)?.expoConfig?.extra?.oneSignalAppId ||
      (Constants as any)?.manifest?.extra?.oneSignalAppId;

    if (!appId) {
      console.warn("❌ OneSignal AppId yok. app.json -> extra.oneSignalAppId kontrol et.");
      return;
    }

    // ✅ init
    OneSignal.initialize(appId);

    // ✅ permission (Android 13+ dahil)
    OneSignal.Notifications.requestPermission(true).catch(() => {});

    // ✅ foreground’ta da göster (kritik)
    const sub = OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        try {
          event.getNotification().display();
        } catch {}
      }
    );

    return () => {
      try {
        // @ts-ignore
        sub?.remove?.();
      } catch {}
    };
  }, [appIsReady, ready]);

  useEffect(() => {
    if (!appIsReady || !ready) return;

    (async () => {
      try {
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
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 1200));
      } finally {
        setAppIsReady(true);
      }
    })();
  }, []);

  return (
    <ThemeProvider>
      <AppInner appIsReady={appIsReady} />
    </ThemeProvider>
  );
}
