// app/scan/info.tsx
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLang } from '../../src/context/LanguageContext';
import { Colors, Radius } from '../../src/theme';

type Section = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  titleHe: string;
  titleEn: string;
  items: { he: string; en: string }[];
};

const RLM = '\u200F'; // Right-to-Left Mark — forces RTL context for sentences starting with LTR

const SECTIONS: Section[] = [
  {
    icon: 'lightning-bolt',
    color: Colors.sun,
    titleHe: 'כמה אפשר לסרוק?',
    titleEn: 'How much can I scan?',
    items: [
      {
        he: 'כל תמונה שנבדקת עולה כ-$0.005 (בין אם היא מתכון ואם לאו).',
        en: 'Each photo checked costs ~$0.005 (recipe or not).',
      },
      {
        he: 'כל מתכון שמחולץ עולה עוד כ-$0.04–0.06 נוספים.',
        en: 'Each recipe extracted costs an additional ~$0.04–0.06.',
      },
      {
        he: `${RLM}$5 קרדיט ≈ 400–600 תמונות (כ-20% מתכונים).`,
        en: 'With $5 credit: roughly 400–600 photos (assuming ~20% are recipes).',
      },
      {
        he: `${RLM}$20 קרדיט ≈ 1,500–2,500 תמונות.`,
        en: 'With $20 credit: roughly 1,500–2,500 photos.',
      },
    ],
  },
  {
    icon: 'clock-fast',
    color: Colors.mauve,
    titleHe: 'האם יש הגבלות מהירות?',
    titleEn: 'Are there speed limits?',
    items: [
      {
        he: 'לשימוש ביתי רגיל — כמעט ואין. ה-API מאפשר אלפי בקשות בדקה.',
        en: 'For normal home use — practically none. The API allows thousands of requests per minute.',
      },
      {
        he: 'אין הגבלה יומית או שעתית — רק יתרת הקרדיט מגבילה.',
        en: 'No daily or hourly cap — only your credit balance limits you.',
      },
      {
        he: 'סריקת 200 תמונות לוקחת בערך 20–35 דקות (בגלל זמן עיבוד, לא הגבלות).',
        en: 'Scanning 200 photos takes roughly 20–35 minutes (processing time, not API limits).',
      },
    ],
  },
  {
    icon: 'alert-circle-outline',
    color: Colors.sun,
    titleHe: 'כשנגמר הקרדיט',
    titleEn: 'When credits run out',
    items: [
      {
        he: 'לא צריך להמתין — פשוט טוענים קרדיט חדש באתר Anthropic.',
        en: 'No waiting required — just add credits at console.anthropic.com.',
      },
      {
        he: 'הסריקה עוצרת ותוצאות שכבר נמצאו נשמרות.',
        en: 'The scan stops; results already found are kept.',
      },
      {
        he: 'אפשר לחדש את הסריקה מחדש לאחר טעינת קרדיט.',
        en: 'You can restart the scan after topping up.',
      },
    ],
  },
  {
    icon: 'shield-lock-outline',
    color: '#18727d',
    titleHe: 'פרטיות התמונות',
    titleEn: 'Photo privacy',
    items: [
      {
        he: 'התמונות דוחסות למקסימום 1600 פיקסל לפני השליחה.',
        en: 'Photos are compressed to max 1600px before sending.',
      },
      {
        he: 'השידור מוצפן מקצה לקצה.',
        en: 'Transmission is fully encrypted (HTTPS/TLS).',
      },
      {
        he: 'החברה (Anthropic) לא משתמשת בנתוני ה-API לאימון מודלים.',
        en: 'Anthropic does not use API data to train models (enterprise API policy).',
      },
      {
        he: 'האפליקציה לא שומרת תמונות בשום שרת — הן עוברות ישירות ל-AI ולא נשמרות.',
        en: 'The app never stores photos on any server — they pass directly to the AI and are not retained.',
      },
      {
        he: 'יש לך תמונות אישיות/רגישות? עדיף לסרוק רק אלבומי מתכונים או סיכומי מסך.',
        en: 'Have sensitive photos? Best to scan only recipe albums or screenshots.',
      },
    ],
  },
  {
    icon: 'currency-usd',
    color: '#2d7a3e',
    titleHe: 'תמחור (Claude Sonnet)',
    titleEn: 'Pricing (Claude Sonnet)',
    items: [
      {
        he: 'טוקנים של קלט: כ-$3 למיליון.',
        en: 'Input tokens: ~$3 per million.',
      },
      {
        he: 'טוקנים של פלט: כ-$15 למיליון.',
        en: 'Output tokens: ~$15 per million.',
      },
      {
        he: 'תמונה אחת שווה בערך 1,500–3,000 טוקנים של קלט.',
        en: 'One image ≈ 1,500–3,000 input tokens.',
      },
      {
        he: 'לתמחור עדכני ראה: anthropic.com/pricing',
        en: 'For updated pricing: anthropic.com/pricing',
      },
    ],
  },
  {
    icon: 'lightbulb-outline',
    color: Colors.mauve,
    titleHe: 'טיפים לחיסכון בקרדיט',
    titleEn: 'Tips to save credit',
    items: [
      {
        he: 'סרוק תחילה רק "סיכומי מסך" — הכי סביר שיש שם מתכונים.',
        en: 'Start with "Screenshots" album — most likely to contain recipes.',
      },
      {
        he: 'קבע מספר נמוך (50–100) לבדיקה ראשונה.',
        en: 'Set a low count (50–100) for a first test run.',
      },
      {
        he: 'מתכונים שכבר נוספו לא יסרקו שוב.',
        en: 'Already-added recipes are automatically skipped.',
      },
      {
        he: 'תמונות כפולות (אותה תמונה שמורה פעמיים) מדולגות אוטומטית.',
        en: 'Duplicate photos (same image saved twice) are skipped automatically.',
      },
    ],
  },
];

