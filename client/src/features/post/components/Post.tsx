import { Avatar, Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { Post as PostType } from "../../../utils/api";
import { usePostState } from "../hooks/usePostState";

// Import smaller components
import PostHeader from "./PostHeader";
import ImageGallery from "./ImageGallery";
import UserReply from "./UserReply";
import CommentsSection from "./CommentsSection";
import Actions from "./Actions";
import PostReplyInput from "./PostReplyInput";

/**
 * Post component
 * Displays a post with all its content and interactions
 */
interface PostProps {
  post: PostType;
  showComments?: boolean;
  isPostPage?: boolean;
  highlightReplyId?: string;
}

const Post = memo(({ post, showComments = false, isPostPage = false, highlightReplyId }: PostProps) => {
  const navigate = useNavigate();

  const {
    currentUser,
    posts,
    setPosts,
    displayComments,
    setDisplayComments,
    isReplying,
    images,
    handleDeletePost,
    handleNotInterested,
    handlePostClick,
    handleReplySubmit,
  } = usePostState({ post, showComments, isPostPage });

  // Check if post or post.postedBy exists before rendering
  if (!post || !post.postedBy) return null;

  return (
    <Box
      w="full"
      className="threads-post-card"
      onClick={handlePostClick}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: useColorModeValue("gray.50", "whiteAlpha.50"),
      }}
      p={4}
      borderBottom="1px solid"
      borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
      _last={{ borderBottom: "none" }}
    >
      <Flex gap={4} w="full">
        {/* Left column: Avatar only */}
        <Flex flexDirection="column" alignItems="center" flexShrink={0}>
          <Avatar
            size="md"
            name={post.postedBy.name}
            src={post.postedBy.profilePic}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/${post.postedBy.username}`);
            }}
          />
        </Flex>

        {/* Right column: Content */}
        <Flex flex={1} flexDirection="column" gap={1} minW={0}>
          {/* Header */}
          <PostHeader
            post={post}
            currentUser={currentUser}
            onDeletePost={handleDeletePost}
            onNotInterested={handleNotInterested}
          />

          {/* Post Content */}
          <Box mt={1}>
            <Text
              fontSize="md"
              overflowWrap="break-word"
              wordBreak="break-word"
              whiteSpace="pre-wrap"
              fontWeight="400"
              lineHeight="1.6"
              color={useColorModeValue("gray.700", "whiteAlpha.900")}
            >
              {post.text}
            </Text>
          </Box>

          {/* Image Gallery */}
          {images.length > 0 && (
            <Box w="full" mt={4} borderRadius="32px" overflow="hidden">
              <ImageGallery images={images} borderColor={useColorModeValue("gray.100", "whiteAlpha.100")} />
            </Box>
          )}

          {/* User's Reply Preview */}
          {post.userReply && (
            <Box w="full" mt={3}>
              <UserReply reply={post.userReply} borderColor={useColorModeValue("gray.100", "whiteAlpha.100")} />
            </Box>
          )}

          {/* Actions */}
          <Box mt={3} onClick={(e) => e.stopPropagation()}>
            <Actions
              post={post}
              onCommentToggle={() => setDisplayComments(!displayComments)}
              isExpanded={displayComments}
            />
          </Box>

          {/* Meta Information (Likes & Replies) */}
          <Flex gap={3} alignItems="center" mt={2}>
            {post.replies?.length > 0 && (
              <Text fontSize="xs" fontWeight="600" color="gray.500" letterSpacing="wide" textTransform="uppercase">
                {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            )}
            {post.replies?.length > 0 && post.likes?.length > 0 && (
              <Box w="4px" h="4px" bg="gray.500" borderRadius="full" opacity={0.5} />
            )}
            {post.likes?.length > 0 && (
              <Text fontSize="xs" fontWeight="600" color="gray.500" letterSpacing="wide" textTransform="uppercase">
                {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
              </Text>
            )}
          </Flex>

          {/* Comments Section */}
          {(displayComments || isPostPage) && post.replies?.length > 0 && (
            <Box w="full" mt={6}>
              <CommentsSection
                post={post}
                posts={posts}
                setPosts={setPosts}
                onHideComments={!isPostPage ? () => setDisplayComments(false) : undefined}
                highlightReplyId={highlightReplyId}
              />
            </Box>
          )}

          {/* PostPage Reply Input */}
          {isPostPage && (
            <Box mt={6}>
              <PostReplyInput
                currentUser={currentUser}
                isSubmitting={isReplying}
                onSubmit={handleReplySubmit}
              />
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
});

export default Post;
