// app/collection.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../src/context/LanguageContext';
import { useRecipes, Recipe, Category } from '../src/context/RecipeContext';
import { Colors, Radius, Shadow } from '../src/theme';

const CATEGORY_COLORS: Record<string, string> = {
  italian: '#faeee3',
  desserts: '#f0dde6',
  salads: '#d0eaec',
  breakfast: '#fdfbf7',
  asian: '#e5d5dc',
  other: '#f5ede3',
};

type Tab = 'all' | 'latest' | 'search' | 'tags' | 'suggestion';
type SortOrder = 'alpha' | 'newest';
type UnifiedTag = Category | 'vegan' | 'vegetarian' | 'glutenFree' | 'dairyFree';

const TAG_META: { key: UnifiedTag; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'italian',    icon: 'noodles' },
  { key: 'desserts',   icon: 'cake-variant-outline' },
  { key: 'salads',     icon: 'leaf' },
  { key: 'breakfast',  icon: 'egg-outline' },
  { key: 'asian',      icon: 'bowl-mix-outline' },
  { key: 'other',      icon: 'silverware-fork-knife' },
  { key: 'vegan',      icon: 'sprout' },
  { key: 'vegetarian', icon: 'food-apple-outline' },
  { key: 'glutenFree', icon: 'wheat-off' },
  { key: 'dairyFree',  icon: 'water-off' },
];

function getRecipeTags(r: Recipe): UnifiedTag[] {
  const tags: UnifiedTag[] = [r.category];
  if (r.tags?.vegan) tags.push('vegan');
  if (r.tags?.vegetarian) tags.push('vegetarian');
  if (r.tags?.glutenFree) tags.push('glutenFree');
  if (r.tags?.dairyFree) tags.push('dairyFree');
  return tags;
}

function pickRandom(recipes: Recipe[]): Recipe | null {
  if (!recipes.length) return null;
  return recipes[Math.floor(Math.random() * recipes.length)];
}

