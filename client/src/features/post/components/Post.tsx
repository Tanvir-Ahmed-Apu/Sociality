import { Avatar, Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo, memo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { markPostNotInterested } from "../../../utils/api";

// Import smaller components
import PostHeader from "./PostHeader";
import ImageGallery from "./ImageGallery";
import UserReply from "./UserReply";
import CommentsSection from "./CommentsSection";
import ShowCommentsButton from "./ShowCommentsButton";
import Actions from "./Actions";
import PostReplyInput from "./PostReplyInput";
import { fetchWithSession, Post as PostType } from "../../../utils/api";

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
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();
  const [displayComments, setDisplayComments] = useState(showComments);
  const [isReplying, setIsReplying] = useState(false);

  // Memoize images array calculation to prevent recalculation on every render
  const images = useMemo(() => {
    // Debug post image data
    console.log("Post image data:", {
      postId: post._id,
      hasImg: !!post.img,
      img: post.img,
      hasImages: post.images && Array.isArray(post.images) && post.images.length > 0,
      images: post.images
    });

    // Check if post has multiple images in the images array
    const hasMultipleImages = post.images && Array.isArray(post.images) && post.images.length > 0;

    // If post has images array, use it; otherwise, if post has a single img, create an array with it
    let imageArray: string[] = [];

    if (hasMultipleImages) {
      // Filter out any null or undefined values
      imageArray = post.images.filter(img => img);
    } else if (post.img) {
      imageArray = [post.img];
    }

    // Validate that all images are valid URLs
    return imageArray.filter(img =>
      typeof img === 'string' &&
      (img.startsWith('http://') || img.startsWith('https://'))
    );
  }, [post._id, post.images, post.img]);

  // Memoize event handlers to prevent recreation on every render
  const handleDeletePost = useCallback(async (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      if (!window.confirm("Are you sure you want to delete this post?")) return;

      const res = await fetchWithSession(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      setPosts(posts.filter((p) => p._id !== post._id));

      if (isPostPage && post.postedBy) {
        navigate(`/${post.postedBy.username}`);
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    }
  }, [post._id, posts, setPosts, showToast]);

  // Handle "Not interested" action
  const handleNotInterested = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Call API to mark post as not interested using the utility function
      await markPostNotInterested(post._id);

      // Remove post from current feed
      setPosts(posts.filter((p) => p._id !== post._id));
      showToast("Success", "You won't see this post again", "success");
    } catch (error) {
      console.error('Error marking post as not interested:', error);
      showToast("Error", "Failed to mark post as not interested", "error");
    }
  }, [post._id, posts, setPosts, showToast]);

  // Check if post or post.postedBy exists before rendering
  if (!post || !post.postedBy) return null;

  // Memoize the click handler to prevent recreation on every render
  const handlePostClick = useCallback((e: React.MouseEvent) => {
    // Navigate on clicking the box, except when clicking interactive elements
    const interactiveElements = ["A", "BUTTON", "IMG", "svg"]; // Tags of elements that shouldn't trigger navigation
    if (
      e.target instanceof Element &&
      !interactiveElements.includes(e.target.tagName) &&
      !e.target.closest("a, button") // Check parent elements too
    ) {
      // Use requestAnimationFrame to defer navigation until after the current frame
      requestAnimationFrame(() => {
        navigate(`/${post.postedBy.username}/post/${post._id}`);
      });
    }
  }, [navigate, post._id, post.postedBy.username]);

  const handleReplySubmit = async (text: string, image: File | null) => {
    if (!text.trim() && !image) return;
    setIsReplying(true);

    try {
      const formData = new FormData();
      formData.append("text", text);
      if (image) {
        formData.append("img", image);
      }

      const res = await fetchWithSession(`/api/posts/reply/${post._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      const updatedPosts = posts.map((p) => {
        if (p._id === post._id) {
          return { ...p, replies: [...(p.replies || []), data] };
        }
        return p;
      });

      setPosts(updatedPosts);
      showToast("Success", "Reply posted successfully", "success");
      setDisplayComments(true); // Show comments after replying
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setIsReplying(false);
    }
  };

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
