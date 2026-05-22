import { useState, useEffect, useRef, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { userAtom, postsAtom } from "../../../atoms";
import { User, Post, fetchWithSession } from "../../../utils/api";
import useShowToast from "../../../hooks/useShowToast";
import { useSocket } from "../../../hooks/useSocket";
import {
	fileToDataUrl,
	removeReplyFromPost,
	updatePost,
	updateReplyInPost,
} from "../utils/feedUpdates";

interface UseCommentProps {
  reply: any;
  postId: string;
  onReplyAdded: (reply: any) => void;
  childReplies: any[];
  allReplies: any[];
  highlightId: string | null;
  onClose: () => void;
}

export const useComment = ({
  reply,
  postId,
  onReplyAdded,
  childReplies,
  allReplies,
  highlightId,
  onClose,
}: UseCommentProps) => {
  const navigate = useNavigate();
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

  // Initialize like state based on reply likes
  useEffect(() => {
    if (reply?.likes && currentUser) {
      setLiked(reply.likes.includes(currentUser?._id));
    }
  }, [reply?.likes, currentUser]);

  // Handle like/unlike for comment
  const handleLikeComment = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to like a comment", "error");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      // Set liked state optimistically
      setLiked(prev => !prev);

      const res = await fetchWithSession(`/api/posts/comment/like/${postId}/${reply._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to like/unlike comment' }));
        // Revert optimistic update if there was an error
        setLiked(prev => !prev);
        throw new Error(errorData.error || 'Failed to like/unlike comment');
      }

      setPosts(
        updateReplyInPost(posts, postId, reply._id, (r) => {
          const isCurrentlyLiked = (r.likes as string[]).includes(currentUser!._id);
          const newLikes = isCurrentlyLiked
            ? (r.likes as string[]).filter((id) => id !== currentUser!._id)
            : [...((r.likes as string[]) || []), currentUser!._id];
          return { ...r, likes: newLikes };
        })
      );
      showToast("Success", !liked ? "Comment liked" : "Comment unliked", "success");
    } catch (error: any) {
      showToast("Error", error.message || "Failed to like/unlike comment", "error");
    } finally {
      setIsLiking(false);
    }
  }, [currentUser, isLiking, postId, reply._id, posts, setPosts, showToast, liked]);

  // Handle reply submission
  const handleReplySubmit = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to reply", "error");
      return;
    }

    if (!replyText.trim() && !replyImage) {
      showToast("Error", "Reply cannot be empty", "error");
      return;
    }

    if (!reply || !reply._id || !postId) {
      showToast("Error", "Missing required reply information", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const imgUrl = replyImage ? await fileToDataUrl(replyImage) : null;

      // Create new reply object with proper fields
      const newReply = {
        text: replyText,
        img: imgUrl,
        parentReplyId: reply._id,
        username: currentUser?.username,
        userProfilePic: currentUser?.profilePic,
        userId: currentUser?._id,
        createdAt: new Date().toISOString(),
        _id: `temp-${Date.now()}`
      };

      // Optimistically update UI
      if (onReplyAdded) {
        onReplyAdded(newReply);
      }

      setShowReplies(true);

      const res = await fetchWithSession(`/api/posts/reply/${postId}/comment/${reply._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: replyText,
          img: imgUrl,
          parentReplyId: reply._id,
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

      toast({
        title: "Success",
        description: "Reply posted",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset form
      setReplyText("");
      setReplyImage(null);
      setImagePreview(null);
      onClose();
    } catch (error: any) {
      showToast("Error", error.message || "Failed to reply to comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, replyText, replyImage, reply, postId, onReplyAdded, onClose, toast, showToast]);

  // Handle comment deletion
  const handleDeleteComment = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to delete a comment", "error");
      return;
    }

    setIsDeleting(true);
    try {
      setPosts(removeReplyFromPost(posts, postId, reply._id));

      setIsDeleteAlertOpen(false);

      const res = await fetchWithSession(`/api/posts/comment/${postId}/${reply._id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete comment' }));
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      showToast("Success", "Comment deleted successfully", "success");
    } catch (error: any) {
      showToast("Error", error.message || "Failed to delete comment", "error");

      const originalPost = posts.find((p: any) => p._id === postId);
      if (originalPost) {
        setPosts(updatePost(posts, postId, () => originalPost));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [currentUser, postId, reply._id, posts, setPosts, showToast]);

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

  // Set highlighted state
  useEffect(() => {
    if (isThisReplyHighlighted) {
      setIsHighlighted(true);
      setShowNewBadge(true);

      const timer = setTimeout(() => {
        setShowNewBadge(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isThisReplyHighlighted]);

  // Check if this reply contains the highlighted reply in its children
  const containsHighlightedReply = !isThisReplyHighlighted && highlightId && childReplies.some(
    (child: any) => child._id === highlightId || allReplies.some(
      (r: any) => r.parentReplyId === child._id && r._id === highlightId
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
      const timer = setTimeout(() => {
        const element = document.getElementById(`reply-${reply._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, reply._id]);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePostUpdate = (data: any) => {
      if (data.postId !== postId) return;

      if (data.type === "nestedReply" && data.parentReplyId === reply._id) {
        setShowReplies(true);
        if (onReplyAdded) {
          onReplyAdded(data.reply);
        }
      }

      if (data.type === "commentDeleted" && data.commentId === reply._id) {
        setPosts(removeReplyFromPost(posts, postId, reply._id));
      }
    };

    socket.on("postUpdate", handlePostUpdate);

    return () => {
      socket.off("postUpdate", handlePostUpdate);
    };
  }, [socket, postId, reply._id, onReplyAdded, posts, setPosts]);

  return {
    replyText,
    setReplyText,
    replyImage,
    setReplyImage,
    imagePreview,
    setImagePreview,
    isSubmitting,
    liked,
    isLiking,
    showReplies,
    setShowReplies,
    isDeleting,
    isDeleteAlertOpen,
    setIsDeleteAlertOpen,
    cancelRef,
    currentUser,
    handleLikeComment,
    handleReplySubmit,
    handleDeleteComment,
    isNestedReply,
    username,
    timeAgo,
    hasReplies,
    isHighlighted,
    showNewBadge,
  };
};
