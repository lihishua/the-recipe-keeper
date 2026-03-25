// app/recipe/[id].tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Linking, Alert, Modal, Dimensions,
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
  const { t, lang, isRTL, fontRecipe, fontHe, fontApp } = useLang();
  const styles = useMemo(() => makeStyles(fontRecipe, fontApp), [fontRecipe, fontApp]);
  const { getRecipeById, deleteRecipe } = useRecipes();
  const recipe = getRecipeById(id);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);

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
  const cookBakeTotal = (recipe.tags.cookTime ?? 0) + (recipe.tags.bakeTime ?? 0);
  const timeItems: { labelKey: string; value: number; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
    recipe.tags.prepTime ? { labelKey: 'prepTime', value: recipe.tags.prepTime, icon: 'clock-outline' }      : null,
    cookBakeTotal > 0    ? { labelKey: 'cookBake', value: cookBakeTotal,         icon: 'pot-steam-outline' }  : null,
    recipe.tags.riseTime ? { labelKey: 'riseTime', value: recipe.tags.riseTime, icon: 'timer-sand' }         : null,
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
              <TouchableOpacity onPress={() => setImageModalVisible(true)} activeOpacity={0.85}>
                <Image source={{ uri: recipe.sourceUri }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
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
                  {item.value}{t('min')}
                </Text>
              </View>
            ))}

          </View>

          {/* ── TAGS ── */}
          <View style={[styles.tagRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 14 }]}>
            {recipe.category && recipe.category !== 'other' && (
              <View style={[styles.tagChip, { backgroundColor: 'rgba(24,114,125,0.15)', borderColor: 'rgba(24,114,125,0.4)' }]}>
                <Text style={[styles.tagChipText, { color: BG_DARK, fontWeight: '700' }]}>{t(recipe.category as any)}</Text>
              </View>
            )}
            {recipe.tags.vegan && (
              <View style={styles.tagChip}>
                <MaterialCommunityIcons name="sprout" size={13} color={BG_DARK} />
                <Text style={styles.tagChipText}>{t('vegan')}</Text>
              </View>
            )}
            {!recipe.tags.vegan && recipe.tags.vegetarian && (
              <View style={styles.tagChip}>
                <MaterialCommunityIcons name="food-apple-outline" size={13} color={BG_DARK} />
                <Text style={styles.tagChipText}>{t('vegetarian')}</Text>
              </View>
            )}
            {recipe.tags.glutenFree && (
              <View style={styles.tagChip}>
                <MaterialCommunityIcons name="barley-off" size={13} color={BG_DARK} />
                <Text style={styles.tagChipText}>{t('glutenFree')}</Text>
              </View>
            )}
            {recipe.tags.dairyFree && (
              <View style={styles.tagChip}>
                <MaterialCommunityIcons name="water-off" size={13} color={BG_DARK} />
                <Text style={styles.tagChipText}>{t('dairyFree')}</Text>
              </View>
            )}
            {((lang === 'he' ? recipe.customTagsHe : recipe.customTagsEn) ?? recipe.customTags)?.map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
            {/* Nutrition tag — only shown when calculated */}
            {recipe.nutrition && (
              <TouchableOpacity style={styles.nutritionChip} onPress={() => setNutritionModalVisible(true)}>
                <MaterialCommunityIcons name="fire" size={13} color="#fff" />
                <Text style={styles.nutritionChipText}>
                  {recipe.nutrition.calories} {lang === 'he' ? 'קלוריות/100ג' : 'cal/100g'}
                </Text>
              </TouchableOpacity>
            )}
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
                  <MaterialCommunityIcons name="heart-outline" size={16} color={BG_DARK} />
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

      {/* ── NUTRITION MODAL ── */}
      {recipe.nutrition && (
        <Modal visible={nutritionModalVisible} transparent animationType="fade" onRequestClose={() => setNutritionModalVisible(false)}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setNutritionModalVisible(false)}>
            <View style={styles.nutritionCard}>
              <Text style={[styles.nutritionTitle, { fontFamily: fontRecipe }]}>
                {lang === 'he' ? 'ערכים תזונתיים ל-100 גרם' : 'Nutrition per 100g'}
              </Text>
              {[
                { label: lang === 'he' ? 'קלוריות' : 'Calories', value: `${recipe.nutrition.calories} kcal` },
                { label: lang === 'he' ? 'חלבון' : 'Protein', value: `${recipe.nutrition.protein}g` },
                { label: lang === 'he' ? 'שומן' : 'Fat', value: `${recipe.nutrition.fat}g` },
                { label: lang === 'he' ? 'פחמימות' : 'Carbs', value: `${recipe.nutrition.carbs}g` },
                recipe.nutrition.fiber != null ? { label: lang === 'he' ? 'סיבים' : 'Fiber', value: `${recipe.nutrition.fiber}g` } : null,
                recipe.nutrition.sugar != null ? { label: lang === 'he' ? 'סוכר' : 'Sugar', value: `${recipe.nutrition.sugar}g` } : null,
              ].filter(Boolean).map((row: any) => (
                <View key={row.label} style={[styles.nutritionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.nutritionLabel, { fontFamily: fontRecipe, textAlign: isRTL ? 'right' : 'left' }]}>{row.label}</Text>
                  <Text style={[styles.nutritionValue, { fontFamily: fontRecipe }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── IMAGE VIEWER MODAL ── */}
      {recipe.sourceUri && (
        <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
          <View style={styles.modalBg}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setImageModalVisible(false)}>
              <MaterialCommunityIcons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: recipe.sourceUri }}
                style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.85 }}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function makeStyles(fontRecipe: string, fontApp: string) {
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
    iconBtnText: { color: '#fff', fontSize: 22, fontFamily: fontApp, lineHeight: 26 },
    editBtn: {
      backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.pill,
      paddingHorizontal: 16, paddingVertical: 7,
    },
    editBtnText: { color: '#fff', fontFamily: fontApp, fontSize: 16 },

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
    infoRow: { flexWrap: 'wrap', gap: 12, alignSelf: 'stretch' },
    diffBadge: { alignItems: 'center', gap: 5 },
    diffText: { fontSize: 13, fontWeight: '700', color: INK },
    timeBadge: { alignItems: 'center', gap: 5 },
    timeBadgeTotal: {},
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
    ingText:  { fontFamily: fontRecipe, fontSize: 13, color: INK, lineHeight: 18 },

    // Steps
    stepRow:   { paddingVertical: 8, alignItems: 'flex-start', gap: 10 },
    stepBullet: { fontFamily: fontRecipe, fontSize: 20, color: BG_DARK, lineHeight: 24, flexShrink: 0 },
    stepText:   { fontFamily: fontRecipe, fontSize: 15, color: INK, lineHeight: 22 },

    // Tags
    tagRow: { flexWrap: 'wrap', gap: 8 },
    tagChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.pill,
      paddingHorizontal: 11, paddingVertical: 6,
      borderWidth: 1, borderColor: 'rgba(24,114,125,0.25)',
    },
    tagChipText: { fontFamily: fontRecipe, fontSize: 12, color: INK },

    // Nutrition chip
    nutritionChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: Colors.mauve, borderRadius: Radius.pill,
      paddingHorizontal: 11, paddingVertical: 6,
    },
    nutritionChipText: { fontFamily: fontRecipe, fontSize: 12, color: '#fff' },

    // Nutrition modal card
    nutritionCard: {
      backgroundColor: '#fff', borderRadius: Radius.lg,
      paddingVertical: 24, paddingHorizontal: 28,
      marginHorizontal: 32, width: '80%',
    },
    nutritionTitle: {
      fontSize: 16, fontWeight: '700', color: INK,
      textAlign: 'center', marginBottom: 16,
    },
    nutritionRow: {
      justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    nutritionLabel: { fontSize: 14, color: INK },
    nutritionValue: { fontSize: 14, fontWeight: '700', color: Colors.mauve },

    // Links
    linkCard: {
      backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radius.lg,
      padding: 14, alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: 'rgba(24,114,125,0.2)',
    },
    linkText: { fontFamily: fontRecipe, fontSize: 14, color: INK },

    modalBg: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center', alignItems: 'center',
    },
    modalClose: {
      position: 'absolute', top: 52, right: 20, zIndex: 10,
    },

    // Delete
    deleteBtn: {
      borderWidth: 1.5, borderColor: 'rgba(211,47,47,0.4)',
      borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 9,
      alignItems: 'center',
    },
    deleteBtnText: { fontFamily: fontRecipe, color: Colors.red, fontSize: 14 },
  });
}
