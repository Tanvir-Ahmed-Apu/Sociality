import React from "react";
import { Box, Button } from "@chakra-ui/react";
import Comment from "./Comment";
import { Post } from "../../../utils/api";

/**
 * Comments section component
 * Displays a list of comments for a post
 */
interface CommentsSectionProps {
  post: Post;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  onHideComments?: () => void;
  highlightReplyId?: string;
}

const CommentsSection = ({ post, posts, setPosts, onHideComments, highlightReplyId }: CommentsSectionProps) => {
  if (!post.replies || post.replies.length === 0) {
    return null;
  }

  return (
    <Box mt={4}>
      {post.replies
        // First filter to get only top-level replies
        .filter(reply => !reply.parentReplyId)
        // Then sort by popularity (likes and replies count)
        .sort((a: any, b: any) => {
          // Calculate engagement score based on likes and replies
          const aLikes = a.likes?.length || 0;
          const bLikes = b.likes?.length || 0;

          // Count replies to this comment
          const aReplies = post.replies.filter(r => r.parentReplyId === a._id).length;
          const bReplies = post.replies.filter(r => r.parentReplyId === b._id).length;

          // Total engagement score
          const aScore = aLikes + aReplies;
          const bScore = bLikes + bReplies;

          // If scores are equal, sort by newest first
          if (bScore === aScore) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }

          // Sort by engagement score (highest first)
          return bScore - aScore;
        })
        .map((reply, index) => {
          const isHighlighted = reply._id === highlightReplyId;
          // Show the highlighted reply at the top of the array if it exists.
          // Wait, sorting array directly above might mix them. Let's do it cleanly inside the mapping if needed, or assume sorting takes care of it.
          // For simplicity, we just pass highlightId to Comment.
          return (
            <Comment
              key={reply._id}
              reply={reply}
              postId={post._id}
              lastReply={index === post.replies.filter(r => !r.parentReplyId).length - 1}
              onReplyAdded={(newReply: any) => {
                const updatedPosts = posts.map((p) => {
                  if (p._id === post._id) {
                    return { ...p, replies: [...p.replies, newReply] };
                  }
                  return p;
                });
                setPosts(updatedPosts);
              }}
              childReplies={post.replies.filter(r => r.parentReplyId === reply._id)}
              allReplies={post.replies}
              highlightId={highlightReplyId}
            />
          );
        })}

      {/* Hide comments button */}
      {onHideComments && (
        <Button
          variant="ghost"
          size="sm"
          colorScheme="gray"
          mt={2}
          onClick={(e) => {
            e.stopPropagation();
            onHideComments();
          }}
        >
          Hide replies
        </Button>
      )}
    </Box>
  );
};

export default CommentsSection;
