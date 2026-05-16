import { Box, Heading, Spinner, Text, Flex, Avatar, Link as ChakraLink, Divider, IconButton, Menu, MenuButton, MenuList, MenuItem, useColorModeValue } from "@chakra-ui/react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom"; // For linking to profiles/posts
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamps
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { fetchWithSession } from "../utils/api";
import ContentCard from "../components/ui/ContentCard";

// Component for notifications page

interface Notification {
  _id: string;
  type: string;
  createdAt: string;
  sender?: {
    username: string;
    profilePic?: string;
  };
  recipient?: {
    username: string;
  };
  postId?: string;
  read: boolean;
}

import { useRecoilState } from "recoil";
import { notificationsAtom } from "../atoms";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsAtom);
  const [loading, setLoading] = useState(notifications.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const showToast = useShowToast();

  // Theme-aware colors - ALL hooks must be called at the top level
  const bgColor = useColorModeValue("#f7fafc", "#101010");
  const cardBgColor = useColorModeValue("white", "#1a1a1a");
  const borderColor = useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.08)");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const hoverBgColor = useColorModeValue("gray.50", "#1e1e1e");
  const spinnerColor = useColorModeValue("gray.600", "whiteAlpha.700");

  // Additional theme-aware colors for conditional usage
  const scrollbarTrackColor = useColorModeValue('#f0f0f0', '#1a1a1a');
  const scrollbarThumbColor = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)');
  const scrollbarThumbHoverColor = useColorModeValue('rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 0.5)');
  const scrollbarColor = useColorModeValue('rgba(0, 0, 0, 0.3) #f0f0f0', 'rgba(255, 255, 255, 0.3) #1a1a1a');
  const notificationHoverBg = useColorModeValue("gray.100", "rgba(255, 255, 255, 0.03)");
  const avatarBorderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  const lastNotificationRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (notifications.length === 0) setLoading(true);
      try {
        const res = await fetchWithSession(`/api/notifications?page=${page}&limit=10`);
        if (res.ok) {
          const data = await res.json();

          // Get notifications array from response
          const notificationsArray = Array.isArray(data.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [];

          // Update hasMore from backend response if available
          if (data.hasMore !== undefined) {
            setHasMore(data.hasMore);
          } else {
            // Fallback to old logic if backend doesn't provide hasMore
            setHasMore(notificationsArray.length > 0);
          }

          setNotifications(prev => {
            const all = [...prev, ...notificationsArray];
            const seen = new Set();
            return all.filter((n: Notification) => {
              if (!n._id) return false;
              if (seen.has(n._id)) return false;
              seen.add(n._id);
              return true;
            });
          });
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Failed to fetch notifications' }));
          showToast("Error", errorData.error || 'Failed to fetch notifications', "error");
        }
      } catch (error: any) {
        showToast("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // eslint-disable-next-line
  }, [page, showToast]);

  // Function to delete a notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      setNotifications(prev => prev.filter((n: Notification) => n._id !== notificationId));

      // Send delete request to server
      const res = await fetchWithSession(`/api/notifications/${notificationId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
        }
      } else {
        // If there was an error, fetch all notifications again
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete notification' }));
        showToast("Error", errorData.error || 'Failed to delete notification', "error");

        const refreshRes = await fetchWithSession("/api/notifications?page=1&limit=10");
        if (refreshRes.ok) {
          const refreshedData = await refreshRes.json();

          // Reset pagination state
          setPage(1);

          // Handle the new response format
          if (refreshedData.notifications) {
            setNotifications(refreshedData.notifications);
            if (refreshedData.hasMore !== undefined) {
              setHasMore(refreshedData.hasMore);
            }
          } else {
            // Fallback for old format
            setNotifications(Array.isArray(refreshedData) ? refreshedData : []);
          }
        }
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    }
  };

  const renderNotificationText = (notification: Notification) => {
    const timeAgo = formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true });

    // Handle case where sender might be null
    const senderLink = notification.sender ? (
      <ChakraLink as={RouterLink} to={`/${notification.sender.username}`} fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
        {notification.sender.username}
      </ChakraLink>
    ) : (
      <Text as="span" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
        A user
      </Text>
    );

    switch (notification.type) {
      case "follow":
        return (
          <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
            {senderLink} started following you{' '}
            <Text as="span" color={mutedTextColor} fontSize="smaller">({timeAgo})</Text>
          </Text>
        );
      case "like":
        return (
          <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
            {senderLink} liked your{' '}
            {notification.recipient && notification.postId ? (
              <ChakraLink as={RouterLink} to={`/${notification.recipient.username}/post/${notification.postId}`} fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                post
              </ChakraLink>
            ) : (
              <Text as="span" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                post
              </Text>
            )}{' '}
            <Text as="span" color={mutedTextColor} fontSize="smaller">({timeAgo})</Text>
          </Text>
        );
      case "comment":
        return (
          <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
            {senderLink} commented on your{' '}
            {notification.recipient && notification.postId ? (
              <ChakraLink as={RouterLink} to={`/${notification.recipient.username}/post/${notification.postId}`} fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                post
              </ChakraLink>
            ) : (
              <Text as="span" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                post
              </Text>
            )}{' '}
            <Text as="span" color={mutedTextColor} fontSize="smaller">({timeAgo})</Text>
          </Text>
        );
      case "reply":
        return (
          <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
            {senderLink} replied to your{' '}
            {notification.recipient && notification.postId ? (
              <ChakraLink as={RouterLink} to={`/${notification.recipient.username}/post/${notification.postId}`} fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                comment
              </ChakraLink>
            ) : (
              <Text as="span" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color={textColor}>
                comment
              </Text>
            )}{' '}
            <Text as="span" color={mutedTextColor} fontSize="smaller">({timeAgo})</Text>
          </Text>
        );
      default:
        return (
          <Text color={textColor} bg="transparent" fontSize={{ base: "xs", md: "sm" }}>
            Unknown notification type{' '}
            <Text as="span" color={mutedTextColor} fontSize="smaller">({timeAgo})</Text>
          </Text>
        );
    }
  };

  return (
    <Box
      className="page-content-scroll"
      bg="transparent"
      pt={{ base: "60px", md: "20px" }} // Adjusted padding for logo
    >
      {/* Notifications Header styled like Search page */}
      <Heading
        as="h1"
        size="lg"
        mb={{ base: 4, md: 8 }}
        textAlign="center"
        mt={{ base: 2, md: 0 }}
        color={textColor}
      >
        Notifications
      </Heading>

      <Box
        bg="transparent"
        pb={{ base: "80px", md: "100px" }} /* Padding to prevent content from being hidden behind the navigation bar */
      >
        <ContentCard
          position="relative"
          w={["100%", "500px", "550px"]} /* Increased width */
          maxW="100%"
          mx="auto"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          px={0}
          zIndex={99}
          h={{ base: "70vh", md: "650px" }} /* Responsive height */
          minH={{ base: "300px", md: "auto" }}
          p={0}
          withBorder={true}
        >
          {/* Notifications list with inner scroll */}
          <Flex
            direction="column"
            gap={4} /* Increased gap */
            px={4}
            pb={6} /* Increased padding */
            pt={2}
            className="always-show-scrollbar"
            overflowY="scroll" /* Force scroll instead of auto */
            flexGrow={1}
            h="100%" /* Full height since heading was removed */
            css={{
              '&::-webkit-scrollbar': {
                width: '8px', /* Wider scrollbar */
                display: 'block', /* Always show scrollbar */
              },
              '&::-webkit-scrollbar-track': {
                background: scrollbarTrackColor, /* Theme-aware track */
                display: 'block', /* Always show track */
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarThumbColor, /* Theme-aware thumb */
                borderRadius: '4px',
                minHeight: '30px', /* Ensure thumb is visible */
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: scrollbarThumbHoverColor, /* Theme-aware hover */
              },
              scrollbarWidth: 'thin',
              scrollbarColor: scrollbarColor,
              /* Firefox specific */
              scrollbarGutter: 'stable',
            }}
          >
            {loading && (
              <Box
                borderRadius="2xl"
                p={5} /* Increased padding */
                mb={4} /* Increased margin */
              >
                <Flex justify="center" py={4}> {/* Added vertical padding */}
                  <Spinner size="lg" color={spinnerColor} /> {/* Larger spinner */}
                </Flex>
              </Box>
            )}

            {!loading && notifications.length === 0 && (
              <Box
                borderRadius="2xl"
                p={5} /* Increased padding */
                mb={4} /* Increased margin */
              >
                <Text textAlign="center" color={mutedTextColor} fontSize="sm" py={4}> {/* Larger text and added padding */}
                  You have no notifications yet.
                </Text>
              </Box>
            )}

            {!loading && notifications.length > 0 && notifications.filter((notification: Notification) => notification && notification._id).map((notification, idx) => (
              <Box
                key={notification._id}
                ref={notifications.length === idx + 1 ? lastNotificationRef : null}
                w="full"
                p={{ base: 3, md: 4 }}
                mb={2}
                borderRadius="2xl"
                _hover={{ 
                    bg: useColorModeValue("gray.50", "whiteAlpha.100"),
                }}
                transition="all 0.2s"
              >
                <Flex gap={{ base: 3, md: 4 }} align="flex-start">
                  {notification.sender ? (
                    <ChakraLink as={RouterLink} to={`/${notification.sender.username}`}>
                    <Avatar
                      src={notification.sender.profilePic}
                      size={{ base: "sm", md: "md" }} /* Responsive avatar size */
                      borderRadius="full"
                    />
                  </ChakraLink>
                ) : (
                  <Avatar
                    size={{ base: "sm", md: "md" }} /* Responsive avatar size */
                    borderRadius="full"
                  />
                )}
                  <Box
                    flex="1"
                    bg="transparent"
                    p={{ base: 1, md: 2 }} /* Responsive padding */
                    borderRadius="xl"
                    fontSize={{ base: "xs", md: "sm" }} /* Responsive text size */
                  >
                    {renderNotificationText(notification)}
                  </Box>
                  {/* Unread indicator */}
                  {!notification.read && (
                    <Box w={3} h={3} bg="blue.400" borderRadius="full" mt={2} /> /* Larger indicator */
                  )}
                  {/* Three dots menu for notification actions */}
                  <Menu placement="bottom-end" isLazy>
                    <MenuButton
                      as={IconButton}
                      icon={<BsThreeDotsVertical />}
                      variant="ghost"
                      size="sm"
                      borderRadius="full"
                      color={mutedTextColor}
                      _hover={{
                        bg: useColorModeValue("gray.100", "whiteAlpha.100"),
                        color: useColorModeValue("black", "white")
                      }}
                    />
                    <MenuList
                      bg={useColorModeValue("white", "#1E1E1E")}
                      borderColor={borderColor}
                      boxShadow="xl"
                      p={2}
                      borderRadius="xl"
                    >
                      <MenuItem
                        icon={<FaTrash />}
                        color="red.400"
                        bg="transparent"
                        fontSize="sm"
                        p={3}
                        borderRadius="md"
                        _hover={{
                          bg: useColorModeValue("gray.100", "whiteAlpha.200")
                        }}
                        onClick={() => handleDeleteNotification(notification._id)}
                      >
                        Delete notification
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            ))}

            {/* Add padding at the bottom for spacing */}
            <Box h="30px"></Box>
          </Flex>
        </ContentCard>
      </Box>
    </Box>
  );
};

export default NotificationsPage;
