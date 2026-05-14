import { useState, useEffect, useCallback } from 'react';

const RECENT_EMOJIS_KEY = 'sociality_recent_emojis';
const MAX_RECENT_EMOJIS = 24;

export const useRecentEmojis = () => {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load recent emojis:', error);
    }
  }, []);

  // Add emoji to recent list
  const addRecentEmoji = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      // Remove emoji if it already exists
      const filtered = prev.filter(e => e !== emoji);
      // Add to beginning
      const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent emojis:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear recent emojis
  const clearRecentEmojis = useCallback(() => {
    setRecentEmojis([]);
    try {
      localStorage.removeItem(RECENT_EMOJIS_KEY);
    } catch (error) {
      console.warn('Failed to clear recent emojis:', error);
    }
  }, []);

  return {
    recentEmojis,
    addRecentEmoji,
    clearRecentEmojis
  };
};
