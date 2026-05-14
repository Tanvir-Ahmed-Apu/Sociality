import { ComponentStyleConfig } from "@chakra-ui/theme";

export const Menu: ComponentStyleConfig = {
  baseStyle: (props) => ({
    list: {
      border: `3px solid ${props.colorMode === "dark" ? "white" : "black"}`,
      borderRadius: "12px",
      boxShadow: props.colorMode === "dark"
        ? "6px 6px 0px rgba(255,255,255,0.2)"
        : "6px 6px 0px black",
      bg: props.colorMode === "dark" ? "brand.dark.500" : "white",
    },
    item: {
      bg: "transparent",
      fontWeight: "bold",
      _hover: {
        bg: props.colorMode === "dark" ? "whiteAlpha.200" : "blackAlpha.100",
      },
      _focus: {
        bg: props.colorMode === "dark" ? "whiteAlpha.200" : "blackAlpha.100",
      },
    },
  }),
};