export default function ScanInfoScreen() {
  const { lang, isRTL, fontHe } = useLang();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontFamily: fontHe }]}>
          {lang === 'he' ? 'מידע על סריקת AI' : 'AI Scanning Info'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { fontFamily: fontHe, textAlign: isRTL ? 'right' : 'left' }]}>
          {lang === 'he'
            ? 'הסריקה משתמשת ב-Claude AI של Anthropic. כל השאלות הנפוצות — כאן.'
            : 'Scanning uses Anthropic\'s Claude AI. All common questions — answered here.'}
        </Text>

        {SECTIONS.map((section, si) => (
          <View key={si} style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.iconCircle, { backgroundColor: section.color + '22' }]}>
                <MaterialCommunityIcons name={section.icon} size={22} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { fontFamily: fontHe, color: section.color }]}>
                {lang === 'he' ? section.titleHe : section.titleEn}
              </Text>
            </View>
            <View style={styles.itemsBox}>
              {section.items.map((item, ii) => (
                <View key={ii} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.bullet, { backgroundColor: section.color }]} />
                  <Text style={[styles.itemText, { fontFamily: fontHe, textAlign: isRTL ? 'right' : 'left' }]}>
                    {lang === 'he' ? item.he : item.en}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <MaterialCommunityIcons name="information-outline" size={16} color={Colors.text3} />
          <Text style={[styles.disclaimerText, { fontFamily: fontHe, textAlign: isRTL ? 'right' : 'left' }]}>
            {lang === 'he'
              ? 'הנתונים הם הערכות בלבד. התמחור עשוי להשתנות. לפרטים עדכניים:'
              : 'Figures are estimates. Pricing may change. For up-to-date details:'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('https://www.anthropic.com/pricing')}
        >
          <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.mauve} />
          <Text style={[styles.linkText, { fontFamily: fontHe }]}>anthropic.com/pricing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('https://www.anthropic.com/legal/privacy')}
        >
          <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.mauve} />
          <Text style={[styles.linkText, { fontFamily: fontHe }]}>
            {lang === 'he' ? 'מדיניות פרטיות Anthropic' : 'Anthropic Privacy Policy'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    backgroundColor: Colors.mauve, alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  scroll: { padding: 20, gap: 16 },
  intro: {
    fontSize: 14, color: Colors.text2, lineHeight: 22,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 14, marginBottom: 4,
  },

  section: {
    backgroundColor: '#fff', borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionHeader: {
    alignItems: 'center', gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },

  itemsBox: { padding: 14, gap: 10 },
  itemRow: { gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  itemText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 12, marginTop: 4,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.text3, lineHeight: 18 },

  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4,
  },
  linkText: { color: Colors.mauve, fontSize: 13, textDecorationLine: 'underline' },
});
