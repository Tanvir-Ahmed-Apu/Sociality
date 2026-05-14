import { useState, useRef, useEffect } from "react";
import { Avatar, Divider, Flex, Text, Box, Image, useDisclosure, useToast, useColorModeValue, Button } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../atoms";
import { User, Post } from "../../../utils/api";
import useShowToast from "../../../hooks/useShowToast";
import { useSocket } from "../../../hooks/useSocket";
import { fetchWithSession } from "../../../utils/api";

// Import smaller components
import {
  CommentHeader,
  CommentActions,
  ReplyForm,
  DeleteCommentAlert,
  ShowRepliesButton,
  ChildReplies
} from "./index";

/**
 * Comment component
 * Displays a comment with all its content and interactions
 */
const Comment = ({
  reply,
  lastReply,
  postId,
  onReplyAdded,
  childReplies = [],
  allReplies = [],
  highlightId = null
}: any) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const cancelRef = useRef<any>(null);
  const currentUser = useRecoilValue(userAtom) as User | null;
  const [posts, setPosts] = useRecoilState(postsAtom) as [Post[], any];
  const showToast = useShowToast();
  const toast = useToast();
  const { socket } = useSocket();

  // Theme-aware colors
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");
  const bgColor = useColorModeValue("white", "#101010");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Check if reply is valid before proceeding
  if (!reply || !reply._id) {
    console.log("Invalid reply object:", reply);
    return null;
  }

  // Initialize like state based on reply likes
  useEffect(() => {
    if (reply?.likes && currentUser) {
      setLiked(reply.likes.includes(currentUser?._id));
    }
  }, [reply?.likes, currentUser]);

  // Handle like/unlike for comment
  const handleLikeComment = async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to like a comment", "error");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      // Set liked state optimistically for better UX
      setLiked(!liked);

      // Send API request to update like status on the server
      const res = await fetchWithSession(`/api/posts/comment/like/${postId}/${reply._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (res.ok) {
        const data = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to like/unlike comment' }));
        // Revert optimistic update if there was an error
        setLiked(liked);
        throw new Error(errorData.error || 'Failed to like/unlike comment');
      }

      // Update posts state to reflect the change
      const updatedPosts = posts.map((p:any) => {
        if (p._id === postId) {
          return {
            ...p,
            replies: p.replies.map((r:any) => {
              if (r._id === reply._id) {
                // Update likes array based on current action
                const newLikes = liked
                  ? r.likes.filter((id:any) => id !== currentUser?._id) // Unlike: remove user ID
                  : [...(r.likes || []), currentUser?._id]; // Like: add user ID

                return {
                  ...r,
                  likes: newLikes
                };
              }
              return r;
            })
          };
        }
        return p;
      });

      setPosts(updatedPosts);

      showToast("Success", liked ? "Comment unliked" : "Comment liked", "success");
    } catch (error:any) {
      showToast("Error", error.message || "Failed to like/unlike comment", "error");
      // Revert optimistic update on error
      setLiked(liked);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to reply", "error");
      return;
    }

    if (!replyText.trim() && !replyImage) {
      showToast("Error", "Reply cannot be empty", "error");
      return;
    }

    // Ensure reply and postId exist
    if (!reply || !reply._id || !postId) {
      showToast("Error", "Missing required reply information", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image to base64 if it exists
      let imgUrl = null;
      if (replyImage) {
        const reader = new FileReader();
        const imgPromise = new Promise((resolve) => {
          reader.onload = (e: any) => resolve(e.target.result);
          reader.readAsDataURL(replyImage);
        });
        imgUrl = await imgPromise;
      }

      // Create new reply object with proper fields
      const newReply = {
        text: replyText,
        img: imgUrl,
        parentReplyId: reply._id,
        username: currentUser?.username,
        userProfilePic: currentUser?.profilePic,
        userId: currentUser?._id,
        createdAt: new Date().toISOString(),
        // Generate a temporary ID until server responds
        _id: `temp-${Date.now()}`
      };

      // Optimistically update UI by calling the callback immediately
      if (onReplyAdded) {
        onReplyAdded(newReply);
      }

      // Show replies when a new one is added
      setShowReplies(true);

      // Then send to server
      const res = await fetchWithSession(`/api/posts/reply/${postId}/comment/${reply._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: replyText,
          img: imgUrl,
          parentReplyId: reply._id, // Set this reply as the parent
        }),
      });

      let data: any = {};
      if (res.ok) {
        data = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to reply to comment' }));
        showToast("Error", errorData.error || 'Failed to reply to comment', "error");
        return;
      }

      // Use the toast instance from the top level
      toast({
        title: "Success",
        description: "Reply posted",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
        render: ({ onClose }) => (
          <Box
            color={useColorModeValue("white", "white")}
            p={3}
            bg="green.500"
            borderRadius="md"
            boxShadow="md"
          >
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold">Reply posted</Text>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                onClick={() => {
                  onClose();
                  // Navigate to post with the new reply ID as a query parameter
                  // This will temporarily highlight the reply at the top
                  navigate(`/${reply.username}/post/${postId}?highlight=${data._id}`);
                }}
                ml={3}
              >
                View
              </Button>
            </Flex>
          </Box>
        )
      });

      // Reset form and close reply box
      setReplyText("");
      setReplyImage(null);
      setImagePreview(null);
      onClose();
    } catch (error:any) {
      showToast("Error", error.message || "Failed to reply to comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to delete a comment", "error");
      return;
    }

    setIsDeleting(true);
    try {
      // Optimistic update - remove the comment from the UI immediately
      const updatedPosts = posts.map((p:any) => {
        if (p._id === postId) {
          return {
            ...p,
            replies: p.replies.filter((r:any) => r._id !== reply._id)
          };
        }
        return p;
      });
      setPosts(updatedPosts);

      // Close the delete alert
      setIsDeleteAlertOpen(false);

      // Send API request to delete the comment
      const res = await fetchWithSession(`/api/posts/comment/${postId}/${reply._id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const data = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete comment' }));
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      showToast("Success", "Comment deleted successfully", "success");
    } catch (error:any) {
      showToast("Error", error.message || "Failed to delete comment", "error");

      // Revert the optimistic update if there was an error
      const originalPost = posts.find((p:any) => p._id === postId);
      if (originalPost) {
        const updatedPosts = posts.map((p:any) => {
          if (p._id === postId) {
            return originalPost;
          }
          return p;
        });
        setPosts(updatedPosts);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if this is a nested reply
  const isNestedReply = reply.parentReplyId !== null && reply.parentReplyId !== undefined;

  // Get username or fallback
  const username = reply.username || "User";

  // Safely format date
  const timeAgo = reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt)) : "recently";

  // Check if this comment has replies
  const hasReplies = childReplies && childReplies.length > 0;

  // State for highlighting the reply
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const isThisReplyHighlighted = highlightId && reply._id === highlightId;

  // Set highlighted state when the component mounts or highlightId changes
  useEffect(() => {
    if (isThisReplyHighlighted) {
      setIsHighlighted(true);
      setShowNewBadge(true);

      // Keep the "New Reply" badge for 10 seconds to make it more noticeable
      const timer = setTimeout(() => {
        // After 10 seconds, remove the "New Reply" badge but keep subtle highlighting
        setShowNewBadge(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isThisReplyHighlighted]);

  // Check if this reply contains the highlighted reply in its children
  const containsHighlightedReply = !isThisReplyHighlighted && highlightId && childReplies.some(
    (child:any) => child._id === highlightId || allReplies.some(
      (r:any) => r.parentReplyId === child._id && r._id === highlightId
    )
  );

  // Auto-expand replies if this comment or any of its children is highlighted
  useEffect(() => {
    if (isHighlighted || containsHighlightedReply) {
      setShowReplies(true);
    }
  }, [isHighlighted, containsHighlightedReply]);

  // Effect to scroll to highlighted reply
  useEffect(() => {
    if (isHighlighted) {
      // Add a small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(`reply-${reply._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, reply._id]);

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for post updates (new replies)
    const handlePostUpdate = (data:any) => {
      // Only process updates for the current post
      if (data.postId !== postId) return;

      // Handle nested replies to this comment
      if (data.type === "nestedReply" && data.parentReplyId === reply._id) {
        // Make sure replies are visible
        setShowReplies(true);

        // Call the onReplyAdded callback to update the parent component
        if (onReplyAdded) {
          onReplyAdded(data.reply);
        }
      }

      // Handle comment deletion
      if (data.type === "commentDeleted" && data.commentId === reply._id) {
        // Remove the comment from the UI
        const updatedPosts = posts.map((p:any) => {
          if (p._id === postId) {
            return {
              ...p,
              replies: p.replies.filter((r:any) => r._id !== reply._id)
            };
          }
          return p;
        });
        setPosts(updatedPosts);
      }
    };

    // Set up event listeners
    socket.on("postUpdate", handlePostUpdate);

    // Clean up event listeners
    return () => {
      socket.off("postUpdate", handlePostUpdate);
    };
  }, [socket, postId, reply._id, onReplyAdded, posts, setPosts]);

  return (
    <>
      <Box
        id={`reply-${reply._id}`}
        position="relative"
        px={0}
        py={2}
        ml={isNestedReply ? 4 : 0}
        w="full"
        bg={isHighlighted ? "rgba(0, 179, 116, 0.1)" : "transparent"}
        borderRadius="md"
        transition="background-color 0.3s ease"
        _before={isHighlighted ? {
          content: '""',
          position: "absolute",
          top: "-1px",
          right: "-1px",
          bottom: "-1px",
          left: "-1px",
          borderRadius: "md",
          border: "1px solid rgba(0, 179, 116, 0.3)",
          pointerEvents: "none"
        } : {}}
      >
        {/* Line connector for nested replies */}
        {isNestedReply && (
          <Box
            position="absolute"
            left="-12px"
            top="0"
            bottom="0"
            width="2px"
            height="100%"
            bg="rgba(113, 118, 123, 0.4)"
          />
        )}

        {/* Horizontal connector line */}
        {isNestedReply && (
          <Box
            position="absolute"
            left="-12px"
            top="15px"
            width="8px"
            height="2px"
            bg="rgba(113, 118, 123, 0.4)"
          />
        )}

        <Flex gap={2}>
          <Link to={`/${username}`}>
            <Avatar src={reply.userProfilePic} size="xs" />
          </Link>

          <Flex direction="column" flex={1}>
            {/* Comment Header */}
            <CommentHeader 
              reply={reply}
              username={username}
              timeAgo={timeAgo}
              currentUser={currentUser}
              onOpenDeleteAlert={() => setIsDeleteAlertOpen(true)}
              showNewBadge={showNewBadge}
            />

            {/* Reply content */}
            <Text
              fontSize="sm"
              color={mutedTextColor}
              mt={0.5}
              mb={1}
              overflowWrap="break-word"
              wordBreak="break-word"
              whiteSpace="pre-wrap"
              sx={{
                hyphens: "auto"
              }}
            >
              {reply.text || ""}
            </Text>

            {/* Reply image */}
            {reply.img && (
              <Box
                mt={1}
                mb={2}
                borderRadius="md"
                overflow="hidden"
                maxW="85%"
                borderWidth="1px"
                borderColor={borderColor}
                display="inline-block"
              >
                <Image
                  src={reply.img}
                  maxW="100%"
                  maxH="300px"
                  objectFit="contain"
                  borderRadius="md"
                />
              </Box>
            )}

            {/* Comment Actions */}
            <CommentActions 
              liked={liked}
              onLike={handleLikeComment}
              onReply={onOpen}
            />

            {/* Show/hide replies button */}
            <ShowRepliesButton 
              showReplies={showReplies}
              repliesCount={childReplies.length}
              onClick={() => setShowReplies(!showReplies)}
            />

            {/* Reply form */}
            {isOpen && (
              <ReplyForm 
                currentUser={currentUser}
                username={username}
                replyText={replyText}
                setReplyText={setReplyText}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                replyImage={replyImage}
                setReplyImage={setReplyImage}
                isSubmitting={isSubmitting}
                onSubmit={handleReplySubmit}
                onClose={onClose}
              />
            )}

            {/* Child replies */}
            {showReplies && hasReplies && (
              <ChildReplies 
                childReplies={childReplies}
                allReplies={allReplies}
                highlightId={highlightId}
                postId={postId}
                onReplyAdded={onReplyAdded}
              />
            )}
          </Flex>
        </Flex>
      </Box>
      {!lastReply && <Box h="4px" />}

      {/* Delete Confirmation Dialog */}
      <DeleteCommentAlert 
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        onDelete={handleDeleteComment}
        isDeleting={isDeleting}
        cancelRef={cancelRef}
      />
    </>
  );
};

export default Comment;
