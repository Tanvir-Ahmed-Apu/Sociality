/**
 * Theme management hook
 * Provides theme switching functionality with persistence and Chakra UI integration
 */
import { useEffect, useCallback, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { useColorMode } from '@chakra-ui/react';
import { themeAtom } from '../atoms';
import { STORAGE_KEYS } from '../utils/constants';
import { applyThemeToDocument } from '../utils/themeUtils';

const useTheme = () => {
  const [theme, setTheme] = useRecoilState(themeAtom);
  const { colorMode, setColorMode } = useColorMode();
  const initialized = useRef(false);

  // Initialize theme from localStorage on mount (only once)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    
    // Type guard for theme values
    const isValidTheme = (t: string | null): t is 'light' | 'dark' | 'system' => 
      t === 'light' || t === 'dark' || t === 'system';

    // Migration: Check old Chakra UI key if new key doesn't exist
    if (!savedTheme) {
      const oldTheme = localStorage.getItem('chakra-ui-color-mode');
      if (isValidTheme(oldTheme)) {
        savedTheme = oldTheme;
        localStorage.setItem(STORAGE_KEYS.THEME, savedTheme);
        localStorage.removeItem('chakra-ui-color-mode'); // Clean up old key
      }
    }

    if (isValidTheme(savedTheme)) {
      setTheme(savedTheme);
      setColorMode(savedTheme);
    } else {
      // Default to system mode
      setTheme('system');
      setColorMode('system');
      localStorage.setItem(STORAGE_KEYS.THEME, 'system');
    }
  }, []); // Empty dependency array to run only once

  // Sync theme changes with Chakra UI, document, and localStorage
  useEffect(() => {
    if (!initialized.current) return; // Don't sync until initialized

    // Small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      // Apply theme to document (handles 'system' internally now)
      applyThemeToDocument(theme);
      
      // Update Chakra color mode
      if (theme !== colorMode) {
        setColorMode(theme);
      }
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [theme, colorMode, setColorMode]);

  // Set specific theme
  const setSpecificTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  }, [setTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyThemeToDocument('system');
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy API
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  // Toggle between light and dark themes (manual override)
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Check if current theme is dark
  const isDark = theme === 'dark';

  // Check if current theme is light
  const isLight = theme === 'light';

  return {
    theme,
    isDark,
    isLight,
    toggleTheme,
    setTheme: setSpecificTheme,
  };
};

export default useTheme;
