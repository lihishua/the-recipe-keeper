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
        <Text style={styles.logo}>2<Text style={styles.logoAccent}>Spoons</Text></Text>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          <Text style={styles.langText}>{lang === 'he' ? 'EN' : 'עב'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* TITLE */}
        <Text style={[styles.heroTitle, { fontFamily: fontHe }]}>
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
            <MaterialCommunityIcons name="chef-hat" size={40} color="#fff" style={styles.mainBtnIcon} />
            <Text style={[styles.mainBtnLabel, { textAlign: 'center', fontFamily: fontHe }]}>
              {lang === 'he' ? 'הוסף מתכון' : 'Add Recipe'}
            </Text>
          </TouchableOpacity>

          {/* Button 2 — My Collection */}
          <TouchableOpacity
            style={[styles.mainBtn, styles.mainBtnOutline, { flex: 1 }]}
            onPress={() => router.push('/collection')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={40} color="#fff" style={styles.mainBtnIcon} />
            <Text style={[styles.mainBtnLabel, { textAlign: 'center', fontFamily: fontHe }]}>
              {t('myCollection')}
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
    backgroundColor: Colors.mauve, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14,
  },
  logo: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  logoAccent: { color: Colors.yolk, fontStyle: 'italic' },
  langToggle: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  langText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { flex: 1, padding: 24, paddingTop: 48, gap: 20 },
  heroTitle: { fontSize: 32, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },

  btnRow: { gap: 14 },
  mainBtn: {
    backgroundColor: Colors.sun, borderRadius: Radius.lg, padding: 20, ...Shadow.md,
    alignItems: 'center', justifyContent: 'center',
  },
  mainBtnOutline: {
    backgroundColor: '#18727d', borderWidth: 0,
  },
  mainBtnIcon: { marginBottom: 10 },
  mainBtnLabel: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
