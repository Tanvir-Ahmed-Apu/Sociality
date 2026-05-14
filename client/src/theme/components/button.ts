import { ComponentStyleConfig } from "@chakra-ui/theme";

export const Button: ComponentStyleConfig = {
  baseStyle: (props) => ({
    fontWeight: "bold",
    borderRadius: "full",
    transition: "all 0.2s",
    boxShadow: "none",
    _active: {
      transform: "scale(0.98)",
    },
  }),
  variants: {
    solid: (props) => ({
      bg: props.colorMode === "dark" ? "brand.primary.500" : "brand.primary.500",
      color: "black",
      _hover: {
        bg: props.colorMode === "dark" ? "brand.primary.400" : "brand.primary.400",
      },
    }),
    outline: (props) => ({
      bg: "transparent",
      color: props.colorMode === "dark" ? "white" : "black",
      _hover: {
        bg: props.colorMode === "dark" ? "whiteAlpha.200" : "blackAlpha.100",
      },
    }),
    ghost: (props) => ({
      bg: "transparent",
      boxShadow: "none",
      _hover: {
        bg: props.colorMode === "dark" ? "whiteAlpha.200" : "blackAlpha.100",
      },
    }),
    comic: (props) => ({
      bg: "brand.primary.500",
      color: "black",
      borderRadius: "full",
      _hover: {
        bg: "brand.primary.400",
      },
    }),
  },
  defaultProps: {
    variant: "solid",
  },
};
