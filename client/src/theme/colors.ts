/**
 * Application color palette
 * Contains all color definitions used throughout the application
 * Supports both light and dark modes
 */
export const colors = {
  gray: {
    light: "#616161",
    dark: "#1e1e1e",
  },
  brand: {
    primary: {
      100: "#e6f7ef",
      200: "#b3e6cf",
      300: "#80d5b0",
      400: "#00B374", // Requested main color
      500: "#00B374", // Main brand green
      600: "#008f5d",
      700: "#006b46",
      800: "#00472e",
      900: "#002417",
    },
    secondary: {
      100: "#ffccd9", // Light tint
      200: "#ff99b3",
      300: "#ff668c",
      400: "#ff4d7a",
      500: "#FF3366", // Main comic red
      600: "#cc2952",
      700: "#991f3d", 
      800: "#661429",
      900: "#330a14",
    },
    accent: {
      100: "#ccf5ff",
      200: "#99ebff",
      300: "#66e0ff",
      400: "#4ddbff",
      500: "#33CCFF", // Main action blue
      600: "#29a3cc",
      700: "#1f7a99",
      800: "#145266",
      900: "#0a2933",
    },
    dark: {
      100: "#1a1a1a",
      200: "#171717",
      300: "#141414",
      400: "#121212",
      500: "#000000", // Pure black for comic dark mode background
      600: "#0d0d0d",
      700: "#0a0a0a",
      800: "#080808",
      900: "#050505",
    },
    light: {
      100: "#ffffff", // Pure white for comic light mode background
      200: "#f7fafc", 
      300: "#edf2f7", 
      400: "#e2e8f0", 
      500: "#cbd5e0", 
      600: "#a0aec0", 
      700: "#718096", 
      800: "#4a5568", 
      900: "#2d3748", 
    },
  },
  // Theme-specific semantic colors
  semantic: {
    bg: {
      primary: {
        light: "#ffffff", // Pure white
        dark: "#000000", // Pure black
      },
      secondary: {
        light: "#ffffff", // Pure white for comic boxes
        dark: "#121212", // Slightly lighter for contrast
      },
      card: {
        light: "#ffffff",
        dark: "#0a0a0a",
      },
      hover: {
        light: "#fff5cc", // subtle yellow hover
        dark: "#1a1a1a",
      },
    },
    text: {
      primary: {
        light: "#000000",
        dark: "#ffffff",
      },
      secondary: {
        light: "#1a1a1a",
        dark: "#e2e8f0",
      },
      muted: {
        light: "#4a5568",
        dark: "#a0aec0",
      },
    },
    border: {
      primary: {
        light: "#000000", // Solid black borders for light mode
        dark: "#ffffff",  // Solid white borders for dark mode
      },
      hover: {
        light: "#000000",
        dark: "#ffffff",
      },
    },
  },
};

