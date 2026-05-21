import { memo } from "react";
import { Modal, ModalOverlay, ModalContent, ModalBody, IconButton, Box, Image, useColorModeValue } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, ArrowBackIcon } from "@chakra-ui/icons";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageIndex: number;
  validImages: string[];
  handlePrevImage: (e: React.MouseEvent) => void;
  handleNextImage: (e: React.MouseEvent) => void;
}

const ImageModal = memo(({
  isOpen,
  onClose,
  currentImageIndex,
  validImages,
  handlePrevImage,
  handleNextImage,
}: ImageModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      isCentered
      returnFocusOnClose={false}
      blockScrollOnMount={false}
    >
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />
      <ModalContent bg="transparent" boxShadow="none" maxW="100vw" maxH="100vh">
        {/* Back button */}
        <IconButton
          icon={<ArrowBackIcon boxSize={6} />}
          aria-label="Back to previous page"
          position="absolute"
          top={4}
          left={4}
          zIndex={10}
          variant="ghost"
          color="white"
          _hover={{ color: "rgba(0, 179, 116, 0.9)" }}
          onClick={onClose}
          size="md"
        />
        <ModalBody
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={0}
          position="relative"
        >
          <Box position="relative">
            <Image
              src={validImages[currentImageIndex]}
              maxH="90vh"
              maxW="90vw"
              objectFit="contain"
              loading="lazy"
              decoding="async"
              className="modal-content"
              fallbackSrc="https://via.placeholder.com/800x600?text=Loading+Image"
              onError={(e) => {
                console.error("Modal image failed to load:", validImages[currentImageIndex]);
                e.currentTarget.src = "https://via.placeholder.com/800x600?text=Image+Error";
              }}
            />

            {/* Image counter in modal */}
            {validImages.length > 1 && (
              <Box
                position="absolute"
                top={4}
                left={16} // Moved to the right to avoid overlapping with back button
                bg="rgba(0,0,0,0.7)"
                color="white"
                fontSize="md"
                fontWeight="bold"
                px={3}
                py={1}
                borderRadius="md"
              >
                {currentImageIndex + 1}/{validImages.length}
              </Box>
            )}
          </Box>

          {/* Navigation arrows for multiple images in modal */}
          {validImages.length > 1 && (
            <>
              {/* Left arrow */}
              {currentImageIndex > 0 && (
                <IconButton
                  icon={<ChevronLeftIcon boxSize={8} />}
                  aria-label="Previous image"
                  position="absolute"
                  left={5}
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  bg="rgba(0,0,0,0.7)"
                  color="white"
                  _hover={{ bg: "rgba(0,0,0,0.8)" }}
                  onClick={handlePrevImage}
                  size="lg"
                />
              )}

              {/* Right arrow */}
              {currentImageIndex < validImages.length - 1 && (
                <IconButton
                  icon={<ChevronRightIcon boxSize={8} />}
                  aria-label="Next image"
                  position="absolute"
                  right={5}
                  top="50%"
                  transform="translateY(-50%)"
                  borderRadius="full"
                  bg="rgba(0,0,0,0.7)"
                  color="white"
                  _hover={{ bg: "rgba(0,0,0,0.8)" }}
                  onClick={handleNextImage}
                  size="lg"
                />
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});

export default ImageModal;
