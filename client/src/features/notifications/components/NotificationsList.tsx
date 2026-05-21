import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import ContentCard from "../../../components/ui/ContentCard";
import { Notification } from "../types";
import { NotificationItem } from "./NotificationItem";

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  lastNotificationRef: (node: HTMLDivElement | null) => void;
  onDelete: (id: string) => void;
  textColor: string;
  mutedTextColor: string;
  spinnerColor: string;
  borderColor: string;
  scrollbarTrackColor: string;
  scrollbarThumbColor: string;
  scrollbarThumbHoverColor: string;
  scrollbarColor: string;
  itemHoverBg: string;
  menuHoverBg: string;
  menuHoverColor: string;
  menuListBg: string;
  menuItemHoverBg: string;
}

export const NotificationsList = ({
  notifications,
  loading,
  lastNotificationRef,
  onDelete,
  textColor,
  mutedTextColor,
  spinnerColor,
  borderColor,
  scrollbarTrackColor,
  scrollbarThumbColor,
  scrollbarThumbHoverColor,
  scrollbarColor,
  itemHoverBg,
  menuHoverBg,
  menuHoverColor,
  menuListBg,
  menuItemHoverBg,
}: NotificationsListProps) => {
  const validNotifications = notifications.filter(
    (notification) => notification && notification._id
  );

  return (
    <ContentCard
      position="relative"
      w={["100%", "500px", "550px"]}
      maxW="100%"
      mx="auto"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      px={0}
      zIndex={99}
      h={{ base: "70vh", md: "650px" }}
      minH={{ base: "300px", md: "auto" }}
      p={0}
      withBorder={true}
    >
      <Flex
        direction="column"
        gap={4}
        px={4}
        pb={6}
        pt={2}
        className="always-show-scrollbar"
        overflowY="scroll"
        flexGrow={1}
        h="100%"
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
            display: "block",
          },
          "&::-webkit-scrollbar-track": {
            background: scrollbarTrackColor,
            display: "block",
          },
          "&::-webkit-scrollbar-thumb": {
            background: scrollbarThumbColor,
            borderRadius: "4px",
            minHeight: "30px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: scrollbarThumbHoverColor,
          },
          scrollbarWidth: "thin",
          scrollbarColor: scrollbarColor,
          scrollbarGutter: "stable",
        }}
      >
        {loading && (
          <Box borderRadius="2xl" p={5} mb={4}>
            <Flex justify="center" py={4}>
              <Spinner size="lg" color={spinnerColor} />
            </Flex>
          </Box>
        )}

        {!loading && validNotifications.length === 0 && (
          <Box borderRadius="2xl" p={5} mb={4}>
            <Text textAlign="center" color={mutedTextColor} fontSize="sm" py={4}>
              You have no notifications yet.
            </Text>
          </Box>
        )}

        {!loading &&
          validNotifications.map((notification, idx) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              isLast={validNotifications.length === idx + 1}
              lastNotificationRef={lastNotificationRef}
              onDelete={onDelete}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
              borderColor={borderColor}
              itemHoverBg={itemHoverBg}
              menuHoverBg={menuHoverBg}
              menuHoverColor={menuHoverColor}
              menuListBg={menuListBg}
              menuItemHoverBg={menuItemHoverBg}
            />
          ))}

        <Box h="30px" />
      </Flex>
    </ContentCard>
  );
};