export default function CollectionScreen() {
  const { t, lang, isRTL, fontHe, fontRecipe } = useLang();
  const { recipes } = useRecipes();

  const [tab, setTab]               = useState<Tab>('all');
  const [sortOrder, setSortOrder]   = useState<SortOrder>('alpha');
  const [isGrid, setIsGrid]         = useState(true);
  const [query, setQuery]           = useState('');
  const [selectedTags, setSelectedTags]           = useState<UnifiedTag[]>([]);
  const [selectedCustomTags, setSelectedCustomTags] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<Recipe | null>(null);

  const byNewest = useMemo(() => [...recipes].sort((a, b) => b.createdAt - a.createdAt), [recipes]);

  const byAlpha = useMemo(() => [...recipes].sort((a, b) => {
    const ta = ((lang === 'he' ? a.titleHe : a.titleEn) ?? a.title).toLowerCase();
    const tb = ((lang === 'he' ? b.titleHe : b.titleEn) ?? b.title).toLowerCase();
    return ta.localeCompare(tb, lang === 'he' ? 'he' : 'en');
  }), [recipes, lang]);

  const allSorted = sortOrder === 'alpha' ? byAlpha : byNewest;

  const searchResults = useMemo(() => {
    if (!query.trim()) return allSorted;
    const q = query.toLowerCase();
    return allSorted.filter(r => {
      const title = (lang === 'he' ? r.titleHe : r.titleEn) ?? r.title;
      return (
        title.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.toLowerCase().includes(q)) ||
        (r.ingredientsHe ?? []).some(i => i.toLowerCase().includes(q))
      );
    });
  }, [query, allSorted, lang]);

  const tagResults = useMemo(() => {
    return allSorted.filter(r => {
      const rt = getRecipeTags(r);
      const standardOk = selectedTags.every(tag => rt.includes(tag));
      const customOk   = selectedCustomTags.every(tag => r.customTags?.includes(tag));
      return standardOk && customOk;
    });
  }, [selectedTags, selectedCustomTags, allSorted]);

  // Only tags that exist in at least one recipe
  const existingTags = useMemo(() => {
    const used = new Set<UnifiedTag>();
    recipes.forEach(r => {
      used.add(r.category);
      if (r.tags?.vegan) used.add('vegan');
      if (r.tags?.vegetarian) used.add('vegetarian');
      if (r.tags?.glutenFree) used.add('glutenFree');
      if (r.tags?.dairyFree) used.add('dairyFree');
    });
    return TAG_META.filter(m => used.has(m.key));
  }, [recipes]);

  const existingCustomTags = useMemo(() => {
    const all = new Set<string>();
    recipes.forEach(r => r.customTags?.forEach(t => all.add(t)));
    return Array.from(all).sort();
  }, [recipes]);

  const displayedRecipes =
    tab === 'all'    ? allSorted :
    tab === 'latest' ? byNewest.slice(0, 5) :
    tab === 'search' ? searchResults :
    tab === 'tags'   ? (selectedTags.length === 0 && selectedCustomTags.length === 0 ? allSorted : tagResults) : [];

  const rowDir = isRTL ? 'row-reverse' : 'row';

  const handleTabPress = (key: Tab) => {
    Keyboard.dismiss();
    if (key === 'suggestion') setSuggestion(pickRandom(recipes));
    setTab(key);
  };

  const toggleTag = (tag: UnifiedTag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleCustomTag = (tag: string) =>
    setSelectedCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── Grid item
  const GridItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    const thumbColor = CATEGORY_COLORS[item.category] ?? Colors.warm;
    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={[styles.gridThumb, { backgroundColor: thumbColor }]}>
          <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
        </View>
        <Text style={[styles.gridTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontRecipe }]} numberOfLines={2}>{title}</Text>
        {!!item.tags?.totalTime && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="clock-outline" size={11} color={Colors.text3} />
            <Text style={styles.gridMeta}>{item.tags.totalTime} {t('minutes')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── List item
  const ListItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    const thumbColor = CATEGORY_COLORS[item.category] ?? Colors.warm;
    return (
      <TouchableOpacity style={[styles.listItem, { flexDirection: rowDir }]} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={[styles.listThumb, { backgroundColor: thumbColor }]}>
          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontRecipe }]}>{title}</Text>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.listMeta}>{t(item.category as any)}</Text>
            {!!item.tags?.totalTime && (
              <>
                <Text style={styles.listMeta}> · </Text>
                <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.text3} />
                <Text style={styles.listMeta}>{item.tags.totalTime} {t('minutes')}</Text>
              </>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>{isRTL ? '‹' : '›'}</Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="tray-remove" size={44} color={Colors.text3} />
      <Text style={styles.emptyText}>{t('noResults')}</Text>
    </View>
  );

  const TABS = [
    { key: 'all' as const,        icon: 'format-list-bulleted' as const, label: lang === 'he' ? 'הכל' : 'All' },
    { key: 'latest' as const,     icon: 'clock-outline' as const,        label: lang === 'he' ? 'אחרונים' : 'Latest' },
    { key: 'search' as const,     icon: 'magnify' as const,              label: t('searchRecipe') },
    { key: 'tags' as const,       icon: 'tag-multiple-outline' as const, label: lang === 'he' ? 'תגיות' : 'Tags' },
    { key: 'suggestion' as const, icon: 'shuffle-variant' as const,      label: t('recipeSuggestion') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* TOP BAR */}
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontFamily: fontHe }]}>{t('myCollection')}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsGrid(v => !v)}>
          <MaterialCommunityIcons name={isGrid ? 'view-list-outline' : 'view-grid-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => handleTabPress(key)}
          >
            <MaterialCommunityIcons name={icon} size={16} color={tab === key ? '#18727d' : 'rgba(255,255,255,0.85)'} />
            <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive, { fontFamily: fontHe }]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SORT — only when on All tab */}
      {tab === 'all' && (
        <View style={[styles.sortRow, { flexDirection: rowDir }]}>
          {([
            { key: 'alpha' as const,  label: lang === 'he' ? 'א–ת' : 'A–Z' },
            { key: 'newest' as const, label: lang === 'he' ? 'חדש ראשון' : 'Newest' },
          ]).map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sortOrder === s.key && styles.sortChipActive]}
              onPress={() => setSortOrder(s.key)}
            >
              <Text style={[styles.sortChipText, sortOrder === s.key && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SEARCH INPUT */}
      {tab === 'search' && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      )}

      {/* TAG FILTER GRID */}
      {tab === 'tags' && (
        <View style={styles.tagSection}>
          {existingTags.length === 0 && existingCustomTags.length === 0 ? (
            <Text style={styles.emptyText}>{lang === 'he' ? 'אין תגיות עדיין' : 'No tags yet'}</Text>
          ) : (
            <View style={styles.tagGrid}>
              {existingTags.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => toggleTag(key)}
                  >
                    <MaterialCommunityIcons name={icon} size={16} color={active ? '#fff' : Colors.text2} />
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive, { fontFamily: fontHe }]}>
                      {t(key as any)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {existingCustomTags.map(tag => {
                const active = selectedCustomTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => toggleCustomTag(tag)}
                  >
                    <MaterialCommunityIcons name="tag-outline" size={16} color={active ? '#fff' : Colors.text2} />
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive, { fontFamily: fontHe }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* SUGGESTION */}
      {tab === 'suggestion' && (
        suggestion ? (
          <View style={styles.suggestionCard}>
            <Text style={{ fontSize: 52 }}>{suggestion.emoji}</Text>
            <Text style={[styles.suggestionTitle, { fontFamily: fontHe }]}>
              {(lang === 'he' ? suggestion.titleHe : suggestion.titleEn) ?? suggestion.title}
            </Text>
            {!!suggestion.tags?.totalTime && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.text3} />
                <Text style={styles.suggestionMeta}>{suggestion.tags.totalTime} {t('minutes')}</Text>
              </View>
            )}
            <View style={[styles.suggestionBtns, { flexDirection: rowDir }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => router.push(`/recipe/${suggestion.id}`)}
              >
                <MaterialCommunityIcons name="eye-outline" size={16} color="#fff" />
                <Text style={[styles.primaryBtnText, { fontFamily: fontHe }]}>{lang === 'he' ? 'לצפייה' : 'View'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => setSuggestion(pickRandom(recipes))}
              >
                <MaterialCommunityIcons name="shuffle-variant" size={16} color={Colors.text2} />
                <Text style={[styles.outlineBtnText, { fontFamily: fontHe }]}>{lang === 'he' ? 'אחד אחר' : 'Another'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={44} color={Colors.text3} />
            <Text style={styles.emptyText}>{t('noSuggestions')}</Text>
          </View>
        )
      )}

      {/* RECIPE GRID / LIST */}
      {tab !== 'suggestion' && (
        isGrid ? (
          <FlatList
            key="grid"
            data={displayedRecipes}
            keyExtractor={r => r.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => <GridItem item={item} />}
            ListEmptyComponent={<EmptyState />}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <FlatList
            key="list"
            data={displayedRecipes}
            keyExtractor={r => r.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => <ListItem item={item} />}
            ListEmptyComponent={<EmptyState />}
            keyboardShouldPersistTaps="handled"
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },

  topBar: {
    backgroundColor: Colors.mauve, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Tabs
  tabRow: {
    backgroundColor: '#18727d',
    paddingHorizontal: 10, paddingVertical: 10, gap: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  tabBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.pill,
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 0, gap: 4, flexShrink: 0,
  },
  tabBtnActive: { backgroundColor: '#fff' },
  tabBtnText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  tabBtnTextActive: { color: '#18727d' },

  // Sort
  sortRow: {
    backgroundColor: Colors.sunLighter, paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  sortChip: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.card,
  },
  sortChipActive: { backgroundColor: Colors.sun, borderColor: Colors.sun },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  sortChipTextActive: { color: '#fff' },

  // Search
  searchRow: {
    padding: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.text,
  },

  // Tags
  tagSection: {
    padding: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.cream,
  },
  tagChipActive: { backgroundColor: Colors.sun, borderColor: Colors.sun },
  tagChipText: { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tagChipTextActive: { color: '#fff' },

  // Suggestion
  suggestionCard: {
    margin: 20, backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: 28, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, ...Shadow.md,
  },
  suggestionTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 10, textAlign: 'center' },
  suggestionMeta: { fontSize: 13, color: Colors.text3 },
  suggestionBtns: { marginTop: 20, gap: 12 },
  primaryBtn: { backgroundColor: Colors.sun, borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  outlineBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 12 },
  outlineBtnText: { color: Colors.text2, fontWeight: '600', fontSize: 15 },

  // Grid
  gridContent: { padding: 12, gap: 12, paddingBottom: 100 },
  gridItem: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 12, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm,
  },
  gridThumb: {
    width: '100%', aspectRatio: 1.2, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  gridTitle: { fontSize: 15, fontFamily: 'Dybbuk-Regular', color: Colors.text, marginBottom: 4 },
  gridMeta: { fontSize: 11, color: Colors.text3 },

  // List
  listItem: {
    backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter,
    alignItems: 'center', gap: 14,
  },
  listThumb: {
    width: 52, height: 52, backgroundColor: Colors.warm,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  listTitle: { fontSize: 17, fontFamily: 'Dybbuk-Regular', color: Colors.text, marginBottom: 3 },
  listMeta: { fontSize: 12, color: Colors.text3 },
  arrow: { color: Colors.text3, fontSize: 18 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.text3 },
});
