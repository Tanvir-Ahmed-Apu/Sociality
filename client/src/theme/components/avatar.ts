import { ComponentStyleConfig } from "@chakra-ui/theme";

export const Avatar: ComponentStyleConfig = {
  baseStyle: (props) => ({
    container: {
      border: `1px solid ${props.colorMode === "dark" ? "whiteAlpha.300" : "blackAlpha.200"}`,
      boxShadow: "none",
      bg: "gray.500",
    },
  }),
};
