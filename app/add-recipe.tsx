// app/add-recipe.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, Animated,
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
  const [photoExpanded, setPhotoExpanded] = useState(false);

  const rowDir = isRTL ? 'row-reverse' : 'row';

  // Cooking pot animation
  const potRock = useRef(new Animated.Value(0)).current;
  const potBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scanning) return;
    potRock.setValue(0);
    potBounce.setValue(0);

    const rock = Animated.loop(
      Animated.sequence([
        Animated.timing(potRock, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(potRock, { toValue: -1, duration: 560, useNativeDriver: true }),
        Animated.timing(potRock, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(potBounce, { toValue: -5, duration: 350, useNativeDriver: true }),
        Animated.timing(potBounce, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    rock.start();
    bounce.start();
    return () => { rock.stop(); bounce.stop(); };
  }, [scanning]);

  const rotate = potRock.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    await processImage(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(lang === 'he' ? 'נדרשת הרשאה' : 'Permission required', lang === 'he' ? 'נא לאפשר גישה למצלמה' : 'Please allow camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
    if (result.canceled) return;
    await processImage(result.assets[0]);
  };

  const processImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setPhotoExpanded(false);
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
        sourceUri: asset.uri,
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
        <Text style={[styles.topTitle, { fontFamily: fontHe }]}>
          {lang === 'he' ? 'הוסף מתכון' : 'Add Recipe'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>

        {/* ── 2 MAIN BUTTONS ── */}
        <View style={[styles.btnRow, { flexDirection: rowDir }]}>

          {/* מתכון מתמונה */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: Colors.sun }]}
            onPress={() => setPhotoExpanded(v => !v)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="camera-outline" size={40} color="#fff" />
            <Text style={[styles.mainBtnLabel, { fontFamily: fontHe }]}>
              {lang === 'he' ? 'מתכון מתמונה' : 'From Photo'}
            </Text>
          </TouchableOpacity>

          {/* הוסף ידנית */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: '#18727d' }]}
            onPress={() => router.push('/recipe/add')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="pencil-outline" size={40} color="#fff" />
            <Text style={[styles.mainBtnLabel, { fontFamily: fontHe }]}>
              {lang === 'he' ? 'הוסף ידנית' : 'Add Manually'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* ── PHOTO SUB-OPTIONS ── */}
        {photoExpanded && (
          <View style={styles.subOptions}>
            <TouchableOpacity style={[styles.subBtn, { flexDirection: rowDir }]} onPress={handlePickPhoto}>
              <View style={[styles.subIcon, { backgroundColor: '#faeee3' }]}>
                <MaterialCommunityIcons name="image-outline" size={24} color={Colors.sun} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                  {lang === 'he' ? 'בחר מהגלריה' : 'Choose from Gallery'}
                </Text>
                <Text style={[styles.subDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'he' ? 'בחר תמונה אחת' : 'Pick a single image'}
                </Text>
              </View>
              <Text style={styles.subArrow}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.subBtn, { flexDirection: rowDir }]} onPress={() => { setPhotoExpanded(false); router.push('/scan/album'); }}>
              <View style={[styles.subIcon, { backgroundColor: '#d0eaec' }]}>
                <MaterialCommunityIcons name="image-search-outline" size={24} color="#18727d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                  {lang === 'he' ? 'סרוק את הגלריה' : 'Scan Gallery'}
                </Text>
                <Text style={[styles.subDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'he' ? 'סריקה אוטומטית של 200 תמונות אחרונות' : 'Auto-scan your 200 most recent photos'}
                </Text>
              </View>
              <Text style={styles.subArrow}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.subBtn, { flexDirection: rowDir }]} onPress={handleTakePhoto}>
              <View style={[styles.subIcon, { backgroundColor: '#f0dde6' }]}>
                <MaterialCommunityIcons name="camera" size={24} color="#9b4a6a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
                  {lang === 'he' ? 'צלם עכשיו' : 'Take a Photo'}
                </Text>
                <Text style={[styles.subDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'he' ? 'צלם את המתכון עם המצלמה' : 'Photograph the recipe with your camera'}
                </Text>
              </View>
              <Text style={styles.subArrow}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* AI SCANNING OVERLAY */}
      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.scanOverlay}>
          <View style={styles.scanBox}>
            <Animated.View style={{ transform: [{ rotate }, { translateY: potBounce }], marginBottom: 12 }}>
              <MaterialCommunityIcons name="pot-steam" size={56} color={Colors.sun} />
            </Animated.View>
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
    backgroundColor: Colors.mauve, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  content: { flex: 1, padding: 24, paddingTop: 32, gap: 20 },

  btnRow: { gap: 16 },
  mainBtn: {
    flex: 1, borderRadius: Radius.xl, padding: 28,
    alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadow.md,
  },
  mainBtnLabel: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center' },

  // Sub-options
  subOptions: { gap: 10 },
  subBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 14, ...Shadow.sm,
  },
  subIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  subTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  subDesc: { fontSize: 12, color: Colors.text3, lineHeight: 16 },
  subArrow: { fontSize: 18, color: Colors.text3 },

  // AI overlay
  scanOverlay: { flex: 1, backgroundColor: 'rgba(54,49,45,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', margin: 32 },
  scanTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  scanSub: { fontSize: 14, color: Colors.text2, textAlign: 'center' },
});
