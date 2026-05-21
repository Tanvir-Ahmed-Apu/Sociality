import { Box, HStack } from "@chakra-ui/react";
import type { FollowTab } from "./types";

const tabIndicator = {
  content: '""',
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  width: "100%",
  height: "2px",
  bg: "rgba(0, 179, 116, 0.8)",
  boxShadow: "0 0 8px rgba(0, 179, 116, 0.5)",
};

interface FollowModalTabsProps {
  activeTab: FollowTab;
  onTabChange: (tab: FollowTab) => void;
}

export const FollowModalTabs = ({
  activeTab,
  onTabChange,
}: FollowModalTabsProps) => (
  <HStack w="full" spacing={0}>
    {(["Followers", "Following"] as const).map((label, index) => {
      const tab = index as FollowTab;
      const isActive = activeTab === tab;

      return (
        <Box
          key={label}
          flex={1}
          fontWeight={600}
          py={4}
          px={1}
          position="relative"
          textAlign="center"
          transition="all 0.2s"
          cursor="pointer"
          color={isActive ? "white" : "whiteAlpha.700"}
          _hover={{ color: "white", bg: "rgba(0, 179, 116, 0.05)" }}
          onClick={() => onTabChange(tab)}
          _after={isActive ? tabIndicator : undefined}
        >
          {label}
        </Box>
      );
    })}
  </HStack>
);
