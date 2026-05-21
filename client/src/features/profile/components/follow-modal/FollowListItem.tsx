import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { User } from "../../../../types/models";
import type { ReactNode } from "react";

interface FollowListItemProps {
  user: User;
  onClose: () => void;
  actions?: ReactNode;
  showSpacer?: boolean;
}

export const FollowListItem = ({
  user,
  onClose,
  actions,
  showSpacer,
}: FollowListItemProps) => (
  <div>
    <Flex
      justify="space-between"
      align="center"
      p="12px 8px"
      transition="all 0.2s"
      borderRadius="8px"
      m="2px 4px"
      _hover={{
        bg: "rgba(0, 179, 116, 0.05)",
        transform: "translateY(-1px)",
      }}
    >
      <HStack spacing={3}>
        <Avatar
          size="md"
          name={user.username || "User"}
          src={user.profilePic}
        />
        <Flex direction="column">
          <Box
            as={RouterLink}
            to={`/${user.username}`}
            fontWeight={500}
            color="white"
            _hover={{ textDecoration: "underline" }}
            onClick={onClose}
          >
            {user.username || "Unknown User"}
          </Box>
          {user.name && (
            <Text fontSize="14px" color="whiteAlpha.600">
              {user.name}
            </Text>
          )}
        </Flex>
      </HStack>
      {actions}
    </Flex>
    {showSpacer && <Box h="12px" />}
  </div>
);

interface FollowActionButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  variant?: "follow" | "following" | "outline";
}

export const FollowActionButton = ({
  label,
  onClick,
  isLoading,
  variant = "outline",
}: FollowActionButtonProps) => {
  const isFollow = variant === "follow";
  const isFollowing = variant === "following";

  return (
    <Button
      size="sm"
      bg={
        isFollow
          ? "rgba(0, 179, 116, 0.2)"
          : isFollowing
            ? "transparent"
            : "transparent"
      }
      color="white"
      borderWidth="1px"
      borderColor={
        isFollow
          ? "rgba(0, 179, 116, 0.5)"
          : isFollowing
            ? "gray.600"
            : "gray.600"
      }
      variant={variant === "outline" && !isFollow && !isFollowing ? "outline" : undefined}
      _hover={{
        bg: isFollow
          ? "rgba(0, 179, 116, 0.3)"
          : "rgba(255, 255, 255, 0.1)",
        transform: "translateY(-2px)",
        borderColor: isFollow
          ? "rgba(0, 179, 116, 0.7)"
          : "gray.400",
      }}
      transition="all 0.2s"
      borderRadius="md"
      fontWeight="medium"
      onClick={onClick}
      isLoading={isLoading}
      px={4}
      py={variant === "outline" ? undefined : 3}
      boxShadow={variant === "outline" ? undefined : "0 2px 6px rgba(0, 0, 0, 0.1)"}
      _active={
        variant === "outline"
          ? undefined
          : {
              transform: "scale(0.98)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }
      }
    >
      {label}
    </Button>
  );
};
