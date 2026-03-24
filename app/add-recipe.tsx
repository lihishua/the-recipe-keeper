// app/add-recipe.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../src/context/LanguageContext';
import { useRecipes, Recipe } from '../src/context/RecipeContext';
import { extractRecipeFromImage } from '../src/services/claudeService';
import { Colors, Radius, Shadow } from '../src/theme';

export default function AddRecipeScreen() {
  const { t, lang, isRTL, fontHe } = useLang();
  const { addRecipe } = useRecipes();
  const [scanning, setScanning] = useState(false);
  const [scanExpanded, setScanExpanded] = useState(false);

  const rowDir = isRTL ? 'row-reverse' : 'row';

  const handlePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;

    setScanning(true);
    try {
      const asset = result.assets[0];
      const uri = asset.uri;
      // Use picker-provided base64 to avoid ph:// URI issues on iOS
      const precomputed = asset.base64
        ? { base64: asset.base64, mediaType: (asset.mimeType ?? 'image/jpeg') }
        : undefined;
      let extracted: Awaited<ReturnType<typeof extractRecipeFromImage>>;
      try {
        extracted = await extractRecipeFromImage(uri, precomputed);
      } catch (apiErr: any) {
        Alert.alert(
          lang === 'he' ? 'שגיאת API' : 'API Error',
          apiErr?.message ?? (lang === 'he' ? 'שגיאה לא ידועה' : 'Unknown error'),
        );
        return;
      }
      if (!extracted) {
        Alert.alert(
          lang === 'he' ? 'לא זוהה מתכון' : 'No recipe found',
          lang === 'he' ? 'לא הצלחנו לזהות מתכון בתמונה זו. נסה תמונה אחרת.' : 'Could not detect a recipe in this image. Try another one.',
        );
        return;
      }
      const recipe: Recipe = {
        id: Date.now().toString(),
        title: extracted.titleHe ?? 'מתכון חדש',
        titleHe: extracted.titleHe,
        titleEn: extracted.titleEn,
        ingredients: extracted.ingredientsHe ?? [],
        ingredientsHe: extracted.ingredientsHe,
        ingredientsEn: extracted.ingredientsEn,
        steps: extracted.stepsHe ?? [],
        stepsHe: extracted.stepsHe,
        stepsEn: extracted.stepsEn,
        tags: extracted.tags ?? {},
        category: extracted.category ?? 'other',
        emoji: extracted.emoji ?? '🍽',
        sourceType: 'photo',
        sourceUri: uri,
        createdAt: Date.now(),
      };
      await addRecipe(recipe);
      Alert.alert('🎉', `"${recipe.titleHe ?? recipe.title}" ${lang === 'he' ? 'נוסף לספר המתכונים שלך!' : 'added to your recipe book!'}`, [
        { text: lang === 'he' ? 'אוקיי' : 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TOP BAR */}
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontFamily: fontHe }]}>{t('addRecipe')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>

        {/* ── OPTION 1: Pick a photo ── */}
        <TouchableOpacity style={styles.card} onPress={handlePhoto} activeOpacity={0.85}>
          <View style={[styles.cardInner, { flexDirection: rowDir }]}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="image-outline" size={28} color={Colors.sun} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                {lang === 'he' ? 'בחר תמונה' : 'Pick a Photo'}
              </Text>
              <Text style={[styles.cardSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'he'
                  ? 'פתח את הגלריה ובחר תמונה של מתכון'
                  : 'Open your gallery and pick a recipe image'}
              </Text>
            </View>
            <Text style={styles.cardArrow}>{isRTL ? '‹' : '›'}</Text>
          </View>
        </TouchableOpacity>

        {/* ── OPTION 2: Scan my photos ── */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setScanExpanded(v => !v)}
          activeOpacity={0.85}
        >
          <View style={[styles.cardInner, { flexDirection: rowDir }]}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="image-search-outline" size={28} color="#388E3C" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                {lang === 'he' ? 'סרוק את התמונות שלי' : 'Scan My Photos'}
              </Text>
              <Text style={[styles.cardSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'he'
                  ? 'ניבל יחפש מתכונים בתמונות שלך אוטומטית'
                  : 'Nibble scans your photos automatically'}
              </Text>
            </View>
            <Text style={[styles.cardArrow, scanExpanded && styles.cardArrowDown]}>
              {isRTL ? '‹' : '›'}
            </Text>
          </View>

          {scanExpanded && (
            <View style={[styles.scanChoiceRow, { flexDirection: rowDir }]}>
              <TouchableOpacity
                style={styles.scanChoiceBtn}
                onPress={() => { setScanExpanded(false); router.push('/scan/album'); }}
              >
                <MaterialCommunityIcons name="view-gallery-outline" size={22} color={Colors.sun} />
                <Text style={styles.scanChoiceText}>
                  {lang === 'he' ? 'כל התמונות' : 'All Photos'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanChoiceBtn}
                onPress={() => { setScanExpanded(false); router.push('/scan/album'); }}
              >
                <MaterialCommunityIcons name="cellphone-screenshot" size={22} color={Colors.sun} />
                <Text style={styles.scanChoiceText}>
                  {lang === 'he' ? 'צילומי מסך' : 'Screenshots'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* ── OPTION 3: Add manually ── */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/recipe/add')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardInner, { flexDirection: rowDir }]}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="pencil-outline" size={28} color="#1976D2" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                {lang === 'he' ? 'הזן ידנית' : 'Add Manually'}
              </Text>
              <Text style={[styles.cardSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'he'
                  ? 'תבנית עם שדות מוארים — כל שדה מחכה לך'
                  : 'Highlighted template — fill in each field'}
              </Text>
            </View>
            <Text style={styles.cardArrow}>{isRTL ? '‹' : '›'}</Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* AI SCANNING OVERLAY */}
      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.scanOverlay}>
          <View style={styles.scanBox}>
            <MaterialCommunityIcons name="robot-outline" size={48} color={Colors.sun} style={{ marginBottom: 12 }} />
            <Text style={styles.scanTitle}>{t('aiReading')}</Text>
            <Text style={styles.scanSub}>{t('aiSub')}</Text>
            <ActivityIndicator color={Colors.sun} size="large" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.sun, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 20, gap: 16 },

  // Option card
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm, overflow: 'hidden',
  },
  cardInner: { padding: 20, alignItems: 'center', gap: 16 },
  iconBox: { width: 58, height: 58, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.text3, lineHeight: 18 },
  cardArrow: { fontSize: 20, color: Colors.text3 },
  cardArrowDown: { transform: [{ rotate: '90deg' }] },

  // Scan sub-choice
  scanChoiceRow: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 14, gap: 12,
  },
  scanChoiceBtn: {
    flex: 1, backgroundColor: Colors.sunLighter, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center', gap: 6,
  },
  scanChoiceText: { fontSize: 13, fontWeight: '700', color: Colors.sun },

  // AI overlay
  scanOverlay: { flex: 1, backgroundColor: 'rgba(45,27,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', margin: 32 },
  scanTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  scanSub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});
