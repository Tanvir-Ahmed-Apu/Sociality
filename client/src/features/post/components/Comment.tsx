import { Avatar, Flex, Text, Box, Image, useDisclosure, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useComment } from "../hooks/useComment";

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
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    replyText,
    setReplyText,
    replyImage,
    setReplyImage,
    imagePreview,
    setImagePreview,
    isSubmitting,
    liked,
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
  } = useComment({
    reply,
    postId,
    onReplyAdded,
    childReplies,
    allReplies,
    highlightId,
    onClose,
  });

  // Theme-aware colors
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Check if reply is valid before proceeding
  if (!reply || !reply._id) {
    console.log("Invalid reply object:", reply);
    return null;
  }

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
