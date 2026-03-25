// src/context/RecipeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Category = 'italian' | 'desserts' | 'salads' | 'breakfast' | 'asian' | 'other';

export interface RecipeTags {
  prepTime?: number;     // minutes
  cookTime?: number;     // minutes
  bakeTime?: number;     // minutes (baking)
  riseTime?: number;     // minutes (dough rising)
  totalTime?: number;    // minutes (legacy / manual override)
  difficulty?: Difficulty;
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
}

/** Returns the sum of all time components as the displayed total */
export function computeTotalTime(tags: RecipeTags): number {
  const sum = (tags.prepTime ?? 0) + (tags.cookTime ?? 0) + (tags.bakeTime ?? 0) + (tags.riseTime ?? 0);
  return sum > 0 ? sum : (tags.totalTime ?? 0);
}

export interface Recipe {
  id: string;
  title: string;
  titleHe?: string;      // Hebrew translation (always stored)
  titleEn?: string;      // English translation (always stored)
  ingredients: string[];
  ingredientsHe?: string[];
  ingredientsEn?: string[];
  steps: string[];
  stepsHe?: string[];
  stepsEn?: string[];
  tags: RecipeTags;
  category: Category;
  emoji: string;
  sourceType: 'photo' | 'screenshot' | 'video' | 'manual' | 'link';
  sourceUri?: string;    // local or remote image path
  sourceUrl?: string;    // original web/social link
  videoUrl?: string;
  videoPlatform?: string;
  createdAt: number;     // timestamp
  notes?: string;
  customTags?: string[]; // free-text tags added by the user
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (r: Recipe) => Promise<void>;
  updateRecipe: (r: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
}

const RecipeContext = createContext<RecipeContextType>({
  recipes: [],
  addRecipe: async () => {},
  updateRecipe: async () => {},
  deleteRecipe: async () => {},
  getRecipeById: () => undefined,
});

const STORAGE_KEY = '2spoons_recipes';

// Demo recipes
const DEMO: Recipe[] = [
  {
    id: 'demo1',
    title: 'קרבונרה קרמית',
    titleHe: 'קרבונרה קרמית',
    titleEn: 'Creamy Carbonara',
    ingredients: ['200 גרם ספגטי', '100 גרם פנצ׳טה', '2 חלמונים', '50 גרם פקורינו', 'פלפל שחור', 'מלח'],
    ingredientsHe: ['200 גרם ספגטי', '100 גרם פנצ׳טה', '2 חלמונים', '50 גרם פקורינו', 'פלפל שחור', 'מלח'],
    ingredientsEn: ['200g spaghetti', '100g pancetta', '2 egg yolks', '50g pecorino', 'Black pepper', 'Salt'],
    steps: ['בשלו ספגטי במים מומלחים עד אל דנטה.', 'טגנו פנצ׳טה עד פריכות. הסירו מהאש.', 'ערבבו חלמונים עם פקורינו מגורד.', 'ערבבו את הפסטה הלוהטת עם הפנצ׳טה.', 'הוסיפו תערובת החלמון וערבבו מהר. הוסיפו מי פסטה.', 'הגישו עם גבינה נוספת ופלפל שחור.'],
    stepsHe: ['בשלו ספגטי במים מומלחים עד אל דנטה.', 'טגנו פנצ׳טה עד פריכות. הסירו מהאש.', 'ערבבו חלמונים עם פקורינו מגורד.', 'ערבבו את הפסטה הלוהטת עם הפנצ׳טה.', 'הוסיפו תערובת החלמון וערבבו מהר. הוסיפו מי פסטה.', 'הגישו עם גבינה נוספת ופלפל שחור.'],
    stepsEn: ['Boil spaghetti in salted water until al dente.', 'Fry pancetta until crispy. Remove from heat.', 'Whisk egg yolks with grated pecorino.', 'Toss hot pasta with pancetta off heat.', 'Add egg mix and toss quickly. Add pasta water.', 'Serve with extra cheese and black pepper.'],
    tags: { prepTime: 10, cookTime: 15, totalTime: 25, difficulty: 'easy' },
    category: 'italian',
    emoji: '🍝',
    sourceType: 'screenshot',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo2',
    title: 'עוגת ריקוטה לימון',
    titleHe: 'עוגת ריקוטה לימון',
    titleEn: 'Lemon Ricotta Cake',
    ingredients: ['250 גרם ריקוטה', '2 לימונים (גרידה ומיץ)', '3 ביצים', '150 גרם סוכר', '120 גרם קמח', '1 כפית אבקת אפייה', 'קמצוץ מלח'],
    ingredientsHe: ['250 גרם ריקוטה', '2 לימונים (גרידה ומיץ)', '3 ביצים', '150 גרם סוכר', '120 גרם קמח', '1 כפית אבקת אפייה', 'קמצוץ מלח'],
    ingredientsEn: ['250g ricotta', '2 lemons (zest + juice)', '3 eggs', '150g sugar', '120g flour', '1 tsp baking powder', 'Pinch of salt'],
    steps: ['חממו תנור ל-180°C. שמנו תבנית עגולה.', 'טרפו ביצים וסוכר עד שמתקבל תערובת בהירה.', 'קפלו את הריקוטה, גרידת הלימון והמיץ.', 'הוסיפו קמח, אבקת אפייה ומלח.', 'שפכו לתבנית ואפו 40-45 דקות.', 'הניחו להתקרר לפני החיתוך. פזרו אבקת סוכר.'],
    stepsHe: ['חממו תנור ל-180°C. שמנו תבנית עגולה.', 'טרפו ביצים וסוכר עד שמתקבל תערובת בהירה.', 'קפלו את הריקוטה, גרידת הלימון והמיץ.', 'הוסיפו קמח, אבקת אפייה ומלח.', 'שפכו לתבנית ואפו 40-45 דקות.', 'הניחו להתקרר לפני החיתוך. פזרו אבקת סוכר.'],
    stepsEn: ['Preheat oven to 180°C. Grease a round pan.', 'Beat eggs and sugar until pale and fluffy.', 'Fold in ricotta, lemon zest and juice.', 'Sift in flour, baking powder, and salt.', 'Pour into pan and bake 40-45 minutes.', 'Cool before slicing. Dust with icing sugar.'],
    tags: { prepTime: 15, cookTime: 45, totalTime: 60, difficulty: 'easy', vegetarian: true },
    category: 'desserts',
    emoji: '🍰',
    sourceType: 'photo',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo3',
    title: 'סלט יווני קיץ',
    titleHe: 'סלט יווני קיץ',
    titleEn: 'Greek Summer Salad',
    ingredients: ['2 עגבניות', '1 מלפפון', 'זיתי קלמטה', '200 גרם גבינת פטה', 'בצל סגול', 'שמן זית', 'אורגנו יבש'],
    ingredientsHe: ['2 עגבניות', '1 מלפפון', 'זיתי קלמטה', '200 גרם גבינת פטה', 'בצל סגול', 'שמן זית', 'אורגנו יבש'],
    ingredientsEn: ['2 tomatoes', '1 cucumber', 'Kalamata olives', '200g feta cheese', 'Red onion', 'Olive oil', 'Dried oregano'],
    steps: ['חתכו עגבניות ומלפפון לקוביות.', 'פרסו דק את הבצל הסגול.', 'ערבבו את הירקות והזיתים בקערה.', 'פזרו פטה מפורר ואורגנו.', 'הוסיפו שמן זית בנדיבות והגישו.'],
    stepsHe: ['חתכו עגבניות ומלפפון לקוביות.', 'פרסו דק את הבצל הסגול.', 'ערבבו את הירקות והזיתים בקערה.', 'פזרו פטה מפורר ואורגנו.', 'הוסיפו שמן זית בנדיבות והגישו.'],
    stepsEn: ['Chop tomatoes and cucumber into chunks.', 'Thinly slice the red onion.', 'Combine veggies and olives in a bowl.', 'Top with crumbled feta and oregano.', 'Drizzle with olive oil and serve.'],
    tags: { prepTime: 10, totalTime: 10, difficulty: 'easy', vegetarian: true, glutenFree: true },
    category: 'salads',
    emoji: '🥗',
    sourceType: 'screenshot',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(DEMO);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        const saved = JSON.parse(json);
        if (saved.length > 0) setRecipes(saved);
      }
    });
  }, []);

  const persist = async (list: Recipe[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addRecipe = async (r: Recipe) => {
    const next = [r, ...recipes];
    setRecipes(next);
    await persist(next);
  };

  const updateRecipe = async (r: Recipe) => {
    const next = recipes.map((x) => (x.id === r.id ? r : x));
    setRecipes(next);
    await persist(next);
  };

  const deleteRecipe = async (id: string) => {
    const next = recipes.filter((x) => x.id !== id);
    setRecipes(next);
    await persist(next);
  };

  const getRecipeById = (id: string) => recipes.find((x) => x.id === id);

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeById }}>
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipeContext);
