// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { LanguageProvider, useLang } from '../src/context/LanguageContext';
import { RecipeProvider } from '../src/context/RecipeContext';
import { StatusBar } from 'expo-status-bar';

// Set initial default font (Gan — Hebrew default) before first render
const _dp0 = (Text as any).defaultProps ?? {};
(Text as any).defaultProps = { ..._dp0, style: [{ fontFamily: 'Gan' }, _dp0.style] };

function FontDefaultProvider({ children }: { children: React.ReactNode }) {
  const { fontApp } = useLang();

  useEffect(() => {
    const _dp = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = { ..._dp, style: [{ fontFamily: fontApp }, _dp.style] };
  }, [fontApp]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Dybbuk-Regular': require('../assets/fonts/Dybbuk-Regular.ttf'),
    'Gan': require('../assets/fonts/Gan.ttf'),
    'Chewy': require('../fonts/Chewy/Chewy-Regular.ttf'),
    'GrandRainbow': require('../fonts/grand-rainbow-font/Grandrainbowdemo-BWpWd.otf'),
    'Scripto': require('../fonts/scripto-font/Scripto-2OR2v.ttf'),
    'DoubleTrouble': require('../fonts/double-trouble-sara-font/DoubleTroubleSaraRegular-1j85g.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <FontDefaultProvider>
            <RecipeProvider>
              <StatusBar style="light" backgroundColor="#9b4a6a" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="collection" options={{ presentation: 'card' }} />
                <Stack.Screen name="add-recipe" options={{ presentation: 'card' }} />
                <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="recipe/add" options={{ presentation: 'modal' }} />
                <Stack.Screen name="recipe/edit/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="scan/album" options={{ presentation: 'modal' }} />
                <Stack.Screen name="scan/camera" options={{ presentation: 'modal' }} />
              </Stack>
            </RecipeProvider>
          </FontDefaultProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
