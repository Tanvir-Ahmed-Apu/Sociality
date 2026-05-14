// v2
import { useEffect } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { handleOAuthPopupCallback } from '../../utils/oauthPopup';

/**
 * OAuth Popup Callback Component
 * This component handles the OAuth callback in a popup window
 * and communicates the result back to the parent window
 */
const OAuthPopupCallback = () => {
  useEffect(() => {
    // Handle the OAuth callback
    handleOAuthPopupCallback();
  }, []);

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <VStack spacing={4}>
        <Spinner size="lg" color="teal.500" />
        <Text fontSize="lg" color="gray.600">
          Completing authentication...
        </Text>
        <Text fontSize="sm" color="gray.500">
          This window will close automatically
        </Text>
      </VStack>
    </Box>
  );
};

export default OAuthPopupCallback;
