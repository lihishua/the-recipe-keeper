// app/_layout.tsx
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { LanguageProvider } from '../src/context/LanguageContext';
import { RecipeProvider } from '../src/context/RecipeContext';
import { StatusBar } from 'expo-status-bar';

// Make Gan the default font for all Text components app-wide
const _dp = (Text as any).defaultProps ?? {};
(Text as any).defaultProps = { ..._dp, style: [{ fontFamily: 'Gan' }, _dp.style] };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Dybbuk-Regular': require('../assets/fonts/Dybbuk-Regular.ttf'),
    'Gan': require('../assets/fonts/Gan.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <RecipeProvider>
            <StatusBar style="light" backgroundColor="#C2698A" />
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
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
