import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box, Flex, Text, Menu, MenuButton, MenuItem, MenuList,
  IconButton, Icon, Button, Tooltip, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  useColorModeValue, Avatar, useToast, HStack
} from "@chakra-ui/react";
import { BsCheck2All, BsCheck2, BsThreeDotsVertical, BsClock, BsStar, BsStarFill } from "react-icons/bs";
import { FaTrash, FaTelegram, FaDiscord, FaGlobe } from "react-icons/fa";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../../../atoms";
import { formatMessageTime } from "../utils/timeUtils";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { ImageModal } from "./components/ImageModal";
import { MessageContent } from "./components/MessageContent";
import { MessageProps } from "./types";

const PLATFORM_CONFIG: any = {
  telegram: { icon: FaTelegram, color: "#0088cc" },
  discord: { icon: FaDiscord, color: "#5865F2" },
  sociality: { icon: FaGlobe, color: "#00B374" },
  default: { icon: FaGlobe, color: "#888" }
};

export const Message = React.memo(({ ownMessage, message, onDelete, onStar }: MessageProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [currentMediaType, setCurrentMediaType] = useState("image");

  const cancelRef = useRef<HTMLButtonElement>(null);
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const toast = useToast();

  const receiverBg = useColorModeValue("gray.100", "#1A1A1A");
  const senderBg = useColorModeValue("whiteAlpha.900", "rgba(255, 255, 255, 0.15)");
  const textColor = useColorModeValue("black", "white");
  const senderTextColor = useColorModeValue("black", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.500");
  const fileBoxBorder = useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.1)");
  const menuBorderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  const { isPlaying, playbackProgress: hookPlaybackProgress, togglePlay } = useAudioPlayer(message.voice);

  const handleDownloadImage = useCallback(async (url: string, type = "image", fileInfo: any = null) => {
    const label = type === "file" ? "File" : "Image";
    toast({ title: `Downloading ${label}...`, status: "info", duration: 2000, isClosable: true });
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = (type === "file" && fileInfo?.fileName) ? fileInfo.fileName : `${type}-${Date.now()}.${blob.type.split("/")[1] || "bin"}`;
      link.click();
      toast({ title: `${label} downloaded!`, status: "success", duration: 3000 });
    } catch (err) {
      toast({ title: `Download failed`, status: "error", duration: 3000 });
      console.error(err);
    }
  }, [toast]);

  const openModal = useCallback((url: string, type = "image") => {
    setCurrentImage(url);
    setCurrentMediaType(type);
    setShowImageModal(true);
    setZoomLevel(1);
    setIsImageLoading(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showImageModal) return;
      if (e.key === 'Escape') setShowImageModal(false);
      if (e.key === '+' || e.key === '=') setZoomLevel(p => Math.min(p + 0.25, 3));
      if (e.key === '-') setZoomLevel(p => Math.max(p - 0.25, 0.5));
      if (e.key === '0') setZoomLevel(1);
      if (e.key === 'd') handleDownloadImage(currentImage, currentMediaType);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showImageModal, currentImage, currentMediaType, handleDownloadImage]);

  const MessageStatus = () => (
    ownMessage && (
      <Tooltip label={message.isOptimistic ? "Sending..." : message.seen ? "Seen" : "Sent"} placement="bottom" hasArrow>
        <Box position="absolute" right="-20px" bottom="0" color={message.seen ? "blue.400" : message.isOptimistic ? "yellow.500" : "gray.500"}>
          {message.isOptimistic ? <BsClock size={14} /> : message.seen ? <BsCheck2All size={14} color="#0088ff" /> : <BsCheck2 size={14} />}
        </Box>
      </Tooltip>
    )
  );

  const deletedBg = useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.05)");
  const deletedTextColor = useColorModeValue("gray.500", "gray.600");
  const confirmDelete = useCallback(() => {
    onDelete(message._id, deleteForEveryone);
    setIsDeleteAlertOpen(false);
  }, [onDelete, message._id, deleteForEveryone]);

  if (message.deletedForEveryone) {
    return (
      <Flex 
        alignSelf={ownMessage ? "flex-end" : "flex-start"} 
        bg={deletedBg} 
        p={3} 
        borderRadius="xl" 
        mb={3} 
        border="1px solid"
        borderColor={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}
        className="glass-message-bubble"
      >
        <Text fontSize="xs" fontStyle="italic" color={deletedTextColor}>
          <Icon as={FaTrash} mr={2} boxSize={3} opacity={0.5} />
          This message was deleted
        </Text>
      </Flex>
    );
  }

  const defaultAvatar = '/placeholder-avatar.png';
  const avatarSrc = message.sender?.profilePic || message.senderProfilePic || selectedConversation?.userProfilePic || defaultAvatar;
  const avatarName = message.sender?.username || message.senderUsername || selectedConversation?.username || 'User';

  return (
    <>
      <Flex gap={2} alignSelf={ownMessage ? "flex-end" : "flex-start"} mb={3} maxW={ownMessage ? "90%" : "80%"} position="relative" role="group">
        {!ownMessage && (
          <Avatar 
            src={avatarSrc} 
            name={avatarName} 
            size="xs" 
            alignSelf="flex-end" 
            mb={1} 
          />
        )}

        <Flex direction="column">
          <MessageContent 
            message={message}
            ownMessage={ownMessage}
            textColor={textColor}
            senderTextColor={senderTextColor}
            senderBg={senderBg}
            receiverBg={receiverBg}
            fileBoxBorder={fileBoxBorder}
            imgLoaded={imgLoaded}
            setImgLoaded={setImgLoaded}
            openModal={openModal}
            handleDownloadImage={handleDownloadImage}
            isPlaying={isPlaying}
            playbackProgress={hookPlaybackProgress}
            togglePlay={togglePlay}
            PLATFORM_CONFIG={PLATFORM_CONFIG}
          />
          <HStack align="center" gap={1}>
            <Text fontSize="2xs" color={mutedTextColor}>{formatMessageTime(message.createdAt)}</Text>
            {message.isStarred && <Icon as={BsStarFill} color="yellow.400" boxSize={2} />}
          </HStack>
          <MessageStatus />
        </Flex>

        <Menu placement="bottom-end" isLazy>
          <MenuButton 
            as={IconButton} 
            icon={<BsThreeDotsVertical />} 
            variant="ghost" 
            size="xs" 
            position="absolute" 
            top="4px" 
            right={ownMessage ? "-25px" : "unset"} 
            left={ownMessage ? "unset" : "-25px"} 
            opacity={0} 
            _groupHover={{ opacity: 0.5 }} 
            transition="opacity 0.2s" 
          />
          <MenuList bg={useColorModeValue("white", "#101010")} p={2} className="glass-card" border="1px solid" borderColor={menuBorderColor} boxShadow="0 10px 30px rgba(0,0,0,0.2)">
            <MenuItem icon={<Icon as={message.isStarred ? BsStarFill : BsStar} color={message.isStarred ? "yellow.400" : "inherit"} />} onClick={() => onStar?.(message._id)} borderRadius="md">
              {message.isStarred ? "Unstar" : "Star"}
            </MenuItem>
            {ownMessage && (
              <>
                <MenuItem icon={<FaTrash />} onClick={() => { setDeleteForEveryone(false); setIsDeleteAlertOpen(true); }} borderRadius="md">Delete for me</MenuItem>
                <MenuItem icon={<FaTrash />} onClick={() => { setDeleteForEveryone(true); setIsDeleteAlertOpen(true); }} color="red.500" borderRadius="md">Delete for everyone</MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      </Flex>

      <ImageModal 
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        currentImage={currentImage}
        currentMediaType={currentMediaType}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        isImageLoading={isImageLoading}
        setIsImageLoading={setIsImageLoading}
        handleDownloadImage={handleDownloadImage}
      />

      <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsDeleteAlertOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue("white", "#101010")} className="glass-card" borderRadius="24px">
            <AlertDialogHeader fontWeight="bold">Delete Message</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this message{deleteForEveryone ? " for everyone" : ""}?{deleteForEveryone && " This cannot be undone."}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>Cancel</Button>
              <Button onClick={confirmDelete} ml={3} colorScheme="red" variant="outline">Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
});

Message.displayName = 'Message';
export default Message;
