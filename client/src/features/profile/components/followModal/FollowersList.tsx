import { Button, HStack, VStack } from "@chakra-ui/react";
import type { User } from "../../../../types/models";
import { FollowActionButton, FollowListItem } from "./FollowListItem";
import { FollowListPlaceholder } from "./FollowListPlaceholder";

interface FollowersListProps {
  followers: User[];
  isLoading: boolean;
  followingMap: Record<string, boolean>;
  processingIds: Record<string, boolean>;
  currentUser: User | null;
  isOwnProfile: boolean;
  onClose: () => void;
  onFollowToggle: (userId: string) => void;
  onRemoveFollower: (userId: string) => void;
}

export const FollowersList = ({
  followers,
  isLoading,
  followingMap,
  processingIds,
  currentUser,
  isOwnProfile,
  onClose,
  onFollowToggle,
  onRemoveFollower,
}: FollowersListProps) => {
  const placeholder = (
    <FollowListPlaceholder
      isLoading={isLoading}
      isEmpty={!isLoading && followers.length === 0}
      loadingLabel="Loading followers..."
      emptyTitle="No followers yet"
      emptyDescription="When people follow you, they'll appear here."
    />
  );

  if (isLoading || followers.length === 0) return placeholder;

  const validFollowers = followers.filter((user) => user?.username);

  return (
    <VStack align="stretch" spacing={4} pb={4}>
      {validFollowers.map((user, index) => {
        const isFollowing = followingMap[user._id] || false;
        const showActions =
          currentUser && currentUser._id !== user._id;

        return (
          <FollowListItem
            key={user._id || index}
            user={user}
            onClose={onClose}
            showSpacer={index < validFollowers.length - 1}
            actions={
              showActions ? (
                <HStack spacing={2}>
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="gray.600"
                      _hover={{ bg: "whiteAlpha.100" }}
                      borderRadius="md"
                      onClick={() => onRemoveFollower(user._id)}
                      isLoading={processingIds[user._id]}
                    >
                      Remove
                    </Button>
                  )}
                  <FollowActionButton
                    label={isFollowing ? "Following" : "Follow"}
                    variant={isFollowing ? "following" : "follow"}
                    onClick={() => onFollowToggle(user._id)}
                    isLoading={processingIds[user._id]}
                  />
                </HStack>
              ) : undefined
            }
          />
        );
      })}
    </VStack>
  );
};
