import { memo } from "react";
import { Box, Image, IconButton, HStack, Circle, CloseButton, useColorModeValue } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, AddIcon } from "@chakra-ui/icons";

interface CreatePostImagePreviewProps {
  imgUrls: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  onCloseImage: (index: number) => void;
  onAddMoreClick: () => void;
}

const CreatePostImagePreview = memo(({
  imgUrls,
  currentImageIndex,
  setCurrentImageIndex,
  onCloseImage,
  onAddMoreClick,
}: CreatePostImagePreviewProps) => {
  const containerBorder = useColorModeValue("gray.300", "rgba(255, 255, 255, 0.1)");
  const hoverBoxShadow = "0 6px 16px rgba(0, 179, 116, 0.2)";

  if (imgUrls.length === 0) return null;

  return (
    <Box
      mt={2}
      mb={4}
      position={"relative"}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={containerBorder}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
      transition="all 0.3s ease"
      _hover={{ boxShadow: hoverBoxShadow }}
      className="glass-card"
    >
      {/* Image */}
      <Image
        src={imgUrls[currentImageIndex]}
        alt={`Selected image ${currentImageIndex + 1}`}
        maxH="300px"
        objectFit="cover"
        w="full"
      />

      {/* Navigation arrows */}
      {imgUrls.length > 1 && (
        <>
          {/* Left arrow */}
          {currentImageIndex > 0 && (
            <IconButton
              icon={<ChevronLeftIcon boxSize={6} />}
              aria-label="Previous image"
              position="absolute"
              left={2}
              top="50%"
              transform="translateY(-50%)"
              borderRadius="full"
              bg="rgba(0,0,0,0.7)"
              color="white"
              _hover={{ bg: "rgba(0,0,0,0.8)" }}
              onClick={() => setCurrentImageIndex(prev => prev - 1)}
            />
          )}

          {/* Right arrow */}
          {currentImageIndex < imgUrls.length - 1 && (
            <IconButton
              icon={<ChevronRightIcon boxSize={6} />}
              aria-label="Next image"
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              borderRadius="full"
              bg="rgba(0,0,0,0.7)"
              color="white"
              _hover={{ bg: "rgba(0,0,0,0.8)" }}
              onClick={() => setCurrentImageIndex(prev => prev + 1)}
            />
          )}
        </>
      )}

      {/* Image indicators */}
      {imgUrls.length > 1 && (
        <HStack
          spacing={1}
          position="absolute"
          bottom={2}
          left="50%"
          transform="translateX(-50%)"
          justify="center"
        >
          {imgUrls.map((_, index) => (
            <Circle
              key={index}
              size={2}
              bg={index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)"}
              cursor="pointer"
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </HStack>
      )}

      {/* Image counter */}
      <Box
        position="absolute"
        top={2}
        left={2}
        bg="rgba(0,0,0,0.7)"
        color="white"
        fontSize="xs"
        fontWeight="bold"
        px={2}
        py={1}
        borderRadius="md"
      >
        {currentImageIndex + 1}/{imgUrls.length}
      </Box>

      {/* Add More Images Button */}
      <IconButton
        icon={<AddIcon />}
        aria-label="Add more images"
        position="absolute"
        bottom={2}
        right={10}
        borderRadius="full"
        bg="rgba(0, 179, 116, 0.7)"
        color="white"
        _hover={{ bg: "rgba(0, 179, 116, 0.9)" }}
        onClick={onAddMoreClick}
        size="sm"
        title="Add more images"
      />

      {/* Close button */}
      <CloseButton
        onClick={() => onCloseImage(currentImageIndex)}
        bg={"rgba(0,0,0,0.7)"}
        color="white"
        position={"absolute"}
        top={2}
        right={2}
        size="sm"
        borderRadius="full"
        _hover={{ bg: "rgba(255, 0, 0, 0.7)" }}
      />
    </Box>
  );
});

export default CreatePostImagePreview;
