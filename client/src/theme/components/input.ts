import { ComponentStyleConfig } from "@chakra-ui/theme";

export const Input: ComponentStyleConfig = {
  baseStyle: (props) => ({
    field: {
      border: `1px solid ${props.colorMode === "dark" ? "whiteAlpha.300" : "blackAlpha.200"}`,
      borderRadius: "12px",
      bg: props.colorMode === "dark" ? "brand.dark.300" : "white",
      color: props.colorMode === "dark" ? "white" : "black",
      boxShadow: "none",
      _hover: {
        borderColor: props.colorMode === "dark" ? "whiteAlpha.500" : "blackAlpha.400",
      },
      _focus: {
        borderColor: "brand.primary.500",
        boxShadow: "none",
      },
      _placeholder: {
        color: props.colorMode === "dark" ? "whiteAlpha.500" : "blackAlpha.500",
      },
    },
  }),
  variants: {
    outline: (props) => ({
      field: {
        // baseStyle already handles it
      },
    }),
    filled: (props) => ({
      field: {
        bg: props.colorMode === "dark" ? "whiteAlpha.100" : "blackAlpha.50",
      },
    }),
  },
  defaultProps: {
    variant: "outline",
  },
};
