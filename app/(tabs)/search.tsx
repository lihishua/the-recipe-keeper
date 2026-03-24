// app/(tabs)/search.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe, Difficulty } from '../../src/context/RecipeContext';
import { Colors, Radius } from '../../src/theme';

type FilterTag = {
  key: string;
  label: string;
  test: (r: Recipe) => boolean;
};

export default function SearchScreen() {
  const { t, lang } = useLang();
  const { recipes } = useRecipes();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const filterTags: FilterTag[] = [
    { key: 'easy', label: t('easy'), test: r => r.tags.difficulty === 'easy' },
    { key: 'medium', label: t('medium'), test: r => r.tags.difficulty === 'medium' },
    { key: 'hard', label: t('hard'), test: r => r.tags.difficulty === 'hard' },
    { key: 'vegan', label: t('vegan'), test: r => !!r.tags.vegan },
    { key: 'vegetarian', label: t('vegetarian'), test: r => !!r.tags.vegetarian },
    { key: 'glutenFree', label: t('glutenFree'), test: r => !!r.tags.glutenFree },
    { key: 'dairyFree', label: t('dairyFree'), test: r => !!r.tags.dairyFree },
    { key: 'quick', label: '⚡ <30 דק׳', test: r => (r.tags.totalTime ?? 999) < 30 },
  ];

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const results = useMemo(() => {
    let list = recipes;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => {
        const title = (lang === 'he' ? r.titleHe : r.titleEn) ?? r.title;
        return (
          title.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.toLowerCase().includes(q)) ||
          (r.ingredientsHe ?? []).some(i => i.toLowerCase().includes(q)) ||
          (r.ingredientsEn ?? []).some(i => i.toLowerCase().includes(q))
        );
      });
    }

    if (activeFilters.size > 0) {
      const filters = filterTags.filter(f => activeFilters.has(f.key));
      list = list.filter(r => filters.every(f => f.test(r)));
    }

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [query, activeFilters, recipes, lang]);

  const renderItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    const timeLabel = item.tags.totalTime ? `⏱ ${item.tags.totalTime} ${t('minutes')}` : '';
    const diffLabel = item.tags.difficulty ? t(item.tags.difficulty) : '';

    return (
      <TouchableOpacity style={styles.item} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={styles.itemEmoji}>
          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemMeta}>{[timeLabel, diffLabel].filter(Boolean).join(' · ')}</Text>
        </View>
        <Text style={{ color: Colors.text3, fontSize: 18 }}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {filterTags.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, activeFilters.has(f.key) && styles.filterPillActive]}
            onPress={() => toggleFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilters.has(f.key) && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {results.length} {t('recipes')}
      </Text>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🤷</Text>
            <Text style={styles.emptyText}>{t('noResults')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  searchBar: {
    backgroundColor: Colors.mauve, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 16, color: Colors.text,
  },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterPill: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.card,
  },
  filterPillActive: { backgroundColor: Colors.sun, borderColor: Colors.sun },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.text2, fontFamily: 'Gan' },
  filterTextActive: { color: '#fff', fontFamily: 'Gan' },
  resultCount: { fontSize: 12, color: Colors.text3, paddingHorizontal: 16, marginBottom: 8, fontFamily: 'Gan' },
  item: {
    backgroundColor: Colors.card, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter, gap: 14,
  },
  itemEmoji: {
    width: 50, height: 50, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3, fontFamily: 'Gan' },
  itemMeta: { fontSize: 12, color: Colors.text3, fontFamily: 'Gan' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: Colors.text3, fontFamily: 'Gan' },
});
