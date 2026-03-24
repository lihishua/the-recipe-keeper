// src/components/TagBadge.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RecipeTags } from '../context/RecipeContext';
import { useLang } from '../context/LanguageContext';
import { Colors, Radius } from '../theme';

interface TagBadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  onPress?: () => void;
  active?: boolean;
}

export function TagBadge({ label, color, textColor, onPress, active }: TagBadgeProps) {
  const bg = active ? Colors.sun : color ?? Colors.sunLighter;
  const fg = active ? '#fff' : textColor ?? Colors.sunDark;

  const badge = (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress}>{badge}</TouchableOpacity>;
  return badge;
}

interface TagRowProps {
  tags: RecipeTags;
  compact?: boolean;
}

export function TagRow({ tags, compact }: TagRowProps) {
  const { t } = useLang();
  const badges: { label: string; color: string; text: string }[] = [];

  if (tags.prepTime) badges.push({ label: `${t('prepTime')}: ${tags.prepTime}${t('minutes')}`, color: Colors.blueLight, text: Colors.blue });
  if (tags.cookTime) badges.push({ label: `${t('cookTime')}: ${tags.cookTime}${t('minutes')}`, color: '#FFF8E1', text: '#E65100' });
  if (tags.totalTime) badges.push({ label: `${t('totalTime')}: ${tags.totalTime}${t('minutes')}`, color: Colors.sunLighter, text: Colors.sunDark });

  if (tags.difficulty) {
    const diffMap = { easy: Colors.greenLight, medium: '#FFF8E1', hard: '#FFEBEE' };
    const diffText = { easy: Colors.greenDark, medium: '#E65100', hard: Colors.red };
    const diffLabel = { easy: t('easy'), medium: t('medium'), hard: t('hard') };
    badges.push({ label: diffLabel[tags.difficulty], color: diffMap[tags.difficulty], text: diffText[tags.difficulty] });
  }

  if (tags.vegan) badges.push({ label: t('vegan'), color: Colors.greenLight, text: Colors.greenDark });
  else if (tags.vegetarian) badges.push({ label: t('vegetarian'), color: '#F1F8E9', text: '#558B2F' });

  if (tags.glutenFree) badges.push({ label: t('glutenFree'), color: '#FFF3E0', text: '#BF360C' });
  if (tags.dairyFree) badges.push({ label: t('dairyFree'), color: '#E8EAF6', text: '#283593' });

  if (badges.length === 0) return null;

  return (
    <View style={styles.row}>
      {(compact ? badges.slice(0, 3) : badges).map((b, i) => (
        <View key={i} style={[styles.badge, { backgroundColor: b.color }]}>
          <Text style={[styles.text, { color: b.text }]}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: { fontSize: 11, fontWeight: '600', fontFamily: 'Gan' },
});
