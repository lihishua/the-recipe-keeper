// src/hooks/useAlbumScanner.ts
import { useState, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';
import { isRecipeImage, extractRecipeFromImage } from '../services/claudeService';
import { Recipe } from '../context/RecipeContext';

export interface ScanCandidate {
  asset: MediaLibrary.Asset;
  extracted: Partial<Recipe> | null;
  isRecipe: boolean;
}

export function useAlbumScanner() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);

  const requestPermission = async (): Promise<boolean> => {
    const { status: existing } = await MediaLibrary.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status: requested } = await MediaLibrary.requestPermissionsAsync();
    if (requested !== 'granted') {
      Alert.alert(
        'הרשאה נדרשת',
        'ניבל צריך גישה לאלבום כדי לסרוק מתכונים. פתח הגדרות כדי לאפשר גישה.',
        [
          { text: 'ביטול', style: 'cancel' },
          { text: 'פתח הגדרות', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const scanAlbum = useCallback(async () => {
    setStatus('requesting');
    const ok = await requestPermission();
    if (!ok) { setStatus('error'); return; }

    setStatus('scanning');
    setCandidates([]);
    setProgress(0);

    try {
      // Get ALL photos from library, newest first
      const { assets, totalCount } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 200, // scan up to 200 most recent photos
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      setTotal(Math.min(assets.length, totalCount));
      const found: ScanCandidate[] = [];

      for (let i = 0; i < assets.length; i++) {
        setProgress(i + 1);
        const asset = assets[i];

        // Get local URI
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        const uri = info.localUri ?? info.uri;

        // Quick detection first
        const isRecipe = await isRecipeImage(uri);

        if (isRecipe) {
          // Full extraction
          const extracted = await extractRecipeFromImage(uri);
          found.push({ asset, extracted, isRecipe: true });
          setCandidates([...found]);
        }
      }

      setCandidates(found);
      setStatus('done');
    } catch (e) {
      console.error('Album scan error:', e);
      setStatus('error');
    }
  }, []);

  const reset = () => {
    setStatus('idle');
    setCandidates([]);
    setProgress(0);
    setTotal(0);
  };

  return { status, progress, total, candidates, scanAlbum, reset };
}
