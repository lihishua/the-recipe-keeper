// app/recipe/[id].tsx
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes } from '../../src/context/RecipeContext';
import { Colors, Radius } from '../../src/theme';

const BG      = '#d0eaec';
const BG_DARK = '#18727d';
const INK     = '#36312d';



export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, isRTL, fontRecipe, fontHe } = useLang();
  const styles = useMemo(() => makeStyles(fontRecipe), [fontRecipe]);
  const { getRecipeById, deleteRecipe } = useRecipes();
  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <Text style={{ fontFamily: fontRecipe, fontSize: 20, color: INK }}>Recipe not found</Text>
      </View>
    );
  }

  const title       = (lang === 'he' ? recipe.titleHe : recipe.titleEn) ?? recipe.title;
  const heIngredients = recipe.ingredientsHe ?? recipe.ingredients ?? [];
  const enIngredients = recipe.ingredientsEn ?? [];
  const ingredients = lang === 'he' ? heIngredients : (enIngredients.length > 0 ? enIngredients : heIngredients);
  const steps       = (lang === 'he' ? recipe.stepsHe : recipe.stepsEn) ?? recipe.steps ?? [];
  const rowDir      = isRTL ? 'row-reverse' : 'row';

  // Time items to show in the breakdown
  const timeItems: { labelKey: string; value: number; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
    recipe.tags.prepTime  ? { labelKey: 'prepTime',  value: recipe.tags.prepTime,  icon: 'clock-outline' }     : null,
    recipe.tags.cookTime  ? { labelKey: 'cookTime',  value: recipe.tags.cookTime,  icon: 'pot-steam-outline' } : null,
    recipe.tags.bakeTime  ? { labelKey: 'bakeTime',  value: recipe.tags.bakeTime,  icon: 'oven' }              : null,
    recipe.tags.riseTime  ? { labelKey: 'riseTime',  value: recipe.tags.riseTime,  icon: 'timer-sand' }        : null,
  ].filter(Boolean) as any[];

  const handleDelete = () => {
    Alert.alert(t('deleteConfirm'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: async () => {
          await deleteRecipe(recipe.id);
          router.back();
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TOP BAR */}
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/recipe/edit/${recipe.id}`)}>
          <Text style={styles.editBtnText}>{t('edit')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── HEADER ── */}
        <View style={styles.header}>

          {/* Image + Title side-by-side */}
          <View style={[styles.titleRow, { flexDirection: rowDir }]}>
            {recipe.sourceUri && !recipe.sourceUri.startsWith('ph://') ? (
              <Image source={{ uri: recipe.sourceUri }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <MaterialCommunityIcons
                  name={recipe.category === 'desserts' ? 'cake-variant-outline'
                      : recipe.category === 'salads'   ? 'leaf'
                      : recipe.category === 'breakfast' ? 'egg-outline'
                      : recipe.category === 'asian'    ? 'bowl-mix-outline'
                      : recipe.category === 'italian'  ? 'noodles'
                      : 'silverware-fork-knife'}
                  size={36} color="rgba(24,114,125,0.45)"
                />
              </View>
            )}
            <Text style={[styles.title, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          </View>

          {/* ── Info row: difficulty + times ── */}
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>

            {/* Difficulty badge */}
            {recipe.tags.difficulty && (
              <View style={[styles.diffBadge, { flexDirection: rowDir }]}>
                <MaterialCommunityIcons name="chef-hat" size={16} color={INK} />
                <Text style={[styles.diffText, { fontFamily: fontHe }]}>
                  {t(recipe.tags.difficulty as any)}
                </Text>
              </View>
            )}

            {/* Time chips */}
            {timeItems.map(item => (
              <View key={item.labelKey} style={[styles.timeBadge, { flexDirection: rowDir }]}>
                <MaterialCommunityIcons name={item.icon} size={14} color={BG_DARK} />
                <Text style={[styles.timeText, { fontFamily: fontHe }]}>
                  {t(item.labelKey as any)} {item.value}{t('minutes')}
                </Text>
              </View>
            ))}

          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── INGREDIENTS ── */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'מרכיבים' : 'Ingredients'}</Text>
            <View style={styles.sectionLine} />
            <View style={styles.ingGrid}>
              {ingredients.map((ing, i) => (
                <View key={i} style={[styles.ingItem, { flexDirection: rowDir }]}>
                  <Text style={styles.ingHeart}>♥</Text>
                  <Text style={[styles.ingText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── STEPS ── */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'אופן הכנה' : 'Instructions'}</Text>
            <View style={styles.sectionLine} />
            {steps.map((step, i) => (
              <View key={i} style={[styles.stepRow, { flexDirection: rowDir }]}>
                <Text style={styles.stepBullet}>•</Text>
                <Text style={[styles.stepText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── SOURCE LINK ── */}
        {recipe.sourceUrl && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.linkCard, { flexDirection: rowDir }]}
              onPress={() => Linking.openURL(recipe.sourceUrl!)}
            >
              <MaterialCommunityIcons name="link-variant" size={22} color={BG_DARK} />
              <Text style={[styles.linkText, { flex: 1, textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}
                numberOfLines={1}
              >
                {t('sourceLink')}: {recipe.sourceUrl}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.text3} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── VIDEO LINK ── */}
        {recipe.sourceType === 'video' && recipe.videoUrl && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.linkCard, { flexDirection: rowDir }]}
              onPress={() => Linking.openURL(recipe.videoUrl!)}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={26} color={INK} />
              <Text style={[styles.linkText, { flex: 1, textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                {recipe.videoPlatform ?? 'Video'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── DELETE ── */}
        <View style={[styles.section, { alignItems: 'center' }]}>
          <TouchableOpacity style={[styles.deleteBtn, { flexDirection: 'row', gap: 6 }]} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={15} color={Colors.red} />
            <Text style={styles.deleteBtnText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(fontRecipe: string) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },

    topBar: {
      backgroundColor: BG_DARK, alignItems: 'center',
      justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
    },
    iconBtn: {
      backgroundColor: 'rgba(255,255,255,0.3)', width: 36, height: 36,
      borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    iconBtnText: { color: '#fff', fontSize: 22, fontFamily: fontRecipe, lineHeight: 26 },
    editBtn: {
      backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.pill,
      paddingHorizontal: 16, paddingVertical: 7,
    },
    editBtnText: { color: '#fff', fontFamily: fontRecipe, fontSize: 16 },

    // Header
    header: { padding: 20, paddingBottom: 24 },
    titleRow: {
      alignItems: 'center', gap: 14, marginBottom: 14,
    },
    thumbImage: {
      width: 90, height: 90, borderRadius: Radius.lg,
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
    },
    thumbPlaceholder: {
      width: 90, height: 90, borderRadius: Radius.lg,
      backgroundColor: 'rgba(255,255,255,0.5)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    },
    title: {
      fontFamily: fontRecipe, fontSize: 26, color: INK,
      lineHeight: 34,
    },

    // Info row (difficulty + times)
    infoRow: { flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
    diffBadge: {
      alignItems: 'center', gap: 5, borderRadius: Radius.pill,
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderWidth: 1, borderColor: 'rgba(54,49,45,0.2)',
    },
    diffText: { fontSize: 13, fontWeight: '700', color: INK },
    timeBadge: {
      alignItems: 'center', gap: 5, borderRadius: Radius.pill,
      paddingHorizontal: 11, paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderWidth: 1, borderColor: 'rgba(24,114,125,0.25)',
    },
    timeBadgeTotal: {
      backgroundColor: 'rgba(24,114,125,0.12)',
      borderColor: 'rgba(24,114,125,0.4)',
    },
    timeText: { fontSize: 12, color: INK },

    // Dividers
    divider: { height: 2, backgroundColor: INK, marginHorizontal: 0 },

    // Sections
    section: { paddingHorizontal: 20, paddingVertical: 20 },
    sectionHeader: {
      fontFamily: fontRecipe, fontSize: 26, color: INK,
      textAlign: 'center', marginBottom: 6,
    },
    sectionLine: {
      height: 1, backgroundColor: INK, opacity: 0.3,
      marginBottom: 16, marginHorizontal: 20,
    },

    // Ingredients (two-column grid)
    ingGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
    },
    ingItem: {
      width: '50%', paddingVertical: 8, paddingHorizontal: 4,
      alignItems: 'center', gap: 6,
      borderBottomWidth: 1, borderBottomColor: 'rgba(54,49,45,0.15)',
    },
    ingHeart: { fontFamily: fontRecipe, fontSize: 14, color: BG_DARK, flexShrink: 0 },
    ingText:  { fontFamily: fontRecipe, fontSize: 13, color: INK, lineHeight: 18 },

    // Steps
    stepRow:   { paddingVertical: 8, alignItems: 'flex-start', gap: 10 },
    stepBullet: { fontFamily: fontRecipe, fontSize: 20, color: BG_DARK, lineHeight: 24, flexShrink: 0 },
    stepText:   { fontFamily: fontRecipe, fontSize: 15, color: INK, lineHeight: 22 },

    // Links
    linkCard: {
      backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.lg,
      padding: 14, alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: 'rgba(24,114,125,0.2)',
    },
    linkText: { fontFamily: fontRecipe, fontSize: 14, color: INK },

    // Delete
    deleteBtn: {
      borderWidth: 1.5, borderColor: 'rgba(211,47,47,0.4)',
      borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 9,
      alignItems: 'center',
    },
    deleteBtnText: { fontFamily: fontRecipe, color: Colors.red, fontSize: 14 },
  });
}
