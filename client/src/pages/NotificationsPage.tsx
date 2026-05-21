import { Box, Heading } from "@chakra-ui/react";
import { NotificationsList } from "../features/notifications/components/NotificationsList";
import { useNotifications } from "../features/notifications/hooks/useNotifications";
import { useNotificationTheme } from "../features/notifications/hooks/useNotificationTheme";

const NotificationsPage = () => {
  const theme = useNotificationTheme();
  const { notifications, loading, lastNotificationRef, handleDeleteNotification } =
    useNotifications();

  return (
    <Box
      className="page-content-scroll"
      bg="transparent"
      pt={{ base: "60px", md: "20px" }}
    >
      <Heading
        as="h1"
        size="lg"
        mb={{ base: 4, md: 8 }}
        textAlign="center"
        mt={{ base: 2, md: 0 }}
        color={theme.textColor}
      >
        Notifications
      </Heading>

      <Box
        bg="transparent"
        pb={{ base: "80px", md: "100px" }}
      >
        <NotificationsList
          notifications={notifications}
          loading={loading}
          lastNotificationRef={lastNotificationRef}
          onDelete={handleDeleteNotification}
          {...theme}
        />
      </Box>
    </Box>
  );
};

export default NotificationsPage;
