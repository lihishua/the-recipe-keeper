// app/(tabs)/categories.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe, Category } from '../../src/context/RecipeContext';
import { Colors, Radius, Shadow } from '../../src/theme';

const CATS: { key: Category; emoji: string; bg: string }[] = [
  { key: 'italian',   emoji: '🍝', bg: '#faeee3' },
  { key: 'desserts',  emoji: '🍰', bg: '#f0dde6' },
  { key: 'salads',    emoji: '🥗', bg: '#d0eaec' },
  { key: 'breakfast', emoji: '🥞', bg: '#fdfbf7' },
  { key: 'asian',     emoji: '🍜', bg: '#e5d5dc' },
  { key: 'other',     emoji: '🍽', bg: '#f5ede3' },
];

export default function CategoriesScreen() {
  const { t, lang } = useLang();
  const { recipes } = useRecipes();
  const [selected, setSelected] = useState<Category | null>(null);

  const countFor = (cat: Category) => recipes.filter(r => r.category === cat).length;
  const filtered = selected ? recipes.filter(r => r.category === selected) : [];

  if (selected) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>
            {CATS.find(c => c.key === selected)?.emoji} {t(selected)}
          </Text>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
            return (
              <TouchableOpacity style={styles.item} onPress={() => router.push(`/recipe/${item.id}`)}>
                <View style={styles.emoji}>
                  <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.tags.totalTime ? `⏱ ${item.tags.totalTime} ${t('minutes')}` : ''}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 48 }}>🍽</Text>
              <Text style={{ color: Colors.text3, marginTop: 12 }}>{t('noResults')}</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{t('byCategory')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {CATS.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catCard, { backgroundColor: cat.bg }, Shadow.sm]}
            onPress={() => setSelected(cat.key)}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={styles.catName}>{t(cat.key)}</Text>
            <Text style={styles.catCount}>{countFor(cat.key)} {t('recipes')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.mauve, flexDirection: 'row',
    alignItems: 'center', padding: 20, paddingBottom: 14, gap: 12,
  },
  topTitle: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: 'Gan' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.25)', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 22, lineHeight: 26, fontFamily: 'Gan' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12, paddingBottom: 100 },
  catCard: {
    width: '47%', borderRadius: Radius.lg, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(223,123,62,0.2)',
  },
  catEmoji: { fontSize: 38, marginBottom: 8 },
  catName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4, fontFamily: 'Gan' },
  catCount: { fontSize: 12, color: Colors.text3, fontFamily: 'Gan' },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter, gap: 14,
  },
  emoji: {
    width: 46, height: 46, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2, fontFamily: 'Gan' },
  itemMeta: { fontSize: 12, color: Colors.text3, fontFamily: 'Gan' },
  arrow: { color: Colors.text3, fontSize: 18, fontFamily: 'Gan' },
});
