// src/services/claudeService.ts
import * as FileSystem from 'expo-file-system/legacy';
import { Recipe, RecipeTags, Category, Difficulty } from '../context/RecipeContext';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
// ⚠️  IMPORTANT: Replace with your real Anthropic API key
// Get one at: https://console.anthropic.com
const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

/**
 * Converts a local image URI to base64 and detects its MIME type.
 */
async function imageToBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });
  const lower = uri.toLowerCase();
  const mediaType =
    lower.includes('.png')  ? 'image/png'  :
    lower.includes('.webp') ? 'image/webp' :
    lower.includes('.gif')  ? 'image/gif'  :
    'image/jpeg'; // default for .jpg, .jpeg, .heic, and anything else
  return { base64, mediaType };
}

/**
 * Detects whether an image looks like a recipe using Claude vision.
 * Returns true/false quickly.
 */
export async function isRecipeImage(imageUri: string): Promise<boolean> {
  try {
    const { base64, mediaType } = await imageToBase64(imageUri);
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Does this image contain a recipe (list of ingredients and cooking instructions)? Reply only: YES or NO' },
          ],
        }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim().toUpperCase();
    return text?.startsWith('YES');
  } catch {
    return false;
  }
}

/**
 * Extracts a full structured recipe from an image.
 * Returns both Hebrew and English versions of title, ingredients, steps.
 * Also extracts tags automatically.
 */
export async function extractRecipeFromImage(
  imageUri: string,
  precomputed?: { base64: string; mediaType: string },
): Promise<Partial<Recipe> | null> {
  try {
    const { base64, mediaType } = precomputed ?? await imageToBase64(imageUri);

    const prompt = `You are a recipe extraction assistant. Extract the recipe from this image and return ONLY valid JSON (no markdown, no backticks).

Return this exact structure:
{
  "titleHe": "recipe title in Hebrew",
  "titleEn": "recipe title in English",
  "ingredientsHe": ["ingredient 1 in Hebrew", "ingredient 2 in Hebrew"],
  "ingredientsEn": ["ingredient 1 in English", "ingredient 2 in English"],
  "stepsHe": ["step 1 in Hebrew", "step 2 in Hebrew"],
  "stepsEn": ["step 1 in English", "step 2 in English"],
  "tags": {
    "prepTime": <number in minutes or null>,
    "cookTime": <number in minutes or null>,
    "totalTime": <number in minutes or null>,
    "difficulty": "easy" | "medium" | "hard",
    "vegan": true | false,
    "vegetarian": true | false,
    "glutenFree": true | false,
    "dairyFree": true | false
  },
  "category": "italian" | "desserts" | "salads" | "breakfast" | "asian" | "other",
  "emoji": "<single food emoji that best represents this recipe>"
}

Translate ALL text to both Hebrew and English regardless of the original language.
Be accurate with ingredients (quantities and units) and steps (numbered order).
For tags: detect from context if not explicit (e.g. if no meat/fish → vegetarian/vegan candidate).`;

    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error('Claude API error:', JSON.stringify(data.error));
      throw new Error(data.error?.message ?? 'API error');
    }
    const raw = data?.content?.[0]?.text?.trim();
    console.log('Claude raw response:', raw?.slice(0, 200));
    if (!raw) return null;

    // Strip possible markdown code fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      titleHe: parsed.titleHe,
      titleEn: parsed.titleEn,
      title: parsed.titleHe, // default to Hebrew
      ingredientsHe: parsed.ingredientsHe,
      ingredientsEn: parsed.ingredientsEn,
      ingredients: parsed.ingredientsHe,
      stepsHe: parsed.stepsHe,
      stepsEn: parsed.stepsEn,
      steps: parsed.stepsHe,
      tags: parsed.tags as RecipeTags,
      category: parsed.category as Category,
      emoji: parsed.emoji ?? '🍽',
    };
  } catch (e: any) {
    console.error('extractRecipeFromImage error:', e);
    // Re-throw with a message the UI can show
    throw new Error(e?.message ?? 'Unknown error');
  }
}

/**
 * Extracts recipe metadata from a video URL (title, platform).
 */
export async function extractVideoMeta(url: string): Promise<{ title: string; platform: string }> {
  let platform = 'Web';
  if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'YouTube';
  else if (url.includes('tiktok.com')) platform = 'TikTok';
  else if (url.includes('instagram.com')) platform = 'Instagram';
  else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'X / Twitter';
  else if (url.includes('facebook.com')) platform = 'Facebook';

  return { title: 'סרטון מתכון', platform };
}
