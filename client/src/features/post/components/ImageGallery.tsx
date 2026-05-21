import { memo } from "react";
import { Box, Image, HStack, Circle, IconButton } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useImageGallery } from "../hooks/useImageGallery";
import ImageModal from "./ImageModal";

/**
 * Image gallery component for posts
 * Displays images with navigation controls and full-screen view
 */
interface ImageGalleryProps {
  images: string[];
  borderColor: string;
}

const ImageGallery = memo(({ images, borderColor }: ImageGalleryProps) => {
  // Validate all images are valid URLs
  const validImages = images ? images.filter(img =>
    typeof img === 'string' &&
    (img.startsWith('http://') || img.startsWith('https://'))
  ) : [];

  const {
    currentImageIndex,
    isImageModalOpen,
    handlePrevImage,
    handleNextImage,
    handleOpenModal,
    handleCloseModal,
    selectImageIndex,
  } = useImageGallery({ imagesCount: validImages.length });

  // Debug the images array
  console.log("ImageGallery received images:", images);

  // No images to display
  if (validImages.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        borderRadius="20px"
        overflow="hidden"
        mt={3}
        position="relative"
        cursor="pointer"
        onClick={handleOpenModal}
        className="image-container"
        w="full"
      >
        {/* Main image */}
        <Image
          src={validImages[currentImageIndex]}
          w="full"
          maxH={{ base: "300px", sm: "400px", md: "500px" }} // Responsive max height
          objectFit="cover"
          loading="lazy" // Add lazy loading for better performance
          decoding="async" // Use async decoding for better performance
          className="post-image" // Apply optimized CSS
          fallbackSrc="https://via.placeholder.com/500x300?text=Loading+Image"
          onError={(e) => {
            console.error("Image failed to load:", validImages[currentImageIndex]);
            e.currentTarget.src = "https://via.placeholder.com/500x300?text=Image+Error";
          }}
        />

        {/* Navigation arrows for multiple images - Responsive */}
        {validImages.length > 1 && (
          <>
            {/* Left arrow */}
            {currentImageIndex > 0 && (
              <IconButton
                icon={<ChevronLeftIcon boxSize={{ base: 4, sm: 6 }} />}
                aria-label="Previous image"
                position="absolute"
                left={{ base: 1, sm: 2 }}
                top="50%"
                transform="translateY(-50%)"
                borderRadius="full"
                bg="rgba(0,0,0,0.7)"
                color="white"
                _hover={{ bg: "rgba(0,0,0,0.8)" }}
                onClick={handlePrevImage}
                size={{ base: "xs", sm: "sm" }} // Responsive button size
                minW={{ base: "32px", sm: "40px" }} // Better touch targets
                h={{ base: "32px", sm: "40px" }}
              />
            )}

            {/* Right arrow */}
            {currentImageIndex < validImages.length - 1 && (
              <IconButton
                icon={<ChevronRightIcon boxSize={{ base: 4, sm: 6 }} />}
                aria-label="Next image"
                position="absolute"
                right={{ base: 1, sm: 2 }}
                top="50%"
                transform="translateY(-50%)"
                borderRadius="full"
                bg="rgba(0,0,0,0.7)"
                color="white"
                _hover={{ bg: "rgba(0,0,0,0.8)" }}
                onClick={handleNextImage}
                size={{ base: "xs", sm: "sm" }} // Responsive button size
                minW={{ base: "32px", sm: "40px" }} // Better touch targets
                h={{ base: "32px", sm: "40px" }}
              />
            )}
          </>
        )}

        {/* Image indicators */}
        {validImages.length > 1 && (
          <HStack
            spacing={1}
            position="absolute"
            bottom={2}
            left="50%"
            transform="translateX(-50%)"
            justify="center"
          >
            {validImages.map((_, index) => (
              <Circle
                key={index}
                size={2}
                bg={index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)"}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  selectImageIndex(index);
                }}
              />
            ))}
          </HStack>
        )}

        {/* Image counter */}
        {validImages.length > 1 && (
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
            {currentImageIndex + 1}/{validImages.length}
          </Box>
        )}
      </Box>

      {/* Full-size image modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={handleCloseModal}
        currentImageIndex={currentImageIndex}
        validImages={validImages}
        handlePrevImage={handlePrevImage}
        handleNextImage={handleNextImage}
      />
    </>
  );
});

export default ImageGallery;
