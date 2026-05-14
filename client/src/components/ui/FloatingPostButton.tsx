import { Box, Icon, useColorModeValue } from "@chakra-ui/react";
import { Plus } from "phosphor-react";

interface FloatingPostButtonProps {
  onClick: () => void;
}

/**
 * A floating action button for creating posts, following the Threads design aesthetic.
 * Positioned fixed at the bottom right of the screen.
 */
const FloatingPostButton = ({ onClick }: FloatingPostButtonProps) => {
  // Use colors that match the Threads-inspired design system
  const bg = useColorModeValue("white", "#121212");
  const iconColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const shadowColor = useColorModeValue("rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)");

  return (
    <Box
      position="fixed"
      // Adjust bottom position to be above the mobile navigation bar
      bottom={{ base: "100px", lg: "40px" }}
      right={{ base: "24px", lg: "40px" }}
      bg={bg}
      color={iconColor}
      w="56px"
      h="56px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="18px"
      cursor="pointer"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      boxShadow={`0 10px 30px ${shadowColor}`}
      border="1px solid"
      borderColor={borderColor}
      zIndex={999}
      _hover={{
        transform: "scale(1.1) translateY(-4px)",
        boxShadow: `0 15px 40px ${shadowColor}`,
        bg: useColorModeValue("gray.50", "#252525")
      }}
      _active={{
        transform: "scale(0.95) translateY(0)"
      }}
      onClick={onClick}
      aria-label="Create new post"
    >
      <Icon as={Plus} weight="bold" boxSize={7} />
    </Box>
  );
};

export default FloatingPostButton;
