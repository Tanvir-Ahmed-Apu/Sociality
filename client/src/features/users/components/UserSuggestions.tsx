import React from 'react';
import {
  Box,
  Flex,
  Avatar,
  Text,
  useColorModeValue,
  Spinner
} from '@chakra-ui/react';

interface UserSuggestionsProps {
  suggestions?: any[];
  isLoading?: boolean;
  onSelectUser: (user: any) => void;
  selectedIndex?: number;
  searchText?: string;
}

const UserSuggestions: React.FC<UserSuggestionsProps> = ({ 
  suggestions = [], 
  isLoading = false, 
  onSelectUser, 
  selectedIndex = -1,
  searchText = ""
}) => {
  const bgColor = useColorModeValue("white", "#1a1a1a");
  const borderColor = useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.08)");
  const hoverBgColor = useColorModeValue("gray.50", "#1e1e1e");
  const selectedBgColor = useColorModeValue("rgba(0, 179, 116, 0.1)", "rgba(0, 179, 116, 0.15)");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  if (isLoading) {
    return (
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        boxShadow="lg"
        zIndex={1000}
        p={3}
      >
        <Flex align="center" justify="center">
          <Spinner size="sm" color="#00B374" />
          <Text ml={2} fontSize="sm" color={mutedTextColor}>
            Loading suggestions...
          </Text>
        </Flex>
      </Box>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  // Backend now handles filtering, so we use suggestions directly
  const filteredSuggestions = suggestions;

  return (
    <Box
      position="absolute"
      top="100%"
      left={0}
      right={0}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="lg"
      zIndex={1000}
      maxH="200px"
      overflowY="auto"
    >
      {filteredSuggestions.map((user, index) => (
        <Flex
          key={user._id}
          align="center"
          p={3}
          cursor="pointer"
          bg={index === selectedIndex ? selectedBgColor : "transparent"}
          _hover={{ bg: index === selectedIndex ? selectedBgColor : hoverBgColor }}
          onClick={() => onSelectUser(user)}
          borderBottom={index < filteredSuggestions.length - 1 ? "1px solid" : "none"}
          borderBottomColor={borderColor}
        >
          <Avatar
            size="sm"
            src={user.profilePic}
            name={user.username}
            mr={3}
          />
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              {user.username}
            </Text>
            {user.name && (
              <Text fontSize="xs" color={mutedTextColor}>
                {user.name}
              </Text>
            )}
          </Box>
        </Flex>
      ))}
    </Box>
  );
};

export default UserSuggestions;
