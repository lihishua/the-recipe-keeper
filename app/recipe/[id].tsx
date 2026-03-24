// app/recipe/[id].tsx
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes } from '../../src/context/RecipeContext';
import { Colors, Fonts, Radius } from '../../src/theme';

const BG = '#d0eaec';         // light teal background
const BG_DARK = '#18727d';    // teal topbar
const INK = '#36312d';        // dark brown text

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, isRTL } = useLang();
  const { getRecipeById, deleteRecipe } = useRecipes();
  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <Text style={{ fontFamily: Fonts.dybbuk, fontSize: 20, color: INK }}>Recipe not found</Text>
      </View>
    );
  }

  const title = (lang === 'he' ? recipe.titleHe : recipe.titleEn) ?? recipe.title;
  const heIngredients = recipe.ingredientsHe ?? recipe.ingredients ?? [];
  const enIngredients = recipe.ingredientsEn ?? [];
  const ingredients = lang === 'he' ? heIngredients : (enIngredients.length > 0 ? enIngredients : heIngredients);
  const steps = (lang === 'he' ? recipe.stepsHe : recipe.stepsEn) ?? recipe.steps ?? [];
  const rowDir = isRTL ? 'row-reverse' : 'row';

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

        {/* ── HEADER: title + image + time ── */}
        <View style={styles.header}>
          <View style={[styles.headerRow, { flexDirection: rowDir }]}>

            {/* Left side (in RTL: right side): image */}
            {recipe.sourceUri && !recipe.sourceUri.startsWith('ph://') ? (
              <Image source={{ uri: recipe.sourceUri }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroEmoji}>
                <Text style={{ fontSize: 56 }}>{recipe.emoji}</Text>
              </View>
            )}

            {/* Right side (in RTL: left side): title + time */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>

              {/* Time info */}
              <View style={[styles.timeRow, { flexDirection: rowDir }]}>
                {recipe.tags?.prepTime ? (
                  <View style={styles.timeItem}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={INK} />
                    <Text style={[styles.timeText, { textAlign: 'center' }]}>
                      {lang === 'he' ? 'הכנה' : 'Prep'}{'\n'}{recipe.tags.prepTime}{t('minutes')}
                    </Text>
                  </View>
                ) : null}
                {recipe.tags?.cookTime ? (
                  <View style={styles.timeItem}>
                    <MaterialCommunityIcons name="pot-steam-outline" size={18} color={INK} />
                    <Text style={[styles.timeText, { textAlign: 'center' }]}>
                      {lang === 'he' ? 'בישול' : 'Cook'}{'\n'}{recipe.tags.cookTime}{t('minutes')}
                    </Text>
                  </View>
                ) : null}
                {recipe.tags?.totalTime ? (
                  <View style={styles.timeItem}>
                    <MaterialCommunityIcons name="timer-sand" size={18} color={INK} />
                    <Text style={[styles.timeText, { textAlign: 'center' }]}>
                      {lang === 'he' ? 'סה"כ' : 'Total'}{'\n'}{recipe.tags.totalTime}{t('minutes')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── INGREDIENTS ── */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'מרכיבים' : 'Ingredients'}</Text>
            <View style={styles.sectionLine} />

            {ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingRow, { flexDirection: rowDir }]}>
                <Text style={styles.ingHeart}>♡</Text>
                <Text style={[styles.ingText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{ing}</Text>
              </View>
            ))}
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

        {/* VIDEO LINK */}
        {recipe.sourceType === 'video' && recipe.videoUrl && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.videoCard, { flexDirection: rowDir }]}
              onPress={() => Linking.openURL(recipe.videoUrl!)}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={28} color={INK} />
              <Text style={[styles.videoText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {recipe.videoPlatform ?? 'Video'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DELETE */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.deleteBtn, { flexDirection: 'row', gap: 8 }]} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.red} />
            <Text style={styles.deleteBtnText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar: {
    backgroundColor: BG_DARK, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: '#fff', fontSize: 22, fontFamily: Fonts.dybbuk, lineHeight: 26 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.pill,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  editBtnText: { color: '#fff', fontFamily: Fonts.dybbuk, fontSize: 16 },

  // Header
  header: { padding: 20, paddingBottom: 24 },
  headerRow: { alignItems: 'flex-start', gap: 16 },
  heroImage: {
    width: 130, height: 130, borderRadius: Radius.lg,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', flexShrink: 0,
  },
  heroEmoji: {
    width: 120, height: 120, borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontFamily: Fonts.dybbuk,
    fontSize: 34,
    color: INK,
    lineHeight: 40,
    marginBottom: 14,
  },

  // Time
  timeRow: { flexWrap: 'wrap', gap: 10 },
  timeItem: { alignItems: 'center', gap: 2 },
  timeText: { fontFamily: Fonts.dybbuk, fontSize: 12, color: INK, lineHeight: 16 },

  // Dividers
  divider: { height: 2, backgroundColor: INK, marginHorizontal: 0 },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionHeader: {
    fontFamily: Fonts.dybbuk,
    fontSize: 28,
    color: INK,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionLine: {
    height: 1, backgroundColor: INK,
    opacity: 0.3, marginBottom: 16, marginHorizontal: 20,
  },

  // Ingredients
  ingRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(54,49,45,0.2)',
    paddingVertical: 10,
    alignItems: 'center', gap: 10,
  },
  ingHeart: { fontFamily: Fonts.dybbuk, fontSize: 16, color: BG_DARK, flexShrink: 0 },
  ingText: { fontFamily: Fonts.dybbuk, fontSize: 15, color: INK, lineHeight: 20 },

  // Steps
  stepRow: { paddingVertical: 8, alignItems: 'flex-start', gap: 10 },
  stepBullet: { fontFamily: Fonts.dybbuk, fontSize: 20, color: BG_DARK, lineHeight: 24, flexShrink: 0 },
  stepText: { fontFamily: Fonts.dybbuk, fontSize: 15, color: INK, lineHeight: 22 },

  // Video
  videoCard: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: Radius.lg,
    padding: 14, alignItems: 'center', gap: 12,
  },
  videoText: { fontFamily: Fonts.dybbuk, fontSize: 15, color: INK },

  // Delete
  deleteBtn: {
    borderWidth: 1.5, borderColor: 'rgba(211,47,47,0.4)',
    borderRadius: Radius.pill, padding: 14, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: Fonts.dybbuk, color: Colors.red, fontSize: 16 },
});
