/**
 * Theme configuration
 * Contains theme-specific settings like color mode
 * Supports both light and dark modes with user preference
 */
export const config = {
  initialColorMode: "system", // Follow the visitor's system preference on first load
  useSystemColorMode: true, // Allow system preference to be used when 'system' mode is selected
  disableTransitionOnChange: false, // Allow smooth transitions
};
