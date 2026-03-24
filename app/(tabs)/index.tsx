// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { useRecipes } from '../../src/context/RecipeContext';
import { Colors, Radius, Shadow } from '../../src/theme';

export default function HomeScreen() {
  const { t, lang, setLang, isRTL, fontHe } = useLang();
  const { recipes } = useRecipes();

  const rowDir = isRTL ? 'row-reverse' : 'row';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TOP BAR */}
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <Text style={styles.logo}>nib<Text style={styles.logoAccent}>ble</Text></Text>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          <Text style={styles.langText}>{lang === 'he' ? 'EN' : 'עב'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* TITLE */}
        <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontHe }]}>
          {t('homeTitle')}
        </Text>

        {/* MAIN BUTTONS — side by side */}
        <View style={[styles.btnRow, { flexDirection: rowDir }]}>
          {/* Button 1 — Add Recipe */}
          <TouchableOpacity
            style={[styles.mainBtn, { flex: 1 }]}
            onPress={() => router.push('/add-recipe')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="chef-hat" size={36} color="#fff" style={styles.mainBtnIcon} />
            <Text style={[styles.mainBtnLabel, { textAlign: 'center', fontFamily: fontHe }]}>
              {t('addRecipe')}
            </Text>
            <Text style={[styles.mainBtnSub, { textAlign: 'center', fontFamily: fontHe }]}>
              {t('addChoose')}
            </Text>
          </TouchableOpacity>

          {/* Button 2 — My Collection */}
          <TouchableOpacity
            style={[styles.mainBtn, styles.mainBtnOutline, { flex: 1 }]}
            onPress={() => router.push('/collection')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={36} color={Colors.text} style={styles.mainBtnIcon} />
            <Text style={[styles.mainBtnLabel, styles.mainBtnLabelDark, { textAlign: 'center', fontFamily: fontHe }]}>
              {t('myCollection')}
            </Text>
            <Text style={[styles.mainBtnSub, styles.mainBtnSubDark, { textAlign: 'center', fontFamily: fontHe }]}>
              {recipes.length} {t('recipes')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.sun, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14,
  },
  logo: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  logoAccent: { color: Colors.yolk, fontStyle: 'italic' },
  langToggle: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  langText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8 },

  btnRow: { gap: 14 },
  mainBtn: {
    backgroundColor: Colors.sun, borderRadius: Radius.lg, padding: 20, ...Shadow.md,
    alignItems: 'center', justifyContent: 'center',
  },
  mainBtnOutline: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  mainBtnIcon: { marginBottom: 10 },
  mainBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  mainBtnLabelDark: { color: Colors.text },
  mainBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  mainBtnSubDark: { color: Colors.text3 },
});
