// src/services/draftStore.ts
// Holds a pending extracted recipe between the home screen and the add/review screen.
import { Recipe } from '../context/RecipeContext';

export type RecipeConfidence = {
  title?: number;
  ingredients?: number[];
  steps?: number[];
};

export type RecipeDraft = {
  recipe: Partial<Recipe>;
  confidence: RecipeConfidence;
};

let _draft: RecipeDraft | null = null;

export const draftStore = {
  set: (d: RecipeDraft) => { _draft = d; },
  get: (): RecipeDraft | null => _draft,
  clear: () => { _draft = null; },
};
