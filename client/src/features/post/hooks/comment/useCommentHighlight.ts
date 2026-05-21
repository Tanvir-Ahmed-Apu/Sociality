import { useState, useEffect } from "react";

interface UseCommentHighlightProps {
  replyId: string;
  highlightId: string | null;
  childReplies: any[];
  allReplies: any[];
  setShowReplies: (show: boolean) => void;
}

export const useCommentHighlight = ({
  replyId,
  highlightId,
  childReplies,
  allReplies,
  setShowReplies,
}: UseCommentHighlightProps) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);

  const isThisReplyHighlighted = highlightId && replyId === highlightId;

  // Check if any child contains the highlighted reply
  const containsHighlightedReply =
    !isThisReplyHighlighted &&
    highlightId &&
    childReplies.some(
      (child: any) =>
        child._id === highlightId ||
        allReplies.some(
          (r: any) => r.parentReplyId === child._id && r._id === highlightId
        )
    );

  // Set highlighted state and show "New Reply" badge temporarily
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

  // Auto-expand replies if highlighted
  useEffect(() => {
    if (isHighlighted || containsHighlightedReply) {
      setShowReplies(true);
    }
  }, [isHighlighted, containsHighlightedReply, setShowReplies]);

  // Scroll to highlighted reply
  useEffect(() => {
    if (isHighlighted) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`reply-${replyId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, replyId]);

  return { isHighlighted, showNewBadge };
};
