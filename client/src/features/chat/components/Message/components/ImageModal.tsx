import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, Spinner, Box, Image, Flex, IconButton, Text, Button
} from "@chakra-ui/react";
import { AddIcon, MinusIcon, DownloadIcon } from "@chakra-ui/icons";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  currentMediaType: string;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isImageLoading: boolean;
  setIsImageLoading: (loading: boolean) => void;
  handleDownloadImage: (url: string, type: string) => void;
}

export const ImageModal = ({
  isOpen,
  onClose,
  currentImage,
  currentMediaType,
  zoomLevel,
  setZoomLevel,
  isImageLoading,
  setIsImageLoading,
  handleDownloadImage
}: ImageModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="4xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
        <ModalBody p={0} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Box position="relative">
            {isImageLoading && (
              <Spinner 
                size="xl" 
                color="white" 
                position="absolute" 
                top="50%" 
                left="50%" 
                ml="-24px" 
                mt="-24px" 
              />
            )}
            <Image 
              src={currentImage} 
              maxH="80vh" 
              objectFit="contain" 
              transform={`scale(${zoomLevel})`} 
              transition="transform 0.2s" 
              onLoad={() => setIsImageLoading(false)} 
            />
          </Box>
          <Flex mt={4} gap={4} align="center">
            <IconButton 
              icon={<MinusIcon />} 
              onClick={() => setZoomLevel(p => Math.max(p - 0.25, 0.5))} 
              aria-label="Zoom out" 
              colorScheme="whiteAlpha" 
            />
            <Text color="white">{Math.round(zoomLevel * 100)}%</Text>
            <IconButton 
              icon={<AddIcon />} 
              onClick={() => setZoomLevel(p => Math.min(p + 0.25, 3))} 
              aria-label="Zoom in" 
              colorScheme="whiteAlpha" 
            />
            <Button 
              leftIcon={<DownloadIcon />} 
              onClick={() => handleDownloadImage(currentImage, currentMediaType)} 
              colorScheme="blue" 
              borderRadius="full"
            >
              Download
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
