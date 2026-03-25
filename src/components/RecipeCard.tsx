// src/components/RecipeCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '../context/RecipeContext';
import { useLang } from '../context/LanguageContext';
import { Colors, Fonts, Radius, Shadow } from '../theme';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  horizontal?: boolean;
}

function CardImage({ uri, size }: { uri?: string; size: 'grid' | 'list' }) {
  const boxStyle = size === 'grid' ? styles.imageBox : styles.hImageBox;
  if (uri) {
    return (
      <View style={boxStyle}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[boxStyle, styles.imagePlaceholder]}>
      <MaterialCommunityIcons name="silverware-fork-knife" size={size === 'grid' ? 36 : 28} color="#9a9a9a" />
    </View>
  );
}

export function RecipeCard({ recipe, onPress, horizontal }: Props) {
  const { lang, t, fontRecipe } = useLang();
  const title = lang === 'he' ? recipe.titleHe : recipe.titleEn ?? recipe.title;

  const timeStr = recipe.tags.totalTime
    ? `⏱ ${recipe.tags.totalTime} ${t('minutes')}`
    : recipe.tags.cookTime
    ? `⏱ ${recipe.tags.cookTime} ${t('minutes')}`
    : '';

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.hCard, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
        <CardImage uri={recipe.sourceUri} size="list" />
        <View style={styles.hBody}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{t(recipe.category as any)}</Text>
          </View>
          <Text style={[styles.hTitle, { fontFamily: fontRecipe }]} numberOfLines={2}>{title}</Text>
          <Text style={styles.hMeta}>{timeStr}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
      <CardImage uri={recipe.sourceUri} size="grid" />
      <View style={styles.body}>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{t(recipe.category as any)}</Text>
        </View>
        <Text style={[styles.title, { fontFamily: fontRecipe }]} numberOfLines={2}>{title}</Text>
        <Text style={styles.meta}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.sun,
    borderRadius: Radius.lg,
    width: 180,
    overflow: 'hidden',
  },
  imageBox: {
    height: 110,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 12 },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: { fontSize: 10, color: '#fff', fontWeight: '600', fontFamily: 'Gan' },
  title: { fontSize: 16, fontFamily: Fonts.dybbuk, color: '#fff', marginBottom: 4, lineHeight: 22 },
  meta: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Gan' },

  // Horizontal list item variant
  hCard: {
    backgroundColor: Colors.sun,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  hImageBox: {
    width: 80,
    overflow: 'hidden',
  },
  hBody: { flex: 1, padding: 12 },
  hTitle: { fontSize: 17, fontFamily: Fonts.dybbuk, color: '#fff', marginBottom: 4 },
  hMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Gan' },
});
