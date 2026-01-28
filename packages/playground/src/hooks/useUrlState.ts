/**
 * Hook for managing URL state synchronization.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlaygroundStore } from '../store';
import {
  loadStateFromUrl,
  updateUrlState,
  copyShareUrl,
  getExampleIdFromUrl,
  mergeConfigWithDefaults,
} from '../utils/share';

/**
 * Hook that loads state from URL on mount and syncs changes back.
 */
export function useUrlState() {
  const files = usePlaygroundStore((s) => s.files);
  const activeFormatter = usePlaygroundStore((s) => s.activeFormatter);
  const config = usePlaygroundStore((s) => s.config);
  const setFiles = usePlaygroundStore((s) => s.setFiles);
  const setActiveFormatter = usePlaygroundStore((s) => s.setActiveFormatter);
  const setConfig = usePlaygroundStore((s) => s.setConfig);

  const initialLoadRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from URL on mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    // Check for example ID first
    const exampleId = getExampleIdFromUrl();
    if (exampleId) {
      // Example loading is handled by the ExampleGallery component
      return;
    }

    // Load state from URL
    const state = loadStateFromUrl();
    if (state) {
      setFiles(state.files);
      if (state.formatter) {
        setActiveFormatter(state.formatter);
      }
      if (state.config) {
        setConfig(mergeConfigWithDefaults(state.config));
      }
    }
  }, [setFiles, setActiveFormatter, setConfig]);

  // Sync state to URL (debounced)
  useEffect(() => {
    if (!initialLoadRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateUrlState(files, activeFormatter, undefined, config);
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [files, activeFormatter, config]);

  // Share handler
  const handleShare = useCallback(async () => {
    const success = await copyShareUrl(files, activeFormatter, undefined, config);
    return success;
  }, [files, activeFormatter, config]);

  return { handleShare };
}
