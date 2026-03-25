// src/services/claudeService.ts
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Recipe, RecipeTags, Category, Difficulty } from '../context/RecipeContext';
import { ANTHROPIC_API_KEY } from './secrets';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const API_KEY = ANTHROPIC_API_KEY;

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/**
 * Resizes and compresses an image so it stays under the 5 MB API limit.
 * Returns a JPEG URI at ≤1600px on the long edge, quality 0.7.
 */
async function compressImage(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1600 });
  const ref = await ctx.renderAsync();
  const result = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  ctx.release();
  ref.release();
  return result.uri;
}

/**
 * Converts a local image URI to base64 and detects its MIME type.
 */
async function imageToBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  const compressed = await compressImage(uri);
  const base64 = await FileSystem.readAsStringAsync(compressed, {
    encoding: 'base64' as any,
  });
  return { base64, mediaType: 'image/jpeg' };
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
    "bakeTime": <number in minutes or null>,
    "riseTime": <number in minutes or null>,
    "difficulty": "easy" | "medium" | "hard",
    "vegan": true | false,
    "vegetarian": true | false,
    "glutenFree": true | false,
    "dairyFree": true | false
  },
  "category": "italian" | "desserts" | "salads" | "breakfast" | "asian" | "other",
  "emoji": "<single food emoji that best represents this recipe>",
  "confidence": {
    "title": <0.0-1.0 — how clearly you could read the title>,
    "ingredients": [<0.0-1.0 per ingredient, same order as ingredientsHe>],
    "steps": [<0.0-1.0 per step, same order as stepsHe>]
  }
}

Confidence guide: 1.0 = clearly visible text, 0.7-0.9 = mostly clear with minor uncertainty, 0.5-0.7 = guessed from context, <0.5 = inferred/invented.
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
        system: 'You are a recipe extraction assistant. You ONLY output valid JSON. No explanations, no markdown, no code fences — raw JSON only.',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const rawError = await res.text();
      console.error('Claude API HTTP error:', res.status, rawError);
      throw new Error(`API ${res.status}: ${rawError.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.error) {
      console.error('Claude API error:', JSON.stringify(data.error));
      throw new Error(data.error?.message ?? 'API error');
    }
    const raw = data?.content?.[0]?.text?.trim();
    console.log('Claude raw response:', raw?.slice(0, 200));
    if (!raw) return null;

    // Extract JSON robustly: find outermost { ... }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(raw.slice(start, end + 1));

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
      confidence: parsed.confidence,
    } as Partial<Recipe> & { confidence?: any };
  } catch (e: any) {
    console.error('extractRecipeFromImage error:', e);
    // Re-throw with a message the UI can show
    throw new Error(e?.message ?? 'Unknown error');
  }
}

/**
 * Extracts a recipe from multiple images (e.g. a recipe spread across several screenshots).
 * Sends all images in one Claude call and asks it to combine them into a single recipe.
 */
export async function extractRecipeFromImages(
  imageUris: string[],
): Promise<Partial<Recipe> | null> {
  try {
    const images = await Promise.all(imageUris.map(uri => imageToBase64(uri)));

    const imageBlocks = images.map(({ base64, mediaType }) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: mediaType, data: base64 },
    }));

    const prompt = `You are a recipe extraction assistant. The user has provided ${images.length} images that together contain a single recipe (e.g. spread across multiple screenshots). Extract and combine all parts into one complete recipe and return ONLY valid JSON (no markdown, no backticks).

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
    "bakeTime": <number in minutes or null>,
    "riseTime": <number in minutes or null>,
    "difficulty": "easy" | "medium" | "hard",
    "vegan": true | false,
    "vegetarian": true | false,
    "glutenFree": true | false,
    "dairyFree": true | false
  },
  "category": "italian" | "desserts" | "salads" | "breakfast" | "asian" | "other",
  "emoji": "<single food emoji that best represents this recipe>"
}

