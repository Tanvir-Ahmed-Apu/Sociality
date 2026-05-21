import { VStack } from "@chakra-ui/react";
import type { User } from "../../../../types/models";
import { FollowActionButton, FollowListItem } from "./FollowListItem";
import { FollowListPlaceholder } from "./FollowListPlaceholder";

interface FollowingListProps {
  following: User[];
  isLoading: boolean;
  processingIds: Record<string, boolean>;
  currentUser: User | null;
  onClose: () => void;
  onUnfollow: (userId: string) => void;
}

export const FollowingList = ({
  following,
  isLoading,
  processingIds,
  currentUser,
  onClose,
  onUnfollow,
}: FollowingListProps) => {
  const placeholder = (
    <FollowListPlaceholder
      isLoading={isLoading}
      isEmpty={!isLoading && following.length === 0}
      loadingLabel="Loading following..."
      emptyTitle="Not following anyone"
      emptyDescription="When you follow someone, they'll appear here."
    />
  );

  if (isLoading || following.length === 0) return placeholder;

  const validFollowing = following.filter((user) => user?.username);

  return (
    <VStack align="stretch" spacing={4} pb={4}>
      {validFollowing.map((user, index) => {
        const showUnfollow =
          currentUser && currentUser._id !== user._id;

        return (
          <FollowListItem
            key={user._id || index}
            user={user}
            onClose={onClose}
            showSpacer={index < validFollowing.length - 1}
            actions={
              showUnfollow ? (
                <FollowActionButton
                  label="Unfollow"
                  variant="outline"
                  onClick={() => onUnfollow(user._id)}
                  isLoading={processingIds[user._id]}
                />
              ) : undefined
            }
          />
        );
      })}
    </VStack>
  );
};
