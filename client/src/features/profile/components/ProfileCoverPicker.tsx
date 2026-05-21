import {
  Box,
  Button,
  Flex,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { FiCamera } from "react-icons/fi";
import { RefObject } from "react";

interface ProfileCoverPickerProps {
  coverPicUrl: string | null;
  existingCoverPic?: string;
  coverFileRef: RefObject<HTMLInputElement | null>;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonLabel?: string;
}

export const ProfileCoverPicker = ({
  coverPicUrl,
  existingCoverPic,
  coverFileRef,
  onCoverChange,
  buttonLabel = "Choose Cover Photo",
}: ProfileCoverPickerProps) => {
  const coverSrc = coverPicUrl || existingCoverPic;

  return (
    <FormControl id="coverPic">
      <Box
        w="full"
        h={{ base: "120px", md: "160px" }}
        bg={coverSrc ? `url(${coverSrc})` : "brand.primary.500"}
        bgSize="cover"
        bgPosition="center"
        borderRadius="xl"
        position="relative"
        overflow="hidden"
        mb={4}
        cursor="pointer"
        onClick={() => coverFileRef.current?.click()}
        transition="all 0.3s ease"
        _hover={{ opacity: 0.9 }}
      >
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.400"
          align="center"
          justify="center"
          opacity={0}
          _hover={{ opacity: 1 }}
          transition="opacity 0.2s"
        >
          <Button
            leftIcon={<FiCamera />}
            size="sm"
            variant="solid"
            colorScheme="whiteAlpha"
            pointerEvents="none"
            type="button"
          >
            {buttonLabel}
          </Button>
        </Flex>
        <Input
          type="file"
          hidden
          ref={coverFileRef}
          onChange={onCoverChange}
          accept="image/*"
        />
      </Box>
    </FormControl>
  );
};
