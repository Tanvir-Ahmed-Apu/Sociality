import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { RefObject } from "react";

interface ProfileAvatarPickerProps {
  profilePicUrl: string | null;
  existingProfilePic?: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarBorderColor?: string;
  buttonLabel?: string;
  buttonTextColor?: string;
}

export const ProfileAvatarPicker = ({
  profilePicUrl,
  existingProfilePic,
  fileRef,
  onProfilePicChange,
  avatarBorderColor = "#101010",
  buttonLabel = "Choose Avatar",
  buttonTextColor = "white",
}: ProfileAvatarPickerProps) => (
  <FormControl id="userName">
    <Flex
      direction="column"
      align="center"
      justify="center"
      mt="-60px"
      position="relative"
      zIndex={2}
    >
      <Box
        position="relative"
        mb={4}
        cursor="pointer"
        onClick={() => fileRef.current?.click()}
        transition="all 0.3s ease"
        _hover={{ transform: "scale(1.05)" }}
      >
        <Avatar
          size={{ base: "xl", md: "2xl" }}
          src={profilePicUrl || existingProfilePic}
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
          border="4px solid"
          borderColor={avatarBorderColor}
        />
        <Box
          position="absolute"
          bottom="0"
          right="0"
          bg="rgba(0, 179, 116, 0.8)"
          p={1}
          borderRadius="full"
          boxShadow="0 2px 6px rgba(0, 0, 0, 0.2)"
        >
          <FaUser color="white" size={14} />
        </Box>
      </Box>
      <Button
        size="sm"
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
        onClick={() => fileRef.current?.click()}
        boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
        px={4}
        py={2}
        type="button"
        _active={{
          transform: "scale(0.98)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
        leftIcon={<FaUser size={14} />}
      >
        {buttonLabel}
      </Button>
      <Input
        type="file"
        hidden
        ref={fileRef as any}
        onChange={onProfilePicChange}
        accept="image/*"
      />
    </Flex>
  </FormControl>
);
