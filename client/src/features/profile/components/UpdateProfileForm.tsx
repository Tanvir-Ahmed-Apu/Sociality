import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  FaEnvelope,
  FaIdCard,
  FaLock,
  FaQuoteLeft,
  FaUser,
} from "react-icons/fa";
import { ProfileAvatarPicker } from "./ProfileAvatarPicker";
import { ProfileCoverPicker } from "./ProfileCoverPicker";
import { ProfileFormInputs } from "../types";
import { RefObject } from "react";
import type { User } from "../../../types/models";

interface UpdateProfileTheme {
  bgColor: string;
  borderColor: string;
  textColor: string;
  labelColor: string;
  inputBg: string;
  inputBorderColor: string;
  inputHoverBorderColor: string;
  placeholderColor: string;
  dividerColor: string;
  cancelButtonBorder: string;
  cancelButtonHoverBg: string;
  cancelButtonHoverBorder: string;
  buttonTextColor: string;
  backButtonColor: string;
  helperTextColor: string;
}

interface UpdateProfileFormProps extends UpdateProfileTheme {
  user: User | null;
  inputs: ProfileFormInputs;
  setInputs: React.Dispatch<React.SetStateAction<ProfileFormInputs>>;
  updating: boolean;
  profilePicUrl: string | null;
  coverPicUrl: string | null;
  fileRef: RefObject<HTMLInputElement | null>;
  coverFileRef: RefObject<HTMLInputElement | null>;
  onProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
  onCancel: () => void;
  onBack: () => void;
}

