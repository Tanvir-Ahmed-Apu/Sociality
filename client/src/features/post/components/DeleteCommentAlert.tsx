import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useColorModeValue
} from "@chakra-ui/react";

/**
 * Delete comment alert component
 * Confirmation dialog for deleting a comment
 */
interface DeleteCommentAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  cancelRef: React.RefObject<any>;
}

const DeleteCommentAlert = ({ isOpen, onClose, onDelete, isDeleting, cancelRef }: DeleteCommentAlertProps) => {
  // Theme-aware colors - ensuring dark text in light mode for visibility
  const bgColor = useColorModeValue("white", "#101010");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const bodyTextColor = useColorModeValue("gray.600", "gray.300");

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg={bgColor} borderColor={borderColor}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color={textColor}>
            Delete Comment
          </AlertDialogHeader>

          <AlertDialogBody color={bodyTextColor}>
            Are you sure you want to delete this comment? This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              variant="outline"
              borderColor="gray.600"
              color="gray.300"
              _hover={{ bg: "gray.700" }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onDelete}
              ml={3}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteCommentAlert;
