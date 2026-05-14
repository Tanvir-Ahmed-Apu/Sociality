import React from "react";
import { Flex, Text, Menu, MenuButton, MenuList, MenuItem, IconButton, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import useShowToast from "../../../hooks/useShowToast";
import { Post, User } from "../../../utils/api";

/**
 * Post header component
 * Displays the username, timestamp, and menu options for a post
 */
interface PostHeaderProps {
  post: Post;
  currentUser: User | null;
  onDeletePost: (e: React.MouseEvent) => void;
  onNotInterested: (e: React.MouseEvent) => void;
}

const PostHeader = ({ post, currentUser, onDeletePost, onNotInterested }: PostHeaderProps) => {
  const showToast = useShowToast();

  // Handle copy link to clipboard
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    showToast("Success", "Post link copied to clipboard", "success");
  };

  return (
    <Flex justifyContent="space-between" w="full" alignItems="center">
      {/* User Info & Time */}
      <Flex alignItems="center" gap={2}>
        <Link to={`/${post.postedBy.username}`} onClick={(e) => e.stopPropagation()}>
          <Text fontSize="sm" fontWeight="600">
            {post.postedBy.username}
          </Text>
        </Link>
        <Text fontSize="sm" color="gray.500">•</Text>
        <Text fontSize="sm" color="gray.500">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false })
            .replace('about ', '')
            .replace('less than a minute', 'now')
            .replace(' minute', 'm')
            .replace(' minutes', 'm')
            .replace(' hour', 'h')
            .replace(' hours', 'h')
            .replace(' day', 'd')
            .replace(' days', 'd')
            .replace(' month', 'mo')
            .replace(' months', 'mo')
            .replace(' year', 'y')
            .replace(' years', 'y')
          }
        </Text>
      </Flex>

      {/* Menu Options */}
      <Flex alignItems="center">
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={IconButton}
            icon={<ThreeDotsIcon />}
            variant="ghost"
            aria-label="Options"
            size="sm"
            borderRadius="full"
            color="gray.500"
            _hover={{
              bg: useColorModeValue("gray.100", "whiteAlpha.100"),
              color: useColorModeValue("black", "white")
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList
            fontSize="sm"
            bg={useColorModeValue("white", "#111111")}
            border="none"
            boxShadow="0 8px 32px rgba(0,0,0,0.2)"
            borderRadius="16px"
            p={2}
          >
            {currentUser?._id === post.postedBy._id ? (
              <MenuItem
                icon={<DeleteIcon />}
                color="red.500"
                borderRadius="10px"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost(e);
                }}
              >
                Delete
              </MenuItem>
            ) : (
              <MenuItem
                icon={<NotInterestedIcon />}
                borderRadius="10px"
                onClick={(e) => onNotInterested(e)}
              >
                Not interested
              </MenuItem>
            )}
            <MenuItem
              icon={<CopyIcon />}
              borderRadius="10px"
              onClick={handleCopyLink}
            >
              Copy link
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );

};

// Icon components
const RepostIcon = () => (
  <svg
    aria-label='Repost'
    color="currentColor"
    fill='none'
    height='16'
    width='16'
    role='img'
    viewBox='0 0 24 24'
  >
    <path
      d="M4 9h13l-3-3m9 13H10l3 3M5 5v5h5M19 19v-5h-5"
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ThreeDotsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const NotInterestedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

export default PostHeader;
