/**
 * Main theme configuration
 * Exports the complete theme configuration for the application
 */
import { extendTheme } from "@chakra-ui/theme-utils";
import { config } from "./config";
import { styles } from "./styles";
import { colors } from "./colors";
import { components } from "./components";

// Custom breakpoints for mobile-first responsive design
const breakpoints = {
  base: "0px",    // 0px and up (all devices)
  xs: "320px",    // Small mobile devices (iPhone SE, etc.)
  sm: "375px",    // Standard mobile devices (iPhone 12, etc.)
  md: "414px",    // Large mobile devices (iPhone 12 Pro Max, etc.)
  lg: "480px",    // Small tablets / large mobile landscape
  xl: "768px",    // Tablets and small desktops
  "2xl": "1024px", // Desktops
  "3xl": "1440px", // Large desktops
};

// Create and export the theme
const theme = extendTheme({
  config,
  styles,
  colors,
  breakpoints,
  components
});

export default theme;
