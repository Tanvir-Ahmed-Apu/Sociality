import { Box, BoxProps, useColorModeValue } from "@chakra-ui/react";
import React from "react";

/**
 * A reusable card component for consistent UI across the app.
 * Follows a card-based structure with rounded corners and no borders.
 * Optimized for the Threads-inspired aesthetic.
 */
interface ContentCardProps extends BoxProps {
  children: React.ReactNode;
  withBorder?: boolean;
}

const ContentCard = React.forwardRef<HTMLDivElement, ContentCardProps>(
  ({ children, withBorder = false, ...props }, ref) => {
    // Threads uses a very specific dark gray/black background
    const bgColor = useColorModeValue("white", "#111111");
    // Enhanced shadows for light mode to make cards "pop" more on light backgrounds
    const shadowColor = useColorModeValue("rgba(0,0,0,0.08)", "rgba(0,0,0,0.3)");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    
    return (
      <Box
        ref={ref}
        bg={bgColor}
        borderRadius={{ base: "24px", md: "32px" }}
        boxShadow={withBorder ? "none" : `0 8px 32px ${shadowColor}`}
        border={withBorder ? "1px solid" : "none"}
        borderColor={borderColor}
        overflow="clip"
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        position="relative"
        {...props}
      >
        {children}
      </Box>
    );
  }
);

ContentCard.displayName = "ContentCard";

export default ContentCard;
