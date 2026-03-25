// app/recipe/edit/[id].tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLang } from '../../../src/context/LanguageContext';
import { useRecipes, Recipe, RecipeTags, Category } from '../../../src/context/RecipeContext';
import { Colors, Fonts, Radius } from '../../../src/theme';

const BG      = '#d0eaec';
const BG_DARK = '#18727d';
const INK     = '#36312d';

type IconOption = {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  emoji: string;
  labelHe: string;
  labelEn: string;
  bg: string;
  color: string;
};

const RECIPE_ICONS: IconOption[] = [
  { iconName: 'noodles',               emoji: '🍝', labelHe: 'איטלקי',  labelEn: 'Italian',   bg: '#faeee3', color: '#c4622a' },
  { iconName: 'cake-variant-outline',  emoji: '🍰', labelHe: 'קינוחים', labelEn: 'Desserts',  bg: '#f0dde6', color: '#9b4a6a' },
  { iconName: 'leaf',                  emoji: '🥗', labelHe: 'סלטים',   labelEn: 'Salads',    bg: '#d0eaec', color: '#18727d' },
  { iconName: 'egg-outline',           emoji: '🥞', labelHe: 'בוקר',    labelEn: 'Breakfast', bg: '#faeee3', color: '#c4622a' },
  { iconName: 'bowl-mix-outline',      emoji: '🍜', labelHe: 'אסייתי',  labelEn: 'Asian',     bg: '#e5d5dc', color: '#9b4a6a' },
  { iconName: 'pizza',                 emoji: '🍕', labelHe: 'פיצה',    labelEn: 'Pizza',     bg: '#faeee3', color: '#c4622a' },
  { iconName: 'pot-steam-outline',     emoji: '🥘', labelHe: 'תבשיל',   labelEn: 'Stew',      bg: '#f5ede3', color: '#c4622a' },
  { iconName: 'fish',                  emoji: '🐟', labelHe: 'דגים',    labelEn: 'Fish',      bg: '#d0eaec', color: '#18727d' },
  { iconName: 'bread-slice-outline',   emoji: '🍞', labelHe: 'לחם',     labelEn: 'Bread',     bg: '#faeee3', color: '#c4622a' },
  { iconName: 'glass-wine',            emoji: '🍷', labelHe: 'משקאות',  labelEn: 'Drinks',    bg: '#f0dde6', color: '#9b4a6a' },
  { iconName: 'silverware-fork-knife', emoji: '🍽', labelHe: 'אחר',     labelEn: 'Other',     bg: '#f5ede3', color: '#36312d' },
];

