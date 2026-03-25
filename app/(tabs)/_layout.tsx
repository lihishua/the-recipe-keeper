// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { Colors, Radius } from '../../src/theme';

function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  focused: boolean;
}) {
  return (
    <View style={[styles.tabBtn, focused && styles.tabBtnActive]}>
      <MaterialCommunityIcons
        name={name}
        size={22}
        color={focused ? Colors.blue : 'rgba(255,255,255,0.7)'}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLang();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.blue,
          borderTopWidth: 0,
          height: 72,
          paddingTop: 10,
          paddingBottom: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="clock-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="shape-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alphabetical"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="sort-alphabetical-ascending" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="magnify" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
