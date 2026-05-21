import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../../atoms";
import { User, Post, fetchWithSession } from "../../../../utils/api";
import useShowToast from "../../../../hooks/useShowToast";
import { useRef } from "react";

interface UseCommentDeleteProps {
  replyId: string;
  postId: string;
}

export const useCommentDelete = ({ replyId, postId }: UseCommentDeleteProps) => {
  const currentUser = useRecoilValue(userAtom) as User | null;
  const [posts, setPosts] = useRecoilState(postsAtom) as [Post[], any];
  const showToast = useShowToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const cancelRef = useRef<any>(null);

  const handleDeleteComment = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to delete a comment", "error");
      return;
    }

    setIsDeleting(true);
    try {
      // Optimistic update — remove comment from UI immediately
      const updatedPosts = posts.map((p: any) => {
        if (p._id === postId) {
          return {
            ...p,
            replies: p.replies.filter((r: any) => r._id !== replyId),
          };
        }
        return p;
      });
      setPosts(updatedPosts);
      setIsDeleteAlertOpen(false);

      const res = await fetchWithSession(`/api/posts/comment/${postId}/${replyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete comment' }));
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      showToast("Success", "Comment deleted successfully", "success");
    } catch (error: any) {
      showToast("Error", error.message || "Failed to delete comment", "error");

      // Revert optimistic update on error
      const originalPost = posts.find((p: any) => p._id === postId);
      if (originalPost) {
        const revertedPosts = posts.map((p: any) =>
          p._id === postId ? originalPost : p
        );
        setPosts(revertedPosts);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [currentUser, postId, replyId, posts, setPosts, showToast]);

  return {
    isDeleting,
    isDeleteAlertOpen,
    setIsDeleteAlertOpen,
    cancelRef,
    handleDeleteComment,
  };
};
