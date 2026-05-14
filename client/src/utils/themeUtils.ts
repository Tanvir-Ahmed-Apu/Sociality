/**
 * Theme utility functions
 * Handles applying theme classes to the document root
 */

/**
 * Apply theme to document root
 * @param {string} theme - 'light' or 'dark'
 */
export const applyThemeToDocument = (theme: string) => {
  const root = document.documentElement;
  
  let actualTheme = theme;
  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (actualTheme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
  }
};

/**
 * Get current theme from document
 * @returns {string} - 'light' or 'dark'
 */
export const getCurrentThemeFromDocument = () => {
  const root = document.documentElement;
  return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
};
