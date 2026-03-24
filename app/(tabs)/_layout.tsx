// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { Colors } from '../../src/theme';

function TabIcon({ name, label, focused }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <MaterialCommunityIcons name={name} size={22} color={focused ? Colors.sun : Colors.text3} />
      <Text style={{ fontSize: 10, color: focused ? Colors.sun : Colors.text3, fontWeight: '600', fontFamily: 'Gan' }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t, isRTL } = useLang();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1.5,
          height: 80,
          paddingTop: 8,
          paddingBottom: 20,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" label={t('home')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="clock-outline" label={t('recent')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="shape-outline" label={t('byCategory')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alphabetical"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="sort-alphabetical-ascending" label={t('alphabetical')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="magnify" label={t('search')} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
