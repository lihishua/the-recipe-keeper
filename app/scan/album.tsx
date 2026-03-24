// app/scan/album.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes, Recipe } from '../../src/context/RecipeContext';
import { useAlbumScanner, ScanCandidate } from '../../src/hooks/useAlbumScanner';
import { TagRow } from '../../src/components/TagBadge';
import { Colors, Radius, Shadow } from '../../src/theme';

export default function AlbumScanScreen() {
  const { t, lang } = useLang();
  const { addRecipe } = useRecipes();
  const { status, progress, total, candidates, scanAlbum, reset } = useAlbumScanner();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(candidates.map(c => c.asset.id)));
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
      '🎉 ' + t('recipeAdded'),
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
          <Text style={styles.topTitle}>{t('scanAlbum')}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>📚</Text>
          <Text style={styles.idleTitle}>{t('scanAlbum')}</Text>
          <Text style={styles.idleSub}>{t('scanAlbumDesc')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={scanAlbum}>
            <Text style={styles.primaryBtnText}>{t('startScan')}</Text>
          </TouchableOpacity>
          <Text style={styles.idleNote}>
            {lang === 'he'
              ? 'ניבל יסרוק עד 200 תמונות אחרונות. כל מתכון שיזוהה יוצג לאישורך לפני שמירה.'
              : 'Nibble will scan your 200 most recent photos. Every detected recipe will be shown for your approval before saving.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCANNING ─────────────────────────────────────────────────────────────────
  if (status === 'scanning') {
    const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{t('scanning')}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🤖</Text>
          <Text style={styles.idleTitle}>{t('scanningAlbum')}</Text>
          <Text style={styles.idleSub}>
            {progress} / {total} {lang === 'he' ? 'תמונות' : 'photos'}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>

          {candidates.length > 0 && (
            <View style={styles.foundBadge}>
              <Text style={styles.foundText}>
                🍽 {candidates.length} {lang === 'he' ? 'מתכונים זוהו עד כה' : 'recipes found so far'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────────
  if (status === 'done') {
    if (candidates.length === 0) {
      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.topTitle}>{t('scanAlbum')}</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🤷</Text>
            <Text style={styles.idleTitle}>{t('noRecipesFound')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
              <Text style={styles.primaryBtnText}>{lang === 'he' ? 'נסה שוב' : 'Try again'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>
            🎉 {candidates.length} {lang === 'he' ? 'מתכונים נמצאו' : 'recipes found'}
          </Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.selectAll}>{lang === 'he' ? 'בחר הכל' : 'All'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={candidates}
          keyExtractor={c => c.asset.id}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}
          renderItem={({ item: c }) => {
            const isSelected = selected.has(c.asset.id);
            const ex = c.extracted;
            const title = ex
              ? (lang === 'he' ? ex.titleHe : ex.titleEn) ?? ex.title ?? '—'
              : '—';

            return (
              <TouchableOpacity
                style={[styles.candidateCard, isSelected && styles.candidateCardSelected, Shadow.sm]}
                onPress={() => toggleSelect(c.asset.id)}
                activeOpacity={0.85}
              >
                {/* Check */}
                <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>

                {/* Thumbnail */}
                <Image source={{ uri: c.asset.uri }} style={styles.thumb} resizeMode="cover" />

                {/* Info */}
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateTitle} numberOfLines={2}>{title}</Text>
                  {ex?.tags && <TagRow tags={ex.tags} compact />}
                  {ex?.ingredientsHe && (
                    <Text style={styles.ingPreview} numberOfLines={2}>
                      {(lang === 'he' ? ex.ingredientsHe : ex.ingredientsEn ?? []).slice(0, 3).join(' · ')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Bottom action bar */}
        {selected.size > 0 && (
          <View style={styles.actionBar}>
            <Text style={styles.actionCount}>
              {selected.size} {lang === 'he' ? 'נבחרו' : 'selected'}
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddSelected}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.addBtnText}>{t('addSelected')} →</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>⚠️</Text>
        <Text style={styles.idleTitle}>שגיאה בסריקה</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
          <Text style={styles.primaryBtnText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.sun, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  selectAll: { color: '#fff', fontSize: 14, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  idleTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'center' },
  idleSub: { fontSize: 15, color: Colors.text2, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  idleNote: { fontSize: 12, color: Colors.text3, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  primaryBtn: { backgroundColor: Colors.sun, borderRadius: Radius.pill, paddingHorizontal: 32, paddingVertical: 14 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressTrack: { width: '100%', height: 8, backgroundColor: Colors.sunLighter, borderRadius: 4, marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.sun, borderRadius: 4 },
  pct: { marginTop: 8, fontSize: 14, color: Colors.sun, fontWeight: '700' },
  foundBadge: { marginTop: 20, backgroundColor: Colors.sunLighter, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  foundText: { color: Colors.sunDark, fontWeight: '600', fontSize: 14 },
  candidateCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden', gap: 0,
  },
  candidateCardSelected: { borderColor: Colors.sun },
  checkCircle: {
    position: 'absolute', top: 10, right: 10, zIndex: 10,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: Colors.sun, borderColor: Colors.sun },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  thumb: { width: 100, height: 120 },
  candidateInfo: { flex: 1, padding: 12, gap: 6 },
  candidateTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  ingPreview: { fontSize: 11, color: Colors.text3, marginTop: 4 },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1.5, borderTopColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 30,
    ...Shadow.md,
  },
  actionCount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  addBtn: { backgroundColor: Colors.sun, borderRadius: Radius.pill, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