type UnifiedTag = Category | 'vegan' | 'vegetarian' | 'glutenFree' | 'dairyFree';
const CATEGORY_KEYS: Category[] = ['italian', 'desserts', 'salads', 'breakfast', 'asian', 'other'];
const ALL_TAGS: { key: UnifiedTag; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
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

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, isRTL, fontRecipe } = useLang();
  const styles = useMemo(() => makeStyles(fontRecipe), [fontRecipe]);
  const { getRecipeById, updateRecipe } = useRecipes();
  const recipe = getRecipeById(id);

  const [titleHe, setTitleHe]   = useState(recipe?.titleHe ?? recipe?.title ?? '');
  const [titleEn, setTitleEn]   = useState(recipe?.titleEn ?? recipe?.title ?? '');
  const [ingredients, setIngredients] = useState<string[]>(
    (lang === 'he' ? recipe?.ingredientsHe : recipe?.ingredientsEn) ?? recipe?.ingredients ?? ['']
  );
  const [steps, setSteps] = useState<string[]>(
    (lang === 'he' ? recipe?.stepsHe : recipe?.stepsEn) ?? recipe?.steps ?? ['']
  );
  const [selectedIcon, setSelectedIcon] = useState<IconOption>(
    RECIPE_ICONS.find(o => o.emoji === recipe?.emoji) ?? RECIPE_ICONS[RECIPE_ICONS.length - 1]
  );
  const [coverUri, setCoverUri] = useState<string | null>(recipe?.sourceUri ?? null);

  const pickCoverPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };
  const [prepTime, setPrepTime] = useState(recipe?.tags?.prepTime?.toString() ?? '');
  const [cookTime, setCookTime] = useState(recipe?.tags?.cookTime?.toString() ?? '');
  const [bakeTime, setBakeTime] = useState(recipe?.tags?.bakeTime?.toString() ?? '');
  const [riseTime, setRiseTime] = useState(recipe?.tags?.riseTime?.toString() ?? '');
  const [selectedTags, setSelectedTags] = useState<UnifiedTag[]>(() => {
    const tags: UnifiedTag[] = [recipe?.category ?? 'other'];
    if (recipe?.tags?.vegan) tags.push('vegan');
    if (recipe?.tags?.vegetarian) tags.push('vegetarian');
    if (recipe?.tags?.glutenFree) tags.push('glutenFree');
    if (recipe?.tags?.dairyFree) tags.push('dairyFree');
    return tags;
  });
  const [customTags, setCustomTags]         = useState<string[]>(recipe?.customTags ?? []);
  const [customTagInput, setCustomTagInput] = useState('');

  const toggleTag = (tag: UnifiedTag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !customTags.includes(tag)) setCustomTags(prev => [...prev, tag]);
    setCustomTagInput('');
  };
  const removeCustomTag = (tag: string) => setCustomTags(prev => prev.filter(t => t !== tag));

  if (!recipe) return null;

  const updateIng  = (i: number, v: string) => { const n = [...ingredients]; n[i] = v; setIngredients(n); };
  const addIng     = () => setIngredients([...ingredients, '']);
  const removeIng  = (i: number) => setIngredients(ingredients.filter((_, j) => j !== i));
  const updateStep = (i: number, v: string) => { const n = [...steps]; n[i] = v; setSteps(n); };
  const addStep    = () => setSteps([...steps, '']);
  const removeStep = (i: number) => setSteps(steps.filter((_, j) => j !== i));

  const handleSave = async () => {
    const catTags = selectedTags.filter(t => CATEGORY_KEYS.includes(t as Category));
    const category: Category = (catTags[0] as Category) ?? 'other';
    const tags: RecipeTags = {
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      cookTime: cookTime ? parseInt(cookTime) : undefined,
      bakeTime: bakeTime ? parseInt(bakeTime) : undefined,
      riseTime: riseTime ? parseInt(riseTime) : undefined,
      vegan:      selectedTags.includes('vegan'),
      vegetarian: selectedTags.includes('vegan') || selectedTags.includes('vegetarian'),
      glutenFree: selectedTags.includes('glutenFree'),
      dairyFree:  selectedTags.includes('dairyFree'),
    };
    const filtered      = ingredients.filter(Boolean);
    const filteredSteps = steps.filter(Boolean);
    const updated: Recipe = {
      ...recipe,
      title: titleHe || titleEn,
      titleHe, titleEn,
      ingredients: filtered,
      ingredientsHe: lang === 'he' ? filtered : recipe.ingredientsHe ?? filtered,
      ingredientsEn: lang === 'en' ? filtered : recipe.ingredientsEn ?? filtered,
      steps: filteredSteps,
      stepsHe: lang === 'he' ? filteredSteps : recipe.stepsHe ?? filteredSteps,
      stepsEn: lang === 'en' ? filteredSteps : recipe.stepsEn ?? filteredSteps,
      tags, category, emoji: selectedIcon.emoji,
      customTags: customTags.filter(Boolean),
    };
    await updateRecipe(updated);
    router.back();
  };

  const rowDir = isRTL ? 'row-reverse' : 'row';
  const title  = lang === 'he' ? titleHe : titleEn;
  const setTitle = lang === 'he' ? setTitleHe : setTitleEn;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* TOP BAR */}
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('edit')}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View style={[styles.headerRow, { flexDirection: rowDir }]}>

              {/* Illustrated icon picker */}
              <View style={styles.iconPickerWrap}>
                <TouchableOpacity style={[styles.heroIcon, { backgroundColor: selectedIcon.bg }]} onPress={pickCoverPhoto}>
                  {coverUri
                    ? <Image source={{ uri: coverUri }} style={styles.heroImage} />
                    : <MaterialCommunityIcons name={selectedIcon.iconName} size={48} color={selectedIcon.color} />
                  }
                  <View style={styles.cameraOverlay}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconStrip}>
                  {RECIPE_ICONS.map(opt => (
                    <TouchableOpacity
                      key={opt.iconName}
                      style={[styles.iconOpt, { backgroundColor: opt.bg }, selectedIcon.iconName === opt.iconName && styles.iconOptActive]}
                      onPress={() => { setSelectedIcon(opt); setCoverUri(null); }}
                    >
                      <MaterialCommunityIcons name={opt.iconName} size={20} color={opt.color} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Title + time */}
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.titleInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={lang === 'he' ? 'שם המתכון' : 'Recipe name'}
                  placeholderTextColor="rgba(54,49,45,0.4)"
                  multiline
                />

                {/* Time row */}
                <View style={[styles.timeRow, { flexDirection: rowDir }]}>
                  {[
                    { val: prepTime, set: setPrepTime, icon: 'clock-outline' as const,     ph: lang === 'he' ? 'הכנה'  : 'Prep' },
                    { val: cookTime, set: setCookTime, icon: 'pot-steam-outline' as const, ph: lang === 'he' ? 'בישול' : 'Cook' },
                    { val: bakeTime, set: setBakeTime, icon: 'oven' as const,              ph: lang === 'he' ? 'אפייה' : 'Bake' },
                    { val: riseTime, set: setRiseTime, icon: 'timer-sand' as const,        ph: lang === 'he' ? 'תפיחה' : 'Rise' },
                  ].map(({ val, set, icon, ph }) => (
                    <View key={ph} style={styles.timeItem}>
                      <MaterialCommunityIcons name={icon} size={16} color={INK} />
                      <TextInput
                        style={styles.timeInput}
                        value={val}
                        onChangeText={set}
                        keyboardType="number-pad"
                        placeholder={ph}
                        placeholderTextColor="rgba(54,49,45,0.4)"
                        textAlign="center"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── INGREDIENTS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'מרכיבים' : 'Ingredients'}</Text>
            <View style={styles.sectionLine} />

            {ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingRow, { flexDirection: rowDir }]}>
                <Text style={styles.ingHeart}>♡</Text>
                <TextInput
                  style={[styles.ingInput, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                  value={ing}
                  onChangeText={v => updateIng(i, v)}
                  placeholder={t('ingredientPlaceholder')}
                  placeholderTextColor="rgba(54,49,45,0.35)"
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIng(i)} style={styles.removeBtn}>
                    <MaterialCommunityIcons name="minus-circle-outline" size={18} color="rgba(211,47,47,0.7)" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={[styles.addRowBtn, { flexDirection: rowDir }]} onPress={addIng}>
              <MaterialCommunityIcons name="plus-circle-outline" size={16} color={BG_DARK} />
              <Text style={styles.addRowText}>{t('addIngredient')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ── STEPS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'אופן הכנה' : 'Instructions'}</Text>
            <View style={styles.sectionLine} />

            {steps.map((step, i) => (
              <View key={i} style={[styles.stepRow, { flexDirection: rowDir }]}>
                <Text style={styles.stepBullet}>•</Text>
                <TextInput
                  style={[styles.ingInput, { flex: 1, textAlign: isRTL ? 'right' : 'left', minHeight: 52 }]}
                  value={step}
                  onChangeText={v => updateStep(i, v)}
                  multiline
                  placeholder={`${lang === 'he' ? 'שלב' : 'Step'} ${i + 1}`}
                  placeholderTextColor="rgba(54,49,45,0.35)"
                />
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(i)} style={styles.removeBtn}>
                    <MaterialCommunityIcons name="minus-circle-outline" size={18} color="rgba(211,47,47,0.7)" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={[styles.addRowBtn, { flexDirection: rowDir }]} onPress={addStep}>
              <MaterialCommunityIcons name="plus-circle-outline" size={16} color={BG_DARK} />
              <Text style={styles.addRowText}>{t('addStep')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ── TAGS (unified: category + dietary, multi-select) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{lang === 'he' ? 'תגיות' : 'Tags'}</Text>
            <View style={styles.sectionLine} />
            <View style={styles.tagGrid}>
              {ALL_TAGS.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => toggleTag(key)}
                  >
                    <MaterialCommunityIcons name={icon} size={15} color={active ? '#fff' : 'rgba(54,49,45,0.6)'} />
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                      {t(key as any)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* Custom tags */}
              {customTags.map(tag => (
                <TouchableOpacity key={tag} style={styles.customTagChip} onPress={() => removeCustomTag(tag)}>
                  <Text style={styles.customTagText}>{tag}</Text>
                  <MaterialCommunityIcons name="close-circle" size={14} color="rgba(54,49,45,0.5)" />
                </TouchableOpacity>
              ))}
            </View>
            {/* Custom tag input */}
            <View style={[styles.customTagRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                style={[styles.customTagInput, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                placeholder={lang === 'he' ? 'תגית חופשית...' : 'Custom tag...'}
                placeholderTextColor="rgba(54,49,45,0.35)"
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.customTagAddBtn} onPress={addCustomTag}>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(fontRecipe: string) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar: {
    backgroundColor: BG_DARK, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  cancelText: { color: 'rgba(255,255,255,0.85)', fontFamily: fontRecipe, fontSize: 15 },
  topTitle: { color: '#fff', fontFamily: fontRecipe, fontSize: 18 },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  saveText: { color: '#fff', fontFamily: fontRecipe, fontSize: 15, fontWeight: '700' },

  // Header
  header: { padding: 20, paddingBottom: 24 },
  headerRow: { alignItems: 'flex-start', gap: 16 },
  iconPickerWrap: { flexShrink: 0, alignItems: 'center', gap: 8 },
  heroIcon: {
    width: 110, height: 110, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  cameraOverlay: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(54,49,45,0.5)', borderRadius: 10, padding: 4,
  },
  iconStrip: { maxWidth: 110 },
  iconOpt: {
    width: 34, height: 34, borderRadius: Radius.md,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  iconOptActive: { borderColor: INK },

  titleInput: {
    fontFamily: fontRecipe,
    fontSize: 28,
    color: INK,
    lineHeight: 34,
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(54,49,45,0.25)',
    paddingBottom: 6,
  },

  // Time
  timeRow: { flexWrap: 'wrap', gap: 10 },
  timeItem: { alignItems: 'center', gap: 4 },
  timeInput: {
    fontFamily: fontRecipe, fontSize: 13, color: INK,
    borderBottomWidth: 1, borderBottomColor: 'rgba(54,49,45,0.25)',
    paddingVertical: 2, width: 60,
  },

  // Dividers
  divider: { height: 2, backgroundColor: INK, marginHorizontal: 0 },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionHeader: {
    fontFamily: fontRecipe, fontSize: 28, color: INK,
    textAlign: 'center', marginBottom: 6,
  },
  sectionLine: {
    height: 1, backgroundColor: INK, opacity: 0.3,
    marginBottom: 16, marginHorizontal: 20,
  },

  // Ingredients / steps
  ingRow: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(54,49,45,0.2)',
    paddingVertical: 6, alignItems: 'center', gap: 10,
  },
  ingHeart: { fontFamily: fontRecipe, fontSize: 16, color: BG_DARK, flexShrink: 0 },
  ingInput: {
    fontFamily: fontRecipe, fontSize: 15, color: INK, lineHeight: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(54,49,45,0.15)',
    paddingVertical: 4,
  },
  stepRow: { paddingVertical: 6, alignItems: 'flex-start', gap: 10 },
  stepBullet: { fontFamily: fontRecipe, fontSize: 20, color: BG_DARK, lineHeight: 24, flexShrink: 0 },
  removeBtn: { padding: 4 },
  addRowBtn: { marginTop: 12, alignItems: 'center', gap: 6, opacity: 0.7 },
  addRowText: { fontFamily: fontRecipe, fontSize: 14, color: BG_DARK },

  // Tags
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'rgba(54,49,45,0.3)',
    borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tagChipActive: { backgroundColor: BG_DARK, borderColor: BG_DARK },
  tagChipText:   { fontFamily: fontRecipe, fontSize: 13, color: INK },
  tagChipTextActive: { color: '#fff' },
  customTagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(24,114,125,0.12)', borderRadius: Radius.pill,
    borderWidth: 1.5, borderColor: BG_DARK,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  customTagText: { fontFamily: fontRecipe, fontSize: 13, color: INK },
  customTagRow: { marginTop: 12, gap: 8, alignItems: 'center' },
  customTagInput: {
    fontFamily: fontRecipe, fontSize: 14, color: INK,
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: Radius.pill,
    borderWidth: 1.5, borderColor: 'rgba(54,49,45,0.2)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  customTagAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center',
  },
  });
}
