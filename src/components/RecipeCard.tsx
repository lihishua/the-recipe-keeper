// src/components/RecipeCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Recipe } from '../context/RecipeContext';
import { useLang } from '../context/LanguageContext';
import { Colors, Fonts, Radius, Shadow } from '../theme';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  horizontal?: boolean;
}

export function RecipeCard({ recipe, onPress, horizontal }: Props) {
  const { lang, t } = useLang();
  const title = lang === 'he' ? recipe.titleHe : recipe.titleEn ?? recipe.title;

  const timeStr = recipe.tags.totalTime
    ? `⏱ ${recipe.tags.totalTime} ${t('minutes')}`
    : recipe.tags.cookTime
    ? `⏱ ${recipe.tags.cookTime} ${t('minutes')}`
    : '';

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.hCard, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.hEmoji}>
          <Text style={styles.hEmojiText}>{recipe.emoji}</Text>
        </View>
        <View style={styles.hBody}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{t(recipe.category as any)}</Text>
          </View>
          <Text style={styles.hTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.hMeta}>{timeStr}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.emojiBox}>
        <Text style={styles.emojiText}>{recipe.emoji}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{t(recipe.category as any)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.meta}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: 180,
    overflow: 'hidden',
  },
  emojiBox: {
    height: 110,
    backgroundColor: Colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 52 },
  body: { padding: 12 },
  tagPill: {
    backgroundColor: Colors.sunLighter,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: { fontSize: 10, color: Colors.sunDark, fontWeight: '600', fontFamily: 'Gan' },
  title: { fontSize: 16, fontFamily: Fonts.dybbuk, color: Colors.text, marginBottom: 4, lineHeight: 22 },
  meta: { fontSize: 11, color: Colors.text3, fontFamily: 'Gan' },

  // Horizontal list item variant
  hCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  hEmoji: {
    width: 80,
    backgroundColor: Colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hEmojiText: { fontSize: 36 },
  hBody: { flex: 1, padding: 12 },
  hTitle: { fontSize: 17, fontFamily: Fonts.dybbuk, color: Colors.text, marginBottom: 4 },
  hMeta: { fontSize: 12, color: Colors.text3, fontFamily: 'Gan' },
});
