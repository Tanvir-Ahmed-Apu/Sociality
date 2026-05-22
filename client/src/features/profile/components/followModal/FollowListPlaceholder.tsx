import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";

interface FollowListPlaceholderProps {
  isLoading: boolean;
  isEmpty: boolean;
  loadingLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const FollowListPlaceholder = ({
  isLoading,
  isEmpty,
  loadingLabel,
  emptyTitle,
  emptyDescription,
}: FollowListPlaceholderProps) => {
  if (isLoading) {
    return (
      <Center py={8}>
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>{loadingLabel}</Text>
        </VStack>
      </Center>
    );
  }

  if (isEmpty) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="18px" fontWeight={500} mb={2}>
          {emptyTitle}
        </Text>
        <Text fontSize="14px" color="whiteAlpha.600">
          {emptyDescription}
        </Text>
      </Box>
    );
  }

  return null;
};
