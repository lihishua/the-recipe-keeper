// app/(tabs)/alphabetical.tsx
import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe } from '../../src/context/RecipeContext';
import { Colors, Radius } from '../../src/theme';

export default function AlphabeticalScreen() {
  const { t, lang, isRTL } = useLang();
  const { recipes } = useRecipes();

  const sections = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => {
      const ta = ((lang === 'he' ? a.titleHe : a.titleEn) ?? a.title).toLowerCase();
      const tb = ((lang === 'he' ? b.titleHe : b.titleEn) ?? b.title).toLowerCase();
      return ta.localeCompare(tb, lang === 'he' ? 'he' : 'en');
    });

    const groups: Record<string, Recipe[]> = {};
    for (const r of sorted) {
      const title = ((lang === 'he' ? r.titleHe : r.titleEn) ?? r.title);
      const letter = title.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(r);
    }

    return Object.entries(groups).map(([letter, data]) => ({ title: letter, data }));
  }, [recipes, lang]);

  const renderItem = ({ item }: { item: Recipe }) => {
    const title = ((lang === 'he' ? item.titleHe : item.titleEn) ?? item.title);
    return (
      <TouchableOpacity style={[styles.item, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={styles.emoji}>
          <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          <Text style={[styles.itemMeta, { textAlign: isRTL ? 'right' : 'left' }]}>{t(item.category as any)}</Text>
        </View>
        <Text style={styles.arrow}>{isRTL ? '‹' : '›'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{t('alphabetical')}</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.letterRow, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.letter}>{title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: { backgroundColor: Colors.sun, padding: 20, paddingBottom: 14 },
  topTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  letterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  letter: {
    fontSize: 22, fontWeight: '700', color: Colors.sun,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter, gap: 14,
  },
  emoji: {
    width: 46, height: 46, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  itemMeta: { fontSize: 12, color: Colors.text3 },
  arrow: { color: Colors.text3, fontSize: 18 },
});
