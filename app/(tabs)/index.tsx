// app/(tabs)/index.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Animated, Alert, Image,
  ScrollView, Keyboard, Dimensions, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe, Category, computeTotalTime } from '../../src/context/RecipeContext';
import { extractRecipeFromImage, extractRecipeFromImages, extractRecipeFromUrl } from '../../src/services/claudeService';
import { draftStore } from '../../src/services/draftStore';
import { Colors, Radius, Shadow } from '../../src/theme';

// ── Types ────────────────────────────────────────────────────────────────────
type SortOrder = 'alpha' | 'newest';
type UnifiedTag = Category | 'vegan' | 'vegetarian' | 'glutenFree' | 'dairyFree';
type ActivePanel = 'search' | 'filter' | null;

// Category line-art icons (monochrome, same style for all cards)
const CATEGORY_ICON: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  italian:   'noodles',
  desserts:  'cake-variant-outline',
  salads:    'leaf',
  breakfast: 'egg-outline',
  asian:     'bowl-mix-outline',
  other:     'silverware-fork-knife',
};

const TAG_META: { key: UnifiedTag; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'italian',    icon: 'noodles' },
  { key: 'desserts',   icon: 'cake-variant-outline' },
  { key: 'salads',     icon: 'leaf' },
  { key: 'breakfast',  icon: 'egg-outline' },
  { key: 'asian',      icon: 'bowl-mix-outline' },
  { key: 'other',      icon: 'silverware-fork-knife' },
  { key: 'vegan',      icon: 'sprout' },
  { key: 'vegetarian', icon: 'food-apple-outline' },
  { key: 'glutenFree', icon: 'barley' },
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

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t, lang, setLang, isRTL, fontHe, fontApp, fontHeader, fontRecipe } = useLang();
  const { recipes } = useRecipes();

  // ── View state
  const [isGrid, setIsGrid]             = useState(true);
  const [sortOrder, setSortOrder]       = useState<SortOrder>('alpha');
  const [query, setQuery]               = useState('');
  const [selectedTags, setSelectedTags]           = useState<UnifiedTag[]>([]);
  const [selectedCustomTags, setSelectedCustomTags] = useState<string[]>([]);
  const [activePanel, setActivePanel]   = useState<ActivePanel>(null);

  // ── Add-recipe modal state
  const [addModalVisible, setAddModalVisible]     = useState(false);
  const [photoDialExpanded, setPhotoDialExpanded] = useState(false);
  const [linkExpanded, setLinkExpanded]           = useState(false);
  const [linkInput, setLinkInput]             = useState('');
  const [scanning, setScanning]               = useState(false);
  const [scanningMsg, setScanningMsg]         = useState('');
  const [fabExpanded, setFabExpanded]         = useState(false);

  const rowDir = isRTL ? 'row-reverse' : 'row';

  // ── Speed-dial animation ──────────────────────────────────────────────────
  // Container: 300×300. FAB absolute bottom:0, right:0.
  // Mini buttons (54px) at bottom:7, right:7 → center at (266, 266) in container.
  // Camera expanded center: (266, 266-85) = (266, 181).
  // Photo sub-buttons at bottom:92, right:7 → same (266,181) center.
  const fabOpen   = useRef(new Animated.Value(0)).current;
  const photoOpen = useRef(new Animated.Value(0)).current;

  const spring = (anim: Animated.Value, toValue: number) =>
    Animated.spring(anim, { toValue, useNativeDriver: true, tension: 80, friction: 9 });

  const toggleFab = () => {
    if (photoDialExpanded) {
      // Back to main dial from photo sub-dial
      setPhotoDialExpanded(false);
      setFabExpanded(true);
      Animated.parallel([spring(fabOpen, 1), spring(photoOpen, 0)]).start();
    } else {
      const opening = !fabExpanded;
      setFabExpanded(opening);
      spring(fabOpen, opening ? 1 : 0).start();
    }
  };

  const closeFab = () => {
    setFabExpanded(false);
    setPhotoDialExpanded(false);
    Animated.parallel([spring(fabOpen, 0), spring(photoOpen, 0)]).start();
  };

  const openPhotoFab = () => {
    setPhotoDialExpanded(true);
    // Collapse main dial and open photo sub-dial simultaneously — no overlap
    Animated.parallel([spring(fabOpen, 0), spring(photoOpen, 1)]).start();
  };

  // Main dial: R=85, 3 buttons at 90°/45°/0° from vertical
  const R = 85;
  const dial1X = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const dial1Y = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -R] });
  const dial2X = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.round(R * 0.707)] });
  const dial2Y = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.round(R * 0.707)] });
  const dial3X = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -R] });
  const dial3Y = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const dialOpacity = fabOpen;
  const dialScale   = fabOpen.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const fabRotate   = fabOpen.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  // Photo sub-dial: same positions as main dial (fans from FAB, replacing it — no overlap)
  const pdial1X = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const pdial1Y = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -R] });
  const pdial2X = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.round(R * 0.707)] });
  const pdial2Y = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.round(R * 0.707)] });
  const pdial3X = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, -R] });
  const pdial3Y = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const pDialOpacity = photoOpen;
  const pDialScale   = photoOpen.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  // ── Cooking pot animation ──────────────────────────────────────────────────
  const potRock   = useRef(new Animated.Value(0)).current;
  const potBounce = useRef(new Animated.Value(0)).current;
  const steam1    = useRef(new Animated.Value(0)).current;
  const steam2    = useRef(new Animated.Value(0)).current;
  const steam3    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scanning) return;
    potRock.setValue(0); potBounce.setValue(0);
    steam1.setValue(0); steam2.setValue(0); steam3.setValue(0);

    const rock = Animated.loop(Animated.sequence([
      Animated.timing(potRock,   { toValue:  1,  duration: 280, useNativeDriver: true }),
      Animated.timing(potRock,   { toValue: -1,  duration: 560, useNativeDriver: true }),
      Animated.timing(potRock,   { toValue:  0,  duration: 280, useNativeDriver: true }),
      Animated.delay(500),
    ]));
    const bounce = Animated.loop(Animated.sequence([
      Animated.timing(potBounce, { toValue: -5, duration: 350, useNativeDriver: true }),
      Animated.timing(potBounce, { toValue:  0, duration: 350, useNativeDriver: true }),
      Animated.delay(400),
    ]));
    const makeSteam = (val: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(val, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
      ]));

    rock.start(); bounce.start();
    makeSteam(steam1, 0).start();
    makeSteam(steam2, 350).start();
    makeSteam(steam3, 700).start();
    return () => { rock.stop(); bounce.stop(); steam1.setValue(0); steam2.setValue(0); steam3.setValue(0); };
  }, [scanning]);

  const potRotate = potRock.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });
  const makeSteamStyle = (val: Animated.Value, x: number) => ({
    position: 'absolute' as const,
    bottom: 52,
    left: x,
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }],
  });

  // ── Recipe data ───────────────────────────────────────────────────────────
  const byNewest = useMemo(() =>
    [...recipes].sort((a, b) => b.createdAt - a.createdAt), [recipes]);

  const byAlpha = useMemo(() =>
    [...recipes].sort((a, b) => {
      const ta = ((lang === 'he' ? a.titleHe : a.titleEn) ?? a.title).toLowerCase();
      const tb = ((lang === 'he' ? b.titleHe : b.titleEn) ?? b.title).toLowerCase();
      return ta.localeCompare(tb, lang === 'he' ? 'he' : 'en');
    }), [recipes, lang]);

  const allSorted = sortOrder === 'alpha' ? byAlpha : byNewest;

  const displayed = useMemo(() => {
    let base = allSorted;
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(r => {
        const title = (lang === 'he' ? r.titleHe : r.titleEn) ?? r.title;
        return title.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.toLowerCase().includes(q));
      });
    }
    if (selectedTags.length > 0 || selectedCustomTags.length > 0) {
      base = base.filter(r => {
        const rt = getRecipeTags(r);
        return selectedTags.every(tag => rt.includes(tag)) &&
               selectedCustomTags.every(tag => r.customTags?.includes(tag));
      });
    }
    return base;
  }, [allSorted, query, selectedTags, selectedCustomTags, lang]);

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
    recipes.forEach(r => r.customTags?.forEach(ct => all.add(ct)));
    return Array.from(all).sort();
  }, [recipes]);

  const hasActiveFilters = selectedTags.length > 0 || selectedCustomTags.length > 0;

  // ── Toolbar helpers ───────────────────────────────────────────────────────
  const togglePanel = (panel: 'search' | 'filter') => {
    Keyboard.dismiss();
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const toggleTag = (tag: UnifiedTag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleCustomTag = (tag: string) =>
    setSelectedCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── Photo logic ───────────────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    if (result.assets.length === 1) {
      await processImage(result.assets[0]);
    } else {
      await processImages(result.assets.map(a => a.uri));
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(lang === 'he' ? 'נדרשת הרשאה' : 'Permission required',
                  lang === 'he' ? 'נא לאפשר גישה למצלמה' : 'Please allow camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
    if (result.canceled) return;
    await processImage(result.assets[0]);
  };

  const processImage = async (asset: ImagePicker.ImagePickerAsset) => {
    closeFab();
    setScanningMsg(t('aiReading'));
    setScanning(true);
    try {
      const precomputed = asset.base64
        ? { base64: asset.base64, mediaType: asset.mimeType ?? 'image/jpeg' }
        : undefined;
      let extracted: Awaited<ReturnType<typeof extractRecipeFromImage>>;
      try {
        extracted = await extractRecipeFromImage(asset.uri, precomputed);
      } catch (apiErr: any) {
        Alert.alert(lang === 'he' ? 'שגיאת API' : 'API Error', apiErr?.message ?? '');
        return;
      }
      if (!extracted) {
        Alert.alert(
          lang === 'he' ? 'לא זוהה מתכון' : 'No recipe found',
          lang === 'he' ? 'לא הצלחנו לזהות מתכון בתמונה זו.' : 'Could not detect a recipe in this image.',
        );
        return;
      }
      draftStore.set({
        recipe: {
          titleHe: extracted.titleHe, titleEn: extracted.titleEn,
          ingredientsHe: extracted.ingredientsHe, ingredientsEn: extracted.ingredientsEn,
          stepsHe: extracted.stepsHe, stepsEn: extracted.stepsEn,
          tags: extracted.tags ?? {}, category: extracted.category ?? 'other',
          emoji: extracted.emoji ?? '🍽', sourceType: 'photo', sourceUri: asset.uri,
        },
        confidence: (extracted as any).confidence ?? {},
      });
    } finally {
      setScanning(false);
    }
    if (draftStore.get()) router.push('/recipe/add');
  };

  const processImages = async (uris: string[]) => {
    closeFab();
    setScanningMsg(t('aiReading'));
    setScanning(true);
    try {
      let extracted: Awaited<ReturnType<typeof extractRecipeFromImages>>;
      try {
        extracted = await extractRecipeFromImages(uris);
      } catch (apiErr: any) {
        Alert.alert(lang === 'he' ? 'שגיאת API' : 'API Error', apiErr?.message ?? '');
        return;
      }
      if (!extracted) {
        Alert.alert(
          lang === 'he' ? 'לא זוהה מתכון' : 'No recipe found',
          lang === 'he' ? 'לא הצלחנו לזהות מתכון בתמונות אלו.' : 'Could not detect a recipe in these images.',
        );
        return;
      }
      draftStore.set({
        recipe: {
          titleHe: extracted.titleHe, titleEn: extracted.titleEn,
          ingredientsHe: extracted.ingredientsHe, ingredientsEn: extracted.ingredientsEn,
          stepsHe: extracted.stepsHe, stepsEn: extracted.stepsEn,
          tags: extracted.tags ?? {}, category: extracted.category ?? 'other',
          emoji: extracted.emoji ?? '🍽', sourceType: 'photo', sourceUri: uris[0],
        },
        confidence: {},
      });
    } finally {
      setScanning(false);
    }
    if (draftStore.get()) router.push('/recipe/add');
  };

  // ── Link logic ────────────────────────────────────────────────────────────
  const handleExtractFromLink = async () => {
    const url = linkInput.trim();
    if (!url) return;
    setLinkExpanded(false);
    setAddModalVisible(false);
    setLinkInput('');
    setScanningMsg(t('extractingLink'));
    setScanning(true);
    try {
      let result: Awaited<ReturnType<typeof extractRecipeFromUrl>>;
      try {
        result = await extractRecipeFromUrl(url);
      } catch (apiErr: any) {
        Alert.alert(lang === 'he' ? 'שגיאת API' : 'API Error', apiErr?.message ?? '');
        return;
      }
      if (!result) {
        Alert.alert(
          lang === 'he' ? 'לא נמצא מתכון' : 'No recipe found',
          lang === 'he' ? 'לא הצלחנו לזהות מתכון בקישור זה.' : 'Could not detect a recipe at this link.',
        );
        return;
      }
      const { recipe: extracted, imageUrl } = result;
      draftStore.set({
        recipe: {
          titleHe: extracted.titleHe, titleEn: extracted.titleEn,
          ingredientsHe: extracted.ingredientsHe, ingredientsEn: extracted.ingredientsEn,
          stepsHe: extracted.stepsHe, stepsEn: extracted.stepsEn,
          tags: extracted.tags ?? {}, category: extracted.category ?? 'other',
          emoji: extracted.emoji ?? '🍽',
          sourceType: 'link', sourceUrl: url, sourceUri: imageUrl,
        },
        confidence: {},
      });
    } finally {
      setScanning(false);
    }
    if (draftStore.get()) router.push('/recipe/add');
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const RecipeThumb = ({ item, size }: { item: Recipe; size: number }) => {
    const icon = CATEGORY_ICON[item.category] ?? 'silverware-fork-knife';
    if (item.sourceUri) {
      return (
        <Image
          source={{ uri: item.sourceUri }}
          style={{ width: '100%', height: size, borderRadius: Radius.md }}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[styles.thumbPlaceholder, { height: size }]}>
        <MaterialCommunityIcons name={icon} size={size * 0.42} color={Colors.text2} />
      </View>
    );
  };

  const GridItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    const total = computeTotalTime(item.tags);
    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/recipe/${item.id}`)}>
        <RecipeThumb item={item} size={110} />
        <Text style={[styles.gridTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontRecipe }]} numberOfLines={2}>
          {title}
        </Text>
        {total > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <MaterialCommunityIcons name="clock-outline" size={11} color={Colors.text3} />
            <Text style={styles.gridMeta}>{total} {t('minutes')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListItem = ({ item }: { item: Recipe }) => {
    const title = (lang === 'he' ? item.titleHe : item.titleEn) ?? item.title;
    const total = computeTotalTime(item.tags);
    return (
      <TouchableOpacity style={[styles.listItem, { flexDirection: rowDir }]} onPress={() => router.push(`/recipe/${item.id}`)}>
        <View style={styles.listThumbWrap}>
          <RecipeThumb item={item} size={52} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontRecipe }]}>{title}</Text>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.listMeta}>{t(item.category as any)}</Text>
            {total > 0 && (
              <>
                <Text style={styles.listMeta}> · </Text>
                <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.text3} />
                <Text style={styles.listMeta}>{total} {t('minutes')}</Text>
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
      <MaterialCommunityIcons name="chef-hat" size={52} color={Colors.text3} />
      <Text style={[styles.emptyText, { fontFamily: fontHe }]}>
        {lang === 'he' ? 'עדיין אין מתכונים' : 'No recipes yet'}
      </Text>
      <Text style={[styles.emptyHint, { fontFamily: fontHe }]}>
        {lang === 'he' ? 'לחץ על + כדי להוסיף את הראשון' : 'Tap + to add your first recipe'}
      </Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/images/2spoons-logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </View>

      {/* ── TOOLBAR ── */}
      <View style={[styles.toolbar, { flexDirection: rowDir }]}>
        {/* Centered action buttons */}
        <View style={[styles.toolbarCenter, { flexDirection: rowDir }]}>
          <TouchableOpacity
            style={[styles.toolBtn, activePanel === 'search' && styles.toolBtnActive]}
            onPress={() => togglePanel('search')}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={activePanel === 'search' ? Colors.sun : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, (activePanel === 'filter' || hasActiveFilters) && styles.toolBtnActive]}
            onPress={() => togglePanel('filter')}
          >
            <MaterialCommunityIcons
              name="tag-multiple-outline" size={20}
              color={(activePanel === 'filter' || hasActiveFilters) ? Colors.sun : '#fff'}
            />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, sortOrder === 'newest' && styles.toolBtnActive]}
            onPress={() => { setSortOrder(s => s === 'alpha' ? 'newest' : 'alpha'); setActivePanel(null); }}
          >
            <MaterialCommunityIcons name="clock-outline" size={20} color={sortOrder === 'newest' ? Colors.sun : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={() => setIsGrid(v => !v)}>
            <MaterialCommunityIcons
              name={isGrid ? 'view-list-outline' : 'view-grid-outline'}
              size={20} color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Language toggle — floated to the edge */}
        <TouchableOpacity
          style={[styles.langToggle, { position: 'absolute', right: isRTL ? undefined : 12, left: isRTL ? 12 : undefined }]}
          onPress={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          <Text style={[styles.langText, { fontFamily: lang === 'he' ? 'Chewy' : 'Gan' }]}>{lang === 'he' ? 'EN' : 'עב'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── SEARCH PANEL ── */}
      {activePanel === 'search' && (
        <View style={styles.panelRow}>
          <TextInput
            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* ── FILTER PANEL ── */}
      {activePanel === 'filter' && (
        <View style={styles.panelRow}>
          {existingTags.length === 0 && existingCustomTags.length === 0 ? (
            <Text style={[styles.emptyText, { fontFamily: fontHe }]}>
              {lang === 'he' ? 'אין תגיות עדיין' : 'No tags yet'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {existingTags.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity key={key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => toggleTag(key)}
                  >
                    <MaterialCommunityIcons name={icon} size={14} color={active ? '#fff' : Colors.text2} />
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive, { fontFamily: fontHe }]}>
                      {t(key as any)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {existingCustomTags.map(tag => {
                const active = selectedCustomTags.includes(tag);
                return (
                  <TouchableOpacity key={tag}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => toggleCustomTag(tag)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive, { fontFamily: fontHe }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}


      {/* ── RECIPE LIST / GRID ── */}
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.07, resizeMode: 'repeat' }}
      >
        {isGrid ? (
          <FlatList
            key="grid"
            data={displayed}
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
            data={displayed}
            keyExtractor={r => r.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => <ListItem item={item} />}
            ListEmptyComponent={<EmptyState />}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </ImageBackground>

      {/* ── SPEED-DIAL BACKDROP ── */}
      {fabExpanded && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, styles.dialBackdrop]}
          activeOpacity={1}
          onPress={closeFab}
        />
      )}

      {/* ── SPEED-DIAL (300×300 container so buttons stay in bounds) ── */}
      <View style={styles.speedDial} pointerEvents="box-none">

        {/* ── Photo sub-dial (fans from camera button's expanded position) ── */}
        <Animated.View pointerEvents={photoDialExpanded ? 'auto' : 'none'}
          style={[styles.photoDialBtn, { opacity: pDialOpacity, transform: [{ translateX: pdial1X }, { translateY: pdial1Y }, { scale: pDialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: '#f0dde6' }]} onPress={handlePickPhoto} activeOpacity={0.88}>
            <MaterialCommunityIcons name="image-outline" size={22} color={Colors.mauve} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View pointerEvents={photoDialExpanded ? 'auto' : 'none'}
          style={[styles.photoDialBtn, { opacity: pDialOpacity, transform: [{ translateX: pdial2X }, { translateY: pdial2Y }, { scale: pDialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: '#f0dde6' }]} onPress={() => { closeFab(); router.push('/scan/album'); }} activeOpacity={0.88}>
            <MaterialCommunityIcons name="magnify-scan" size={22} color={Colors.mauve} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View pointerEvents={photoDialExpanded ? 'auto' : 'none'}
          style={[styles.photoDialBtn, { opacity: pDialOpacity, transform: [{ translateX: pdial3X }, { translateY: pdial3Y }, { scale: pDialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: '#f0dde6' }]} onPress={handleTakePhoto} activeOpacity={0.88}>
            <MaterialCommunityIcons name="camera" size={22} color={Colors.mauve} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Main 3 mini buttons ── */}
        <Animated.View pointerEvents={fabExpanded ? 'auto' : 'none'}
          style={[styles.miniDialBtn, { opacity: dialOpacity, transform: [{ translateX: dial1X }, { translateY: dial1Y }, { scale: dialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: Colors.mauve }]}
            onPress={openPhotoFab} activeOpacity={0.88}>
            <MaterialCommunityIcons name="camera-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View pointerEvents={fabExpanded ? 'auto' : 'none'}
          style={[styles.miniDialBtn, { opacity: dialOpacity, transform: [{ translateX: dial2X }, { translateY: dial2Y }, { scale: dialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: Colors.sun }]}
            onPress={() => { closeFab(); setLinkExpanded(true); setAddModalVisible(true); }} activeOpacity={0.88}>
            <MaterialCommunityIcons name="link-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View pointerEvents={fabExpanded ? 'auto' : 'none'}
          style={[styles.miniDialBtn, { opacity: dialOpacity, transform: [{ translateX: dial3X }, { translateY: dial3Y }, { scale: dialScale }] }]}>
          <TouchableOpacity style={[styles.miniFab, { backgroundColor: Colors.blue }]}
            onPress={() => { closeFab(); router.push('/recipe/add'); }} activeOpacity={0.88}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Main FAB ── */}
        <TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={0.88}>
          {photoDialExpanded
            ? <MaterialCommunityIcons name="arrow-right-circle" size={36} color="#fff" />
            : <>
                <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
                  <MaterialCommunityIcons name="chef-hat" size={30} color="#fff" />
                </Animated.View>
                {!fabExpanded && <Text style={styles.fabPlus}>+</Text>}
              </>
          }
        </TouchableOpacity>
      </View>

      {/* ── LINK INPUT SHEET ── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setAddModalVisible(false); setLinkExpanded(false); }}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1}
            onPress={() => { setAddModalVisible(false); setLinkExpanded(false); }} />
          <View style={styles.addSheet}>
            <View style={styles.sheetHandle} />
            <View style={[styles.subOptions, { paddingVertical: 12 }]}>
              <View style={[styles.linkInputRow, { flexDirection: rowDir }]}>
                <TextInput
                  style={[styles.linkInput, { flex: 1, textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}
                  placeholder={t('linkPlaceholder')}
                  placeholderTextColor={Colors.text3}
                  value={linkInput}
                  onChangeText={setLinkInput}
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleExtractFromLink}
                />
                <TouchableOpacity
                  style={[styles.linkGoBtn, !linkInput.trim() && { opacity: 0.4 }]}
                  onPress={handleExtractFromLink}
                  disabled={!linkInput.trim()}
                >
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── AI SCANNING OVERLAY ── */}
      {scanning && (
        <View style={styles.scanOverlay}>
          <View style={styles.scanBox}>
            {/* Pot + animated steam puffs */}
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Animated.View style={makeSteamStyle(steam1, 14)}>
                <Text style={{ fontSize: 14, color: 'rgba(24,114,125,0.6)' }}>〰</Text>
              </Animated.View>
              <Animated.View style={makeSteamStyle(steam2, 26)}>
                <Text style={{ fontSize: 14, color: 'rgba(24,114,125,0.5)' }}>〰</Text>
              </Animated.View>
              <Animated.View style={makeSteamStyle(steam3, 38)}>
                <Text style={{ fontSize: 14, color: 'rgba(24,114,125,0.4)' }}>〰</Text>
              </Animated.View>
              <Animated.View style={{ transform: [{ rotate: potRotate }, { translateY: potBounce }] }}>
                <MaterialCommunityIcons name="pot-steam" size={72} color={Colors.sun} />
              </Animated.View>
            </View>
            <Text style={[styles.scanTitle, { fontFamily: fontHe }]}>
              {lang === 'he' ? 'המתכון מתבשל...' : 'Cooking up your recipe...'}
            </Text>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: '100%', height: Dimensions.get('window').height * 0.16 },
  langToggle: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.mauve,
  },
  langText: { color: '#3a3a3a', fontSize: 15 },

  toolbar: {
    backgroundColor: Colors.blue, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  toolbarCenter: { alignItems: 'center', gap: 6 },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toolBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  filterDot: {
    position: 'absolute', top: 4, right: 4,
    width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.sun,
  },

  panelRow: {
    backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 9,
    fontSize: 15, color: Colors.text,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.cream,
  },
  filterChipActive: { backgroundColor: Colors.sun, borderColor: Colors.sun },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  filterChipTextActive: { color: '#fff' },
  // Thumbnail
  thumbPlaceholder: {
    width: '100%', borderRadius: Radius.md,
    backgroundColor: Colors.sun, alignItems: 'center', justifyContent: 'center',
  },

  // Grid
  gridContent: { padding: 12, gap: 12, paddingBottom: 120 },
  gridItem: {
    width: (Dimensions.get('window').width - 12 * 2 - 12) / 2,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 10, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm,
    overflow: 'hidden',
  },
  gridTitle: { fontSize: 14, color: Colors.text, marginTop: 8, marginBottom: 4, lineHeight: 19 },
  gridMeta: { fontSize: 11, color: Colors.text3 },

  // List
  listItem: {
    backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.sunLighter,
    alignItems: 'center', gap: 14,
  },
  listThumbWrap: {
    width: 52, height: 52, borderRadius: Radius.md, overflow: 'hidden',
  },
  listTitle: { fontSize: 16, color: Colors.text, marginBottom: 3 },
  listMeta: { fontSize: 12, color: Colors.text3 },
  arrow: { color: Colors.text3, fontSize: 18 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 17, color: Colors.text3, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: Colors.text3 },

  // Speed dial
  dialBackdrop: { backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 90 },
  speedDial: {
    position: 'absolute', bottom: 28, right: 24,
    width: 300, height: 300, zIndex: 100,
  },
  // Mini buttons start at FAB center: (266,266) in 300×300 container
  // bottom: 300-266-27=7, right: 300-266-27=7
  miniDialBtn: { position: 'absolute', bottom: 7, right: 7 },
  // Photo sub-buttons fan from FAB center — same anchor as miniDialBtn (no overlap)
  photoDialBtn: { position: 'absolute', bottom: 7, right: 7 },
  miniFab: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  // FAB sits at bottom-right of the 300×300 container
  fab: {
    position: 'absolute', bottom: 0, right: 0,
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.sun, ...Shadow.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#36312d',
  },
  fabPlus: {
    position: 'absolute', top: 6, right: 10,
    fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22,
  },

  // Add modal sheet
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  addSheet: {
    backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 10,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 8,
  },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  sheetBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sheetCircleRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8,
  },
  sheetCircle: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  sheetCircleActive: { opacity: 0.75 },

  subOptions: { gap: 8, paddingLeft: 8 },
  subBtnCompact: { padding: 8 },
  subIconPink: { width: 54, height: 54, borderRadius: Radius.md, backgroundColor: '#f0dde6', alignItems: 'center', justifyContent: 'center' },

  linkInputRow: { gap: 8, alignItems: 'center' },
  linkInput: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9,
    fontSize: 14, color: Colors.text,
  },
  linkGoBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.mauve, alignItems: 'center', justifyContent: 'center',
  },

  // AI scanning overlay
  scanOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(54,49,45,0.6)', justifyContent: 'center', alignItems: 'center',
    zIndex: 999,
  },
  scanBox: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', margin: 32 },
  scanTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  scanSub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});
