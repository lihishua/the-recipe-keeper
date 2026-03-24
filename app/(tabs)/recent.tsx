// app/(tabs)/recent.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe } from '../../src/context/RecipeContext';
import { Colors, Radius } from '../../src/theme';

function timeAgo(ts: number, lang: string): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (lang === 'he') {
    if (days === 0) return 'היום';
    if (days === 1) return 'אתמול';
    if (days < 7) return `לפני ${days} ימים`;
    if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
    return `לפני ${Math.floor(days / 30)} חודשים`;
  }
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function RecentScreen() {
  const { t, lang } = useLang();
  const { recipes } = useRecipes();

  const sorted = [...recipes].sort((a, b) => b.createdAt - a.createdAt);

  const renderItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    return (
      <TouchableOpacity style={styles.item} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={styles.emoji}>
          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemMeta}>
            {t(item.category as any)} · {timeAgo(item.createdAt, lang)}
          </Text>
        </View>
        <View style={styles.srcBadge}>
          <Text style={styles.srcText}>
            {item.sourceType === 'photo' ? '📸' : item.sourceType === 'video' ? '▶' : item.sourceType === 'screenshot' ? '📱' : '✏️'}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{t('recentlySaved')}</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ color: Colors.text3, marginTop: 12, fontSize: 16 }}>{t('noResults')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: { backgroundColor: Colors.mauve, padding: 20, paddingBottom: 14 },
  topTitle: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: 'Gan' },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter, gap: 14,
  },
  emoji: {
    width: 50, height: 50, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3, fontFamily: 'Gan' },
  itemMeta: { fontSize: 12, color: Colors.text3, fontFamily: 'Gan' },
  srcBadge: { backgroundColor: Colors.sunLighter, borderRadius: 8, padding: 6 },
  srcText: { fontSize: 14, fontFamily: 'Gan' },
  arrow: { color: Colors.text3, fontSize: 18, fontFamily: 'Gan' },
});
