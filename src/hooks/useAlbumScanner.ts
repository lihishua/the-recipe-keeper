// src/hooks/useAlbumScanner.ts
import { useState, useCallback, useRef } from 'react';
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
  const cancelledRef = useRef(false);

  const requestPermission = async (): Promise<boolean> => {
    const { status: existing } = await MediaLibrary.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status: requested } = await MediaLibrary.requestPermissionsAsync();
    if (requested !== 'granted') {
      Alert.alert(
        'הרשאה נדרשת',
        '2Spoons צריך גישה לאלבום כדי לסרוק מתכונים. פתח הגדרות כדי לאפשר גישה.',
        [
          { text: 'ביטול', style: 'cancel' },
          { text: 'פתח הגדרות', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const scanAlbum = useCallback(async (albumId?: string, knownUris?: Set<string>) => {
    cancelledRef.current = false;
    setStatus('requesting');
    const ok = await requestPermission();
    if (!ok) { setStatus('error'); return; }

    setStatus('scanning');
    setCandidates([]);
    setProgress(0);

    try {
      const { assets, totalCount } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 200,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        ...(albumId ? { album: albumId } : {}),
      });

      setTotal(Math.min(assets.length, totalCount));
      const found: ScanCandidate[] = [];

      for (let i = 0; i < assets.length; i++) {
        if (cancelledRef.current) { setStatus('done'); return; }
        setProgress(i + 1);
        const asset = assets[i];
        // Skip if this photo was already added as a recipe
        if (knownUris?.has(asset.uri)) continue;
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        const uri = info.localUri ?? info.uri;
        if (knownUris?.has(uri)) continue;
        const isRecipe = await isRecipeImage(uri);
        if (cancelledRef.current) { setStatus('done'); return; }
        if (isRecipe) {
          const extracted = await extractRecipeFromImage(uri);
          found.push({ asset, extracted, isRecipe: true });
          setCandidates([...found]);
        }
      }

      setCandidates(found);
      setStatus('done');
    } catch (e) {
      if (!cancelledRef.current) {
        console.error('Album scan error:', e);
        setStatus('error');
      }
    }
  }, []);

  const cancel = () => {
    cancelledRef.current = true;
    // Keep whatever was found — go to done so the user sees the results
    setStatus('done');
  };

  const reset = () => {
    setStatus('idle');
    setCandidates([]);
    setProgress(0);
    setTotal(0);
  };

  return { status, progress, total, candidates, scanAlbum, cancel, reset } as const;
}
