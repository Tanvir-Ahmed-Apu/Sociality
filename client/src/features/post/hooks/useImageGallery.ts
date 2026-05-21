import { useState, useEffect, useCallback } from "react";

interface UseImageGalleryProps {
  imagesCount: number;
}

export const useImageGallery = ({ imagesCount }: UseImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Handle back button for image modal
  useEffect(() => {
    const handleBackButton = () => {
      if (isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    };

    // Listen for popstate event (back button)
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isImageModalOpen]);

  const handlePrevImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex(prev => Math.min(imagesCount - 1, prev + 1));
  }, [imagesCount]);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Push a new history state before opening the modal
    window.history.pushState({ modal: 'image' }, '');
    setIsImageModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const selectImageIndex = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  return {
    currentImageIndex,
    isImageModalOpen,
    handlePrevImage,
    handleNextImage,
    handleOpenModal,
    handleCloseModal,
    selectImageIndex,
  };
};
