/**
 * Global styles configuration
 * Contains global style definitions for the application
 * Supports both light and dark modes
 */
export const styles = {
  global: (props: any) => ({
    body: {
      color: props.colorMode === 'dark' ? "white" : "black",
      bg: props.colorMode === 'dark' ? "brand.dark.500" : "brand.light.100",
      margin: 0,
      padding: 0,
      transition: "background-color 0.2s, color 0.2s",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflowX: "hidden",
    },
    html: {
      margin: 0,
      padding: 0,
      overflowX: "hidden",
    },
    // Clean modern typography
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "'Inter', -apple-system, sans-serif",
      letterSpacing: "tight",
    },
    // Modern card and element styling
    ".glass-card, .glass-navbar, .glass-tab, .glass-message-bubble": {
      background: props.colorMode === 'dark' ? "var(--chakra-colors-semantic-bg-secondary)" : "white",
      border: "none !important",
      boxShadow: props.colorMode === 'dark' 
        ? "0 4px 12px rgba(0,0,0,0.3) !important" 
        : "0 4px 12px rgba(0,0,0,0.05) !important",
      borderRadius: "24px",
    },
  }),
};