export const UpdateProfileForm = ({
  user,
  inputs,
  setInputs,
  updating,
  profilePicUrl,
  coverPicUrl,
  fileRef,
  coverFileRef,
  onProfilePicChange,
  onCoverChange,
  onSubmit,
  onCancel,
  onBack,
  bgColor,
  borderColor,
  textColor,
  labelColor,
  inputBg,
  inputBorderColor,
  inputHoverBorderColor,
  placeholderColor,
  dividerColor,
  cancelButtonBorder,
  cancelButtonHoverBg,
  cancelButtonHoverBorder,
  buttonTextColor,
  backButtonColor,
  helperTextColor,
}: UpdateProfileFormProps) => {
  const inputStyles = {
    _placeholder: { color: placeholderColor },
    bg: inputBg,
    borderColor: inputBorderColor,
    borderRadius: "md",
    color: textColor,
    _hover: { borderColor: inputHoverBorderColor },
    _focus: {
      borderColor: "rgba(0, 179, 116, 0.6)",
      boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)",
    },
    transition: "all 0.3s ease",
  };

  return (
    <Box as="form" onSubmit={onSubmit}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        my={{ base: 2, md: 4 }}
        px={4}
        pb={{ base: "180px", md: "20px" }}
      >
        <Box alignSelf="flex-start" mb={{ base: 2, md: 3 }}>
          <IconButton
            icon={<ArrowBackIcon boxSize={5} />}
            aria-label="Go back"
            variant="ghost"
            color={backButtonColor}
            _hover={{
              color: "rgba(0, 179, 116, 0.9)",
              bg: "rgba(0, 179, 116, 0.1)",
            }}
            onClick={onBack}
            size="md"
            borderRadius="md"
          />
        </Box>

        <Stack
          spacing={{ base: 3, md: 5 }}
          w="full"
          maxW="md"
          bg={bgColor}
          rounded="xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
          p={{ base: 4, md: 6 }}
          className="glass-card"
          position="relative"
        >
          <Flex direction="column" align="center" mb={{ base: 1, md: 2 }}>
            <Heading
              lineHeight={1.1}
              fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}
              bgGradient="linear(to-r, rgba(0, 179, 116, 0.8), rgba(0, 121, 185, 0.8))"
              bgClip="text"
              fontWeight="bold"
            >
              Edit Your Profile
            </Heading>
            <Text fontSize="sm" color={labelColor} mt={{ base: 0.5, md: 1 }}>
              Update your personal information
            </Text>
          </Flex>

          <Divider borderColor={dividerColor} />

          <ProfileCoverPicker
            coverPicUrl={coverPicUrl}
            existingCoverPic={user?.coverPic}
            coverFileRef={coverFileRef}
            onCoverChange={onCoverChange}
            buttonLabel="Change Cover Photo"
          />

          <ProfileAvatarPicker
            profilePicUrl={profilePicUrl}
            existingProfilePic={user?.profilePic}
            fileRef={fileRef}
            onProfilePicChange={onProfilePicChange}
            avatarBorderColor={bgColor}
            buttonLabel="Change Avatar"
            buttonTextColor={buttonTextColor}
          />

          <Divider borderColor={dividerColor} />

          <Stack spacing={{ base: 2, md: 3 }}>
            <FormControl>
              <FormLabel fontWeight="medium" color={labelColor}>
                Full Name
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaUser color="rgba(0, 179, 116, 0.6)" />
                </InputLeftElement>
                <Input
                  placeholder="John Doe"
                  value={inputs.name}
                  onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                  type="text"
                  {...inputStyles}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium" color={labelColor}>
                Username
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaIdCard color="rgba(0, 179, 116, 0.6)" />
                </InputLeftElement>
                <Input
                  placeholder="johndoe"
                  value={inputs.username}
                  onChange={(e) =>
                    setInputs({ ...inputs, username: e.target.value })
                  }
                  type="text"
                  {...inputStyles}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium" color={labelColor}>
                Email Address
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="rgba(0, 179, 116, 0.6)" />
                </InputLeftElement>
                <Input
                  placeholder="your-email@example.com"
                  value={inputs.email}
                  onChange={(e) =>
                    setInputs({ ...inputs, email: e.target.value })
                  }
                  type="email"
                  {...inputStyles}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium" color={labelColor}>
                Bio
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaQuoteLeft color="rgba(0, 179, 116, 0.6)" />
                </InputLeftElement>
                <Textarea
                  placeholder="Tell us about yourself"
                  value={inputs.bio}
                  onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
                  pl={10}
                  minH={{ base: "60px", md: "80px" }}
                  resize="vertical"
                  {...inputStyles}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="medium" color={labelColor}>
                Password
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="rgba(0, 179, 116, 0.6)" />
                </InputLeftElement>
                <Input
                  placeholder="Leave blank to keep current password"
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                  type="password"
                  {...inputStyles}
                />
              </InputGroup>
              <Text fontSize="xs" color={helperTextColor} mt={1}>
                Must be at least 6 characters
              </Text>
            </FormControl>
          </Stack>

          <Divider borderColor={dividerColor} mt={{ base: 1, md: 2 }} />

          <Stack
            spacing={{ base: 2, md: 3 }}
            direction={["column", "row"]}
            pt={{ base: 1, md: 2 }}
          >
            <Button
              bg="transparent"
              color={buttonTextColor}
              borderWidth="1px"
              borderColor={cancelButtonBorder}
              _hover={{
                bg: cancelButtonHoverBg,
                transform: "translateY(-2px)",
                borderColor: cancelButtonHoverBorder,
              }}
              transition="all 0.2s"
              borderRadius="md"
              fontWeight="medium"
              w="full"
              onClick={onCancel}
              boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
              _active={{
                transform: "scale(0.98)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              Cancel
            </Button>
            <Button
              bg="rgba(0, 179, 116, 0.2)"
              color={buttonTextColor}
              borderWidth="1px"
              borderColor="rgba(0, 179, 116, 0.5)"
              _hover={{
                bg: "rgba(0, 179, 116, 0.3)",
                transform: "translateY(-2px)",
                borderColor: "rgba(0, 179, 116, 0.7)",
              }}
              transition="all 0.2s"
              borderRadius="md"
              fontWeight="medium"
              w="full"
              type="button"
              onClick={onSubmit}
              isLoading={updating}
              boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
              _active={{
                transform: "scale(0.98)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </Box>
  );
};
