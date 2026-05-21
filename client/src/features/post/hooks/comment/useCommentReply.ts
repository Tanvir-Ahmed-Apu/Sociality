import { useState, useCallback } from "react";
import { useRecoilValue } from "recoil";
import { useToast } from "@chakra-ui/react";
import { userAtom } from "../../../../atoms";
import { User, fetchWithSession } from "../../../../utils/api";
import useShowToast from "../../../../hooks/useShowToast";

interface UseCommentReplyProps {
  replyId: string;
  postId: string;
  onReplyAdded?: (reply: any) => void;
  onClose: () => void;
  setShowReplies: (show: boolean) => void;
}

export const useCommentReply = ({
  replyId,
  postId,
  onReplyAdded,
  onClose,
  setShowReplies,
}: UseCommentReplyProps) => {
  const currentUser = useRecoilValue(userAtom) as User | null;
  const showToast = useShowToast();
  const toast = useToast();

  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = useCallback(async () => {
    if (!currentUser) {
      showToast("Error", "You must be logged in to reply", "error");
      return;
    }

    if (!replyText.trim() && !replyImage) {
      showToast("Error", "Reply cannot be empty", "error");
      return;
    }

    if (!replyId || !postId) {
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
        imgUrl = (await imgPromise) as string;
      }

      // Create optimistic reply object
      const newReply = {
        text: replyText,
        img: imgUrl,
        parentReplyId: replyId,
        username: currentUser.username,
        userProfilePic: currentUser.profilePic,
        userId: currentUser._id,
        createdAt: new Date().toISOString(),
        _id: `temp-${Date.now()}`,
      };

      // Optimistically update UI
      if (onReplyAdded) {
        onReplyAdded(newReply);
      }

      setShowReplies(true);

      const res = await fetchWithSession(`/api/posts/reply/${postId}/comment/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: replyText,
          img: imgUrl,
          parentReplyId: replyId,
        }),
      });

      if (res.ok) {
        await res.json();
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
  }, [currentUser, replyText, replyImage, replyId, postId, onReplyAdded, onClose, toast, showToast, setShowReplies]);

  return {
    replyText,
    setReplyText,
    replyImage,
    setReplyImage,
    imagePreview,
    setImagePreview,
    isSubmitting,
    handleReplySubmit,
  };
};
