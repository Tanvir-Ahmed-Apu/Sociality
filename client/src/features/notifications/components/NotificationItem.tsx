import {
  Box,
  Flex,
  Avatar,
  Link as ChakraLink,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { Notification } from "../types";
import { NotificationContent } from "./NotificationContent";

interface NotificationItemProps {
  notification: Notification;
  isLast: boolean;
  lastNotificationRef: (node: HTMLDivElement | null) => void;
  onDelete: (id: string) => void;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  itemHoverBg: string;
  menuHoverBg: string;
  menuHoverColor: string;
  menuListBg: string;
  menuItemHoverBg: string;
}

export const NotificationItem = ({
  notification,
  isLast,
  lastNotificationRef,
  onDelete,
  textColor,
  mutedTextColor,
  borderColor,
  itemHoverBg,
  menuHoverBg,
  menuHoverColor,
  menuListBg,
  menuItemHoverBg,
}: NotificationItemProps) => (
  <Box
    key={notification._id}
    ref={isLast ? lastNotificationRef : null}
    w="full"
    p={{ base: 3, md: 4 }}
    mb={2}
    borderRadius="2xl"
    _hover={{ bg: itemHoverBg }}
    transition="all 0.2s"
  >
    <Flex gap={{ base: 3, md: 4 }} align="flex-start">
      {notification.sender ? (
        <ChakraLink as={RouterLink} to={`/${notification.sender.username}`}>
          <Avatar
            src={notification.sender.profilePic}
            size={{ base: "sm", md: "md" }}
            borderRadius="full"
          />
        </ChakraLink>
      ) : (
        <Avatar size={{ base: "sm", md: "md" }} borderRadius="full" />
      )}
      <Box
        flex="1"
        bg="transparent"
        p={{ base: 1, md: 2 }}
        borderRadius="xl"
        fontSize={{ base: "xs", md: "sm" }}
      >
        <NotificationContent
          notification={notification}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
        />
      </Box>
      {!notification.read && (
        <Box w={3} h={3} bg="blue.400" borderRadius="full" mt={2} />
      )}
      <Menu placement="bottom-end" isLazy>
        <MenuButton
          as={IconButton}
          icon={<BsThreeDotsVertical />}
          variant="ghost"
          size="sm"
          borderRadius="full"
          color={mutedTextColor}
          _hover={{ bg: menuHoverBg, color: menuHoverColor }}
        />
        <MenuList
          bg={menuListBg}
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
            _hover={{ bg: menuItemHoverBg }}
            onClick={() => onDelete(notification._id)}
          >
            Delete notification
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  </Box>
);
