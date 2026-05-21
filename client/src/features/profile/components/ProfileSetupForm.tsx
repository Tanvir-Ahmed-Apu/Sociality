import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { FaIdCard, FaQuoteLeft, FaUser } from "react-icons/fa";
import type { User } from "../../../types/models";
import { ProfileAvatarPicker } from "./ProfileAvatarPicker";
import { ProfileCoverPicker } from "./ProfileCoverPicker";
import { ProfileFormErrors, ProfileFormInputs } from "../types";
import { RefObject } from "react";

interface ProfileSetupFormProps {
  user: User | null;
  inputs: ProfileFormInputs;
  setInputs: React.Dispatch<React.SetStateAction<ProfileFormInputs>>;
  errors: ProfileFormErrors;
  loading: boolean;
  profilePicUrl: string | null;
  coverPicUrl: string | null;
  fileRef: RefObject<HTMLInputElement | null>;
  coverFileRef: RefObject<HTMLInputElement | null>;
  onProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export const ProfileSetupForm = ({
  user,
  inputs,
  setInputs,
  errors,
  loading,
  profilePicUrl,
  coverPicUrl,
  fileRef,
  coverFileRef,
  onProfilePicChange,
  onCoverChange,
  onSubmit,
}: ProfileSetupFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <Flex direction="column" align="center" justify="center" my={6} px={4}>
      <Stack
        spacing={6}
        w="full"
        maxW="md"
        bg="#101010"
        rounded="xl"
        borderWidth="1px"
        borderColor="gray.700"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
        p={6}
        className="glass-card"
        position="relative"
      >
        <Flex direction="column" align="center" mb={2}>
          <Heading
            lineHeight={1.1}
            fontSize={{ base: "2xl", sm: "3xl" }}
            bgGradient="linear(to-r, rgba(0, 179, 116, 0.8), rgba(0, 121, 185, 0.8))"
            bgClip="text"
            fontWeight="bold"
          >
            Complete Your Profile
          </Heading>
          <Text fontSize="sm" color="gray.400" mt={1}>
            {user?.isGoogleUser
              ? "Set up your profile to get started with Sociality"
              : "Complete your profile to start connecting with others"}
          </Text>
        </Flex>

        <Divider borderColor="rgba(0, 179, 116, 0.2)" />

        {user?.isGoogleUser && (
          <Alert
            status="success"
            borderRadius="md"
            bg="rgba(0, 179, 116, 0.1)"
            borderColor="rgba(0, 179, 116, 0.3)"
            borderWidth="1px"
          >
            <AlertIcon color="rgba(0, 179, 116, 0.8)" />
            <Box>
              <Text fontWeight="semibold" color="white">
                Google Account Connected
              </Text>
              <Text fontSize="sm" color="gray.300">
                Your Google account has been successfully connected. Please
                complete your profile setup to start using Sociality.
              </Text>
            </Box>
          </Alert>
        )}

        <ProfileCoverPicker
          coverPicUrl={coverPicUrl}
          existingCoverPic={user?.coverPic}
          coverFileRef={coverFileRef}
          onCoverChange={onCoverChange}
        />

        <ProfileAvatarPicker
          profilePicUrl={profilePicUrl}
          existingProfilePic={user?.profilePic}
          fileRef={fileRef}
          onProfilePicChange={onProfilePicChange}
        />

        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight="medium" color="gray.300">
              Display Name *
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaUser color="rgba(0, 179, 116, 0.6)" />
              </InputLeftElement>
              <Input
                placeholder="Enter your display name"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                _placeholder={{ color: "gray.500" }}
                type="text"
                bg="rgba(0, 0, 0, 0.2)"
                borderColor="gray.600"
                borderRadius="md"
                _hover={{ borderColor: "gray.500" }}
                _focus={{
                  borderColor: "rgba(0, 179, 116, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)",
                }}
                transition="all 0.3s ease"
              />
            </InputGroup>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.username}>
            <FormLabel fontWeight="medium" color="gray.300">
              Username *
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaIdCard color="rgba(0, 179, 116, 0.6)" />
              </InputLeftElement>
              <Input
                placeholder="Choose a unique username"
                value={inputs.username}
                onChange={(e) =>
                  setInputs({ ...inputs, username: e.target.value })
                }
                _placeholder={{ color: "gray.500" }}
                type="text"
                bg="rgba(0, 0, 0, 0.2)"
                borderColor="gray.600"
                borderRadius="md"
                _hover={{ borderColor: "gray.500" }}
                _focus={{
                  borderColor: "rgba(0, 179, 116, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)",
                }}
                transition="all 0.3s ease"
              />
            </InputGroup>
            <FormErrorMessage>{errors.username}</FormErrorMessage>
            <Text fontSize="xs" color="gray.500" mt={1}>
              This will be your unique identifier on Sociality
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="medium" color="gray.300">
              Bio
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaQuoteLeft color="rgba(0, 179, 116, 0.6)" />
              </InputLeftElement>
              <Textarea
                placeholder="Tell us about yourself (optional)"
                value={inputs.bio}
                onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
                _placeholder={{ color: "gray.500" }}
                bg="rgba(0, 0, 0, 0.2)"
                borderColor="gray.600"
                borderRadius="md"
                _hover={{ borderColor: "gray.500" }}
                _focus={{
                  borderColor: "rgba(0, 179, 116, 0.6)",
                  boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)",
                }}
                transition="all 0.3s ease"
                pl={10}
                minH="100px"
                resize="vertical"
              />
            </InputGroup>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {inputs.bio.length}/200 characters
            </Text>
          </FormControl>
        </Stack>

        <Stack spacing={6} pt={2}>
          <Button
            bg="linear-gradient(135deg, rgba(0, 179, 116, 0.8) 0%, rgba(0, 121, 185, 0.8) 100%)"
            color="white"
            size="lg"
            _hover={{
              bg: "linear-gradient(135deg, rgba(0, 179, 116, 0.9) 0%, rgba(0, 121, 185, 0.9) 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(0, 179, 116, 0.3)",
            }}
            _active={{
              transform: "scale(0.98)",
              boxShadow: "0 2px 10px rgba(0, 179, 116, 0.2)",
            }}
            transition="all 0.3s ease"
            borderRadius="md"
            fontWeight="semibold"
            boxShadow="0 4px 15px rgba(0, 179, 116, 0.2)"
            isLoading={loading}
            loadingText="Setting up your profile..."
            type="submit"
            w="full"
          >
            Complete Setup
          </Button>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            * Required fields
          </Text>
        </Stack>
      </Stack>
    </Flex>
  </form>
);
