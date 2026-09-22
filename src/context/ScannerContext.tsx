// src/context/ScannerContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';
import { isRecipeImage, extractRecipeFromImage, extractRecipeFromImages } from '../services/claudeService';
import { Recipe } from './RecipeContext';

export interface ScanCandidate {
  asset: MediaLibrary.Asset;
  resolvedUri: string;       // file:// URI — safe to use as image source
  assets?: MediaLibrary.Asset[];
  isSeries?: boolean;
  extracted: Partial<Recipe> | null;
  isRecipe: boolean;
}

interface ScannerContextType {
  status: 'idle' | 'requesting' | 'scanning' | 'done' | 'error';
  progress: number;
  total: number;
  candidates: ScanCandidate[];
  scanAlbum: (options: { albumId?: string; knownUris?: Set<string>; limit: number }) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const ScannerContext = createContext<ScannerContextType>({
  status: 'idle',
  progress: 0,
  total: 0,
  candidates: [],
  scanAlbum: async () => {},
  cancel: () => {},
  reset: () => {},
});

export function ScannerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ScannerContextType['status']>('idle');
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

  const scanAlbum = useCallback(async ({
    albumId,
    knownUris,
    limit,
  }: { albumId?: string; knownUris?: Set<string>; limit: number }) => {
    cancelledRef.current = false;
    setStatus('requesting');
    const ok = await requestPermission();
    if (!ok) { setStatus('error'); return; }

    setStatus('scanning');
    setCandidates([]);
    setProgress(0);

    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: limit,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        ...(albumId ? { album: albumId } : {}),
      });

      // Group consecutive assets taken within 3 minutes AND same dimensions
      const SERIES_GAP_MS = 3 * 60_000;
      const DIM_TOLERANCE = 5;
      const groups: MediaLibrary.Asset[][] = [];
      let currentGroup: MediaLibrary.Asset[] = [];
      for (const asset of assets) {
        if (currentGroup.length === 0) {
          currentGroup.push(asset);
        } else {
          const first = currentGroup[0];
          const last = currentGroup[currentGroup.length - 1];
          const timeClose = Math.abs(last.creationTime - asset.creationTime) <= SERIES_GAP_MS;
          const sameDims =
            Math.abs((first.width ?? 0) - (asset.width ?? 0)) <= DIM_TOLERANCE &&
            Math.abs((first.height ?? 0) - (asset.height ?? 0)) <= DIM_TOLERANCE;
          if (timeClose && sameDims) {
            currentGroup.push(asset);
          } else {
            groups.push([...currentGroup]);
            currentGroup = [asset];
          }
        }
      }
      if (currentGroup.length > 0) groups.push([...currentGroup]);

      setTotal(groups.length);
      const found: ScanCandidate[] = [];
      // Track resolved URIs already added — avoids adding duplicate photos
      // (same image saved multiple times shows up as separate assets)
      const foundUris = new Set<string>();

      for (let i = 0; i < groups.length; i++) {
        if (cancelledRef.current) { setStatus('done'); return; }
        setProgress(i + 1);

        const group = groups[i];
        const infos = await Promise.all(group.map(a => MediaLibrary.getAssetInfoAsync(a)));

        // Only keep assets with a local file:// URI. ph:// URIs are iCloud-only
        // photos not downloaded to the device — React Native can't render them.
        const localPairs = group
          .map((asset, idx) => ({ asset, uri: infos[idx].localUri }))
          .filter((p): p is { asset: MediaLibrary.Asset; uri: string } => !!p.uri);

        if (localPairs.length === 0) continue;

        const validAssets = localPairs.map(p => p.asset);
        const uris = localPairs.map(p => p.uri);

        const allKnown = knownUris && uris.every((uri, idx) =>
          knownUris.has(uri) || knownUris.has(localPairs[idx].asset.uri)
        );
        if (allKnown) continue;

        // Skip if we already found these images in this scan session.
        // Use URI + asset fingerprint (filename+creationTime) for robust dedup
        // since the same photo saved multiple times may have different localUris.
        const fingerprints = localPairs.map(p => `${p.asset.filename}|${p.asset.creationTime}`);
        if (uris.every(u => foundUris.has(u)) || fingerprints.every(f => foundUris.has(f))) continue;

        if (validAssets.length >= 2) {
          const isRecipe = await isRecipeImage(uris[0]);
          if (cancelledRef.current) { setStatus('done'); return; }
          if (isRecipe) {
            const result = await extractRecipeFromImages(uris);
            if (result) {
              const coverIdx = Math.min(result.coverImageIndex, validAssets.length - 1);
              uris.forEach(u => foundUris.add(u));
              fingerprints.forEach(f => foundUris.add(f));
              found.push({
                asset: validAssets[coverIdx],
                resolvedUri: uris[coverIdx],
                assets: validAssets,
                isSeries: true,
                extracted: result.recipe,
                isRecipe: true,
              });
              setCandidates([...found]);
            }
          }
        } else {
          const asset = validAssets[0];
          const uri = uris[0];
          if (knownUris?.has(asset.uri) || knownUris?.has(uri)) continue;
          const isRecipe = await isRecipeImage(uri);
          if (cancelledRef.current) { setStatus('done'); return; }
          if (isRecipe) {
            const extracted = await extractRecipeFromImage(uri);
            foundUris.add(uri);
            foundUris.add(fingerprints[0]);
            found.push({ asset, resolvedUri: uri, extracted, isRecipe: true });
            setCandidates([...found]);
          }
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
    setStatus('done');
  };

  const reset = () => {
    setStatus('idle');
    setCandidates([]);
    setProgress(0);
    setTotal(0);
  };

  return (
    <ScannerContext.Provider value={{ status, progress, total, candidates, scanAlbum, cancel, reset }}>
      {children}
    </ScannerContext.Provider>
  );
}

export function useScannerContext() {
  return useContext(ScannerContext);
}
