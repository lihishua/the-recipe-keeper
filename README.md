# The Recipe Keeper

A bilingual (Hebrew/English) mobile recipe app built with React Native + Expo. Save recipes manually or let Claude AI scan your photo album and extract them automatically.

---

## What's inside

```
the-recipe-keeper/
├── app/
│   ├── _layout.tsx              ← Root layout + providers
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Bottom navigation bar
│   │   ├── index.tsx            ← Home screen (add / view collection)
│   │   ├── recent.tsx           ← Recently saved recipes
│   │   ├── categories.tsx       ← Browse by category
│   │   ├── alphabetical.tsx     ← A–Z / א–ת index
│   │   └── search.tsx           ← Search + tag filters
│   ├── recipe/
│   │   ├── [id].tsx             ← Recipe detail view
│   │   ├── add.tsx              ← Manual add form
│   │   └── edit/[id].tsx        ← Edit existing recipe
│   └── scan/
│       └── album.tsx            ← AI photo album scanner
│
├── src/
│   ├── context/
│   │   ├── LanguageContext.tsx  ← Hebrew/English toggle + RTL
│   │   └── RecipeContext.tsx    ← Recipe data + AsyncStorage
│   ├── components/
│   │   ├── RecipeCard.tsx       ← Recipe card component
│   │   └── TagBadge.tsx         ← Tag pills + TagRow
│   ├── hooks/
│   │   └── useAlbumScanner.ts  ← Photo library scanner logic
│   ├── services/
│   │   └── claudeService.ts    ← Claude AI: vision + extraction
│   ├── i18n/
│   │   └── translations.ts     ← All Hebrew + English strings
│   └── theme.ts                 ← Colors, radius, shadows
│
├── package.json
├── app.json
└── babel.config.js
```

---

## Features

### Home
Two main actions: **Add Recipe** and **My Collection** (shows current recipe count).

### Add Recipe (manual)
Full form with:
- Emoji picker (11 food options)
- Title, prep / cook / total time
- Dynamic ingredient rows
- Numbered instruction steps
- Category tags: Italian, Desserts, Salads, Breakfast, Asian, Other
- Dietary tags: Vegan, Vegetarian, Gluten-free, Dairy-free
- Custom tag input

### AI Photo Album Scanner
- Scans up to 200 most recent photos
- Claude Vision classifies each photo: is it a recipe or not?
- Recipes get fully extracted: bilingual title, ingredients, steps, time, difficulty, dietary tags, category, emoji
- Preview all found recipes, select which ones to save
- "Select All" option + floating save button

### Browse Screens
| Screen | What it shows |
|--------|--------------|
| Recent | Recipes by date saved, with relative time and source badge (photo / manual) |
| Categories | 2-column grid of category cards with emoji and count |
| Alphabetical | A–Z (or א–ת) grouped list with sticky headers |
| Search | Real-time search across titles + ingredients, with filter pills (difficulty, dietary, ⚡ <30 min) |

### Bilingual / RTL
- Toggle between Hebrew and English from the top bar on any screen
- RTL layout auto-switches for Hebrew
- All UI strings, placeholders, and tag labels are translated
- Recipes store both a Hebrew and English title + ingredients

---

## Setup

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (search "Expo Go" in the App Store or Google Play)

### Install
```bash
cd the-recipe-keeper
npm install
```

### Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. Open `src/services/claudeService.ts`
3. Replace the placeholder:
```typescript
const API_KEY = 'sk-ant-api03-your-actual-key-here';
```

> Never commit this key. For production, move it to an environment variable or a backend proxy.

### Run
```bash
npx expo start
```
Scan the QR code with your phone camera (iOS) or Expo Go (Android).

---

## Tech Stack

| | |
|--|--|
| Framework | React Native + Expo (expo-router) |
| Language | TypeScript |
| State | Context API (RecipeContext, LanguageContext) |
| Storage | AsyncStorage (on-device, no backend) |
| AI | Anthropic Claude API — claude-sonnet-4-6 vision model |
| Media | expo-media-library, expo-image-picker |

---

## API Cost Estimate

- Classifying one photo (is it a recipe?): ~$0.003
- Full extraction + bilingual translation: ~$0.02 per recipe
- Scanning 200 photos: ~$0.60 total

For casual use (a few new recipes a week): **under $1/month**.

---

## FAQ

**Does it work offline?**
Browsing and editing saved recipes works offline. The AI scanner requires internet.

**What kinds of photos does it recognize?**
Screenshots from recipe websites, cooking apps, Instagram/TikTok, and photos of printed recipe books or cards — anything that shows ingredients and steps as text.

**Is my data private?**
Photos are sent to the Anthropic API only during scanning. All recipe data is stored on your device. There is no cloud sync.
