// app/scan/album.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe } from '../../src/context/RecipeContext';
import { useAlbumScanner, ScanCandidate } from '../../src/hooks/useAlbumScanner';
import { TagRow } from '../../src/components/TagBadge';
import { Colors, Radius, Shadow } from '../../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

export default function AlbumScanScreen() {
  const { t, lang, fontHe } = useLang();
  const { addRecipe, recipes } = useRecipes();
  const { status, progress, total, candidates, scanAlbum, cancel, reset } = useAlbumScanner();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>();
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Load albums once (requires permission already granted, or after grant)
  useEffect(() => {
    MediaLibrary.getPermissionsAsync().then(({ status: s }) => {
      if (s === 'granted') loadAlbums();
    });
  }, []);

  const loadAlbums = async () => {
    try {
      const list = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      // Filter to albums that actually have photos
      const withPhotos = list.filter(a => a.assetCount > 0);
      setAlbums(withPhotos);
    } catch {}
  };

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCarouselIndex(viewableItems[0].index ?? 0);
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(candidates.map(c => c.asset.id)));

  const handleStartScan = async () => {
    if (albums.length === 0) await loadAlbums();
    const knownUris = new Set(
      recipes.flatMap(r => [r.sourceUri, r.sourceUrl]).filter(Boolean) as string[]
    );
    scanAlbum(selectedAlbumId, knownUris);
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const toAdd = candidates.filter(c => selected.has(c.asset.id) && c.extracted);
    for (const c of toAdd) {
      const ex = c.extracted!;
      const recipe: Recipe = {
        id: Date.now().toString() + Math.random(),
        title: ex.titleHe ?? 'מתכון חדש',
        titleHe: ex.titleHe,
        titleEn: ex.titleEn,
        ingredients: ex.ingredientsHe ?? [],
        ingredientsHe: ex.ingredientsHe,
        ingredientsEn: ex.ingredientsEn,
        steps: ex.stepsHe ?? [],
        stepsHe: ex.stepsHe,
        stepsEn: ex.stepsEn,
        tags: ex.tags ?? {},
        category: ex.category ?? 'other',
        emoji: ex.emoji ?? '🍽',
        sourceType: 'screenshot',
        sourceUri: c.asset.uri,
        createdAt: c.asset.creationTime ?? Date.now(),
      };
      await addRecipe(recipe);
    }
    setSaving(false);
    Alert.alert(
      t('recipeAdded'),
      `${toAdd.length} ${lang === 'he' ? 'מתכונים נוספו לספר שלך' : 'recipes added to your book'}`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // ── IDLE ─────────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.topTitle, { fontFamily: fontHe }]}>{t('scanAlbum')}</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.idleScroll} showsVerticalScrollIndicator={false}>
          {/* Scanner icon */}
          <View style={styles.scanIconWrap}>
            <MaterialCommunityIcons name="barcode-scan" size={72} color={Colors.mauve} />
          </View>
          <Text style={[styles.idleTitle, { fontFamily: fontHe }]}>{t('scanAlbum')}</Text>
          <Text style={[styles.idleSub, { fontFamily: fontHe }]}>{t('scanAlbumDesc')}</Text>

          {/* Album picker */}
          {albums.length > 0 && (
            <View style={styles.albumSection}>
              <Text style={[styles.albumLabel, { fontFamily: fontHe }]}>
                {lang === 'he' ? 'סרוק אלבום ספציפי (אופציונלי)' : 'Scan specific album (optional)'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumChips}>
                <TouchableOpacity
                  style={[styles.albumChip, !selectedAlbumId && styles.albumChipActive]}
                  onPress={() => setSelectedAlbumId(undefined)}
                >
                  <Text style={[styles.albumChipText, !selectedAlbumId && styles.albumChipTextActive, { fontFamily: fontHe }]}>
                    {lang === 'he' ? 'כל התמונות' : 'All Photos'}
                  </Text>
                </TouchableOpacity>
                {albums.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.albumChip, selectedAlbumId === a.id && styles.albumChipActive]}
                    onPress={() => setSelectedAlbumId(a.id)}
                  >
                    <Text style={[styles.albumChipText, selectedAlbumId === a.id && styles.albumChipTextActive, { fontFamily: fontHe }]} numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text style={[styles.albumChipCount, selectedAlbumId === a.id && { color: 'rgba(255,255,255,0.7)' }]}>
                      {a.assetCount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartScan}>
            <MaterialCommunityIcons name="magnify-scan" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[styles.primaryBtnText, { fontFamily: fontHe }]}>{t('startScan')}</Text>
          </TouchableOpacity>

          <Text style={[styles.idleNote, { fontFamily: fontHe }]}>
            {lang === 'he'
              ? '2Spoons יסרוק עד 200 תמונות. כל מתכון שיזוהה יוצג לאישורך לפני שמירה.'
              : '2Spoons will scan up to 200 photos. Every detected recipe will be shown for your approval before saving.'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCANNING ─────────────────────────────────────────────────────────────────
  if (status === 'scanning' || status === 'requesting') {
    const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={[styles.topTitle, { fontFamily: fontHe }]}>{t('scanning')}</Text>
        </View>
        <View style={styles.center}>
          <MaterialCommunityIcons name="barcode-scan" size={64} color={Colors.mauve} style={{ marginBottom: 16 }} />
          <Text style={[styles.idleTitle, { fontFamily: fontHe }]}>{t('scanningAlbum')}</Text>
          <Text style={[styles.idleSub, { fontFamily: fontHe }]}>
            {progress} / {total} {lang === 'he' ? 'תמונות' : 'photos'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>
          {candidates.length > 0 && (
            <View style={styles.foundBadge}>
              <Text style={[styles.foundText, { fontFamily: fontHe }]}>
                {candidates.length} {lang === 'he' ? 'מתכונים זוהו עד כה' : 'recipes found so far'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
            <Text style={[styles.cancelBtnText, { fontFamily: fontHe }]}>
              {lang === 'he' ? 'בטל סריקה' : 'Cancel scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── DONE / CAROUSEL ──────────────────────────────────────────────────────────
  if (status === 'done') {
    if (candidates.length === 0) {
      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.topTitle, { fontFamily: fontHe }]}>{t('scanAlbum')}</Text>
            <View style={{ width: 34 }} />
          </View>
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🤷</Text>
            <Text style={[styles.idleTitle, { fontFamily: fontHe }]}>{t('noRecipesFound')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
              <Text style={[styles.primaryBtnText, { fontFamily: fontHe }]}>{lang === 'he' ? 'נסה שוב' : 'Try again'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.topTitle, { fontFamily: fontHe, writingDirection: 'ltr' }]}>
            {carouselIndex + 1} / {candidates.length}
          </Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={[styles.selectAll, { fontFamily: fontHe }]}>{lang === 'he' ? 'בחר הכל' : 'All'}</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <FlatList
          data={candidates}
          keyExtractor={c => c.asset.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          renderItem={({ item: c }) => {
            const isSelected = selected.has(c.asset.id);
            const ex = c.extracted;
            const title = ex
              ? (lang === 'he' ? ex.titleHe : ex.titleEn) ?? ex.title ?? '—'
              : '—';

            return (
              <View style={styles.slide}>
                <Image source={{ uri: c.asset.uri }} style={styles.slideImage} resizeMode="cover" />

                {/* Bottom info overlay */}
                <View style={styles.slideOverlay}>
                  <Text style={[styles.slideTitle, { fontFamily: fontHe }]} numberOfLines={2}>{title}</Text>
                  {ex?.tags && <TagRow tags={ex.tags} compact />}
                  {ex?.ingredientsHe && (
                    <Text style={[styles.slideIngredients, { fontFamily: fontHe }]} numberOfLines={1}>
                      {(lang === 'he' ? ex.ingredientsHe : ex.ingredientsEn ?? []).slice(0, 3).join(' · ')}
                    </Text>
                  )}
                </View>

                {/* Check button */}
                <TouchableOpacity
                  style={[styles.slideCheck, isSelected && styles.slideCheckActive]}
                  onPress={() => toggleSelect(c.asset.id)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'check' : 'plus'}
                    size={30}
                    color={isSelected ? '#fff' : Colors.mauve}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {candidates.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === carouselIndex && styles.dotActive,
                selected.has(candidates[i].asset.id) && styles.dotSelected,
              ]}
            />
          ))}
        </View>

        {/* Bottom action bar */}
        <View style={styles.actionBar}>
          <Text style={[styles.actionCount, { fontFamily: fontHe }]}>
            {selected.size > 0
              ? `${selected.size} ${lang === 'he' ? 'נבחרו' : 'selected'}`
              : lang === 'he' ? 'בחר מתכונים' : 'Select recipes'}
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, selected.size === 0 && { opacity: 0.4 }]}
            onPress={handleAddSelected}
            disabled={saving || selected.size === 0}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.addBtnText, { fontFamily: fontHe }]}>{t('addSelected')} →</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>⚠️</Text>
        <Text style={styles.idleTitle}>{lang === 'he' ? 'שגיאה בסריקה' : 'Scan error'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
          <Text style={styles.primaryBtnText}>{lang === 'he' ? 'נסה שוב' : 'Try again'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.mauve, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  selectAll: { color: '#fff', fontSize: 14, fontWeight: '600' },

  idleScroll: { alignItems: 'center', padding: 32, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scanIconWrap: {
    width: 120, height: 120, borderRadius: 30,
    backgroundColor: '#f0dde6', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  idleTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  idleSub: { fontSize: 15, color: Colors.text2, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  idleNote: { fontSize: 12, color: Colors.text3, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  albumSection: { width: '100%', marginBottom: 24 },
  albumLabel: { fontSize: 13, color: Colors.text2, marginBottom: 10, textAlign: 'center' },
  albumChips: { gap: 8, paddingHorizontal: 4 },
  albumChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.card,
  },
  albumChipActive: { backgroundColor: Colors.mauve, borderColor: Colors.mauve },
  albumChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  albumChipTextActive: { color: '#fff' },
  albumChipCount: { fontSize: 11, color: Colors.text3 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.sun, borderRadius: Radius.pill, paddingHorizontal: 32, paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  progressTrack: { width: '100%', height: 8, backgroundColor: Colors.sunLighter, borderRadius: 4, marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.sun, borderRadius: 4 },
  pct: { marginTop: 8, fontSize: 14, color: Colors.sun, fontWeight: '700' },
  foundBadge: { marginTop: 20, backgroundColor: Colors.sunLighter, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  foundText: { color: Colors.sunDark, fontWeight: '600', fontSize: 14 },
  cancelBtn: { marginTop: 28, borderWidth: 1.5, borderColor: 'rgba(155,74,106,0.4)', borderRadius: Radius.pill, paddingHorizontal: 28, paddingVertical: 10 },
  cancelBtnText: { color: Colors.mauve, fontSize: 14, fontWeight: '600' },

  // Carousel
  slide: { width: SW, flex: 1 },
  slideImage: { width: SW, flex: 1 },
  slideOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 20, paddingVertical: 16, gap: 6,
  },
  slideTitle: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24 },
  slideIngredients: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  slideCheck: {
    position: 'absolute', top: 16, right: 16,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  slideCheckActive: { backgroundColor: Colors.sun },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.mauve, width: 14 },
  dotSelected: { backgroundColor: Colors.sun },

  actionBar: {
    backgroundColor: '#fff', borderTopWidth: 1.5, borderTopColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    ...Shadow.md,
  },
  actionCount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  addBtn: { backgroundColor: Colors.sun, borderRadius: Radius.pill, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
