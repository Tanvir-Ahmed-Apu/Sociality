import { Link as ChakraLink, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Notification } from "../types";

interface NotificationContentProps {
  notification: Notification;
  textColor: string;
  mutedTextColor: string;
}

export const NotificationContent = ({
  notification,
  textColor,
  mutedTextColor,
}: NotificationContentProps) => {
  const timeAgo = formatDistanceToNowStrict(
    new Date(notification.createdAt),
    { addSuffix: true }
  );

  const senderLink = notification.sender ? (
    <ChakraLink
      as={RouterLink}
      to={`/${notification.sender.username}`}
      fontWeight="bold"
      fontSize={{ base: "xs", md: "sm" }}
      color={textColor}
    >
      {notification.sender.username}
    </ChakraLink>
  ) : (
    <Text
      as="span"
      fontWeight="bold"
      fontSize={{ base: "xs", md: "sm" }}
      color={textColor}
    >
      A user
    </Text>
  );

  const postLink = (label: string) =>
    notification.recipient && notification.postId ? (
      <ChakraLink
        as={RouterLink}
        to={`/${notification.recipient.username}/post/${notification.postId}`}
        fontWeight="bold"
        fontSize={{ base: "xs", md: "sm" }}
        color={textColor}
      >
        {label}
      </ChakraLink>
    ) : (
      <Text
        as="span"
        fontWeight="bold"
        fontSize={{ base: "xs", md: "sm" }}
        color={textColor}
      >
        {label}
      </Text>
    );

  const timestamp = (
    <Text as="span" color={mutedTextColor} fontSize="smaller">
      ({timeAgo})
    </Text>
  );

  switch (notification.type) {
    case "follow":
      return (
        <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
          {senderLink} started following you {timestamp}
        </Text>
      );
    case "like":
      return (
        <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
          {senderLink} liked your {postLink("post")} {timestamp}
        </Text>
      );
    case "comment":
      return (
        <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
          {senderLink} commented on your {postLink("post")} {timestamp}
        </Text>
      );
    case "reply":
      return (
        <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
          {senderLink} replied to your {postLink("comment")} {timestamp}
        </Text>
      );
    default:
      return (
        <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
          Unknown notification type {timestamp}
        </Text>
      );
  }
};