Translate ALL text to both Hebrew and English. Combine content from all images — do not duplicate ingredients or steps that appear in more than one image.`;

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
        system: 'You are a recipe extraction assistant. You ONLY output valid JSON. No explanations, no markdown, no code fences — raw JSON only.',
        messages: [{
          role: 'user',
          content: [...imageBlocks, { type: 'text', text: prompt }],
        }],
      }),
    });

    if (!res.ok) {
      const rawError = await res.text();
      throw new Error(`API ${res.status}: ${rawError.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error?.message ?? 'API error');

    const raw = data?.content?.[0]?.text?.trim();
    if (!raw) return null;

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(raw.slice(start, end + 1));

    return {
      titleHe: parsed.titleHe,
      titleEn: parsed.titleEn,
      title: parsed.titleHe,
      ingredientsHe: parsed.ingredientsHe,
      ingredientsEn: parsed.ingredientsEn,
      ingredients: parsed.ingredientsHe,
      stepsHe: parsed.stepsHe,
      stepsEn: parsed.stepsEn,
      steps: parsed.stepsHe,
      tags: parsed.tags as RecipeTags,
      category: parsed.category as Category,
      emoji: parsed.emoji ?? '🍽',
    } as Partial<Recipe>;
  } catch (e: any) {
    console.error('extractRecipeFromImages error:', e);
    throw new Error(e?.message ?? 'Unknown error');
  }
}

/**
 * Extracts a full structured recipe from a web/social link.
 * Fetches the page HTML, pulls og:image as the dish photo, then
 * sends the page text to Claude for recipe extraction.
 */
export async function extractRecipeFromUrl(
  url: string,
): Promise<{ recipe: Partial<Recipe>; imageUrl?: string } | null> {
  // Fetch the HTML with a 10-second timeout
  let html = '';
  let imageUrl: string | undefined;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 2SpooonsBot/1.0)' },
    });
    clearTimeout(timer);
    html = await resp.text();

    // Extract og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) imageUrl = ogMatch[1];
  } catch {
    // If fetch fails, proceed with empty HTML so Claude still receives the URL context
  }

  // Extract og:title and og:description — critical for Instagram/TikTok where the
  // caption (recipe) lives in meta tags, not in the JS-rendered body.
  const extractMeta = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
      ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'));
    return m?.[1] ? decodeHTMLEntities(m[1]) : '';
  };
  const ogTitle = extractMeta('og:title');
  const ogDescription = extractMeta('og:description');

  // Limit HTML size to keep tokens reasonable
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8000);

  const metaSection = [
    ogTitle       && `Page title: ${ogTitle}`,
    ogDescription && `Page caption/description:\n${ogDescription}`,
  ].filter(Boolean).join('\n\n');

  const prompt = `You are a recipe extraction assistant. The user provided this URL: ${url}
${metaSection ? `\n${metaSection}\n` : ''}
Here is the page body text (truncated):
---
${bodyText || '(could not fetch page content)'}
---

Extract the recipe from the content above and return ONLY valid JSON (no markdown, no backticks).

Return this exact structure:
{
  "titleHe": "recipe title in Hebrew",
  "titleEn": "recipe title in English",
  "ingredientsHe": ["ingredient 1 in Hebrew"],
  "ingredientsEn": ["ingredient 1 in English"],
  "stepsHe": ["step 1 in Hebrew"],
  "stepsEn": ["step 1 in English"],
  "tags": {
    "prepTime": <number in minutes or null>,
    "cookTime": <number in minutes or null>,
    "bakeTime": <number in minutes or null>,
    "riseTime": <number in minutes or null>,
    "difficulty": "easy" | "medium" | "hard",
    "vegan": true | false,
    "vegetarian": true | false,
    "glutenFree": true | false,
    "dairyFree": true | false
  },
  "category": "italian" | "desserts" | "salads" | "breakfast" | "asian" | "other",
  "emoji": "<single food emoji>"
}

Translate ALL text to both Hebrew and English.
If no recipe is found in the content, return: {"error": "no recipe found"}`;

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
      system: 'You are a recipe extraction assistant. You ONLY output valid JSON. No explanations, no markdown, no code fences — raw JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`API ${res.status}: ${raw.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error?.message ?? 'API error');

  const raw = data?.content?.[0]?.text?.trim();
  if (!raw) return null;

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (parsed.error) return null;

  return {
    recipe: {
      titleHe: parsed.titleHe,
      titleEn: parsed.titleEn,
      title: parsed.titleHe,
      ingredientsHe: parsed.ingredientsHe,
      ingredientsEn: parsed.ingredientsEn,
      ingredients: parsed.ingredientsHe,
      stepsHe: parsed.stepsHe,
      stepsEn: parsed.stepsEn,
      steps: parsed.stepsHe,
      tags: parsed.tags as RecipeTags,
      category: parsed.category as Category,
      emoji: parsed.emoji ?? '🍽',
    },
    imageUrl,
  };
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
