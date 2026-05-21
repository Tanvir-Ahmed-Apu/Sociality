import { useState, useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../../atoms";
import { User, Post, fetchWithSession } from "../../../../utils/api";
import useShowToast from "../../../../hooks/useShowToast";

interface UseCommentLikeProps {
  replyId: string;
  replyLikes: string[] | undefined;
  postId: string;
}

export const useCommentLike = ({ replyId, replyLikes, postId }: UseCommentLikeProps) => {
  const currentUser = useRecoilValue(userAtom) as User | null;
  const [posts, setPosts] = useRecoilState(postsAtom) as [Post[], any];
  const showToast = useShowToast();

  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Initialize like state based on reply likes
  useEffect(() => {
    if (replyLikes && currentUser) {
      setLiked(replyLikes.includes(currentUser._id));
    }
  }, [replyLikes, currentUser]);

  const handleLikeComment = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to like a comment", "error");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      // Optimistic update
      setLiked(prev => !prev);

      const res = await fetchWithSession(`/api/posts/comment/like/${postId}/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to like/unlike comment' }));
        setLiked(prev => !prev);
        throw new Error(errorData.error || 'Failed to like/unlike comment');
      }

      // Update posts state to reflect the change
      const updatedPosts = posts.map((p: any) => {
        if (p._id === postId) {
          return {
            ...p,
            replies: p.replies.map((r: any) => {
              if (r._id === replyId) {
                const isCurrentlyLiked = r.likes.includes(currentUser._id);
                const newLikes = isCurrentlyLiked
                  ? r.likes.filter((id: any) => id !== currentUser._id)
                  : [...(r.likes || []), currentUser._id];
                return { ...r, likes: newLikes };
              }
              return r;
            }),
          };
        }
        return p;
      });

      setPosts(updatedPosts);
      showToast("Success", !liked ? "Comment liked" : "Comment unliked", "success");
    } catch (error: any) {
      showToast("Error", error.message || "Failed to like/unlike comment", "error");
    } finally {
      setIsLiking(false);
    }
  }, [currentUser, isLiking, postId, replyId, posts, setPosts, showToast, liked]);

  return { liked, isLiking, handleLikeComment };
};
