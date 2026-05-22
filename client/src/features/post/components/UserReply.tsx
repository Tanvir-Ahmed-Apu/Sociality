import { Box, Flex, Text } from "@chakra-ui/react";
import { Reply } from "../../../utils/api";

/**
 * User reply component
 * Displays a user's reply to a post with a vertical line connector
 */
interface UserReplyProps {
  reply: Reply;
  borderColor: string;
}

const UserReply = ({ reply, borderColor }: UserReplyProps) => {
  if (!reply) return null;

  return (
    <Box
      mt={3}
      p={3}
      borderRadius="xl"
      bg="#101010" 
      className="threads-post-card" 
      position="relative"
    >
    
      <Box
        position="absolute"
        left="12px"
        top="-3px" 
        width="2px"
        height="calc(100% - 15px)" 
        bg="rgba(113, 118, 123, 0.4)"
      />

      <Flex pl={6}>
        <Box>
          <Text fontSize="sm" fontStyle="italic" color="gray.light">
            Your reply:
          </Text>
          <Text
            fontSize="sm"
            overflowWrap="break-word"
            wordBreak="break-word"
            whiteSpace="pre-wrap"
            sx={{
              hyphens: "auto"
            }}
          >
            {reply.text}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default UserReply;
