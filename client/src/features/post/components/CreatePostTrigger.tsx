import { memo } from "react";
import { Box, Flex, Avatar, Text, Button, useColorModeValue } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

interface CreatePostTriggerProps {
  inline?: boolean;
  hideTrigger?: boolean;
  profilePic?: string;
  username?: string;
  onOpen: () => void;
}

const CreatePostTrigger = memo(({ inline, hideTrigger, profilePic, username, onOpen }: CreatePostTriggerProps) => {
  const inlineBgHover = useColorModeValue("gray.50", "whiteAlpha.50");
  const inlineBorderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const inlineOutlineBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const inlineTextColor = useColorModeValue("gray.600", "gray.400");
  const floatBg = "brand.primary.500";
  const floatHoverBg = "brand.primary.400";
  const floatBorderColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)");

  if (inline) {
    return (
      <Box
        p={4}
        borderBottom="1px solid"
        borderColor={inlineBorderColor}
        onClick={onOpen}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: inlineBgHover }}
      >
        <Flex gap={4} align="center">
          <Avatar size="md" src={profilePic} name={username} />
          <Text color="gray.500" fontSize="md">Start a thread...</Text>
          <Button
            ml="auto"
            size="sm"
            variant="outline"
            borderColor={inlineOutlineBorder}
            borderRadius="full"
            fontWeight="600"
            color={inlineTextColor}
          >
            Post
          </Button>
        </Flex>
      </Box>
    );
  }

  if (!hideTrigger) {
    return (
      <Box
        position={"fixed"}
        bottom={10}
        right={5}
        bg={floatBg}
        color="white"
        onClick={onOpen}
        borderRadius="full"
        boxShadow="0 0 20px rgba(0, 179, 116, 0.3)"
        width="50px"
        height="50px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderWidth="1px"
        borderColor={floatBorderColor}
        zIndex={999}
        cursor="pointer"
        transition="all 0.3s ease"
        _hover={{
          bg: floatHoverBg,
          transform: "scale(1.1) rotate(180deg)",
          boxShadow: "0 0 25px rgba(0, 179, 116, 0.5)"
        }}
        className="brand-button"
      >
        <AddIcon boxSize={6} />
      </Box>
    );
  }

  return null;
});

export default CreatePostTrigger;
