import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box, Flex, Image, Skeleton, Text, Menu, MenuButton, MenuItem, MenuList,
  IconButton, Icon, Button, Modal, ModalOverlay, ModalContent, ModalBody,
  Spinner, Progress, Tooltip, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Badge,
  useColorModeValue, Avatar, useToast, HStack
} from "@chakra-ui/react";
import { BsCheck2All, BsCheck2, BsThreeDotsVertical, BsFileEarmarkFill, BsClock, BsStar, BsStarFill } from "react-icons/bs";
import { FaTrash, FaMicrophone, FaPlay, FaPause, FaTelegram, FaDiscord, FaGlobe } from "react-icons/fa";
import { AddIcon, MinusIcon, CloseIcon, DownloadIcon } from "@chakra-ui/icons";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../../../atoms";
import { formatTime, formatMessageTime } from "../utils/timeUtils";

const PLATFORM_CONFIG: any = {
  telegram: { icon: FaTelegram, color: "#0088cc" },
  discord: { icon: FaDiscord, color: "#5865F2" },
  sociality: { icon: FaGlobe, color: "#00B374" },
  default: { icon: FaGlobe, color: "#888" }
};


interface MessageProps {
  ownMessage: boolean;
  message: any;
  onDelete: (id: string, forEveryone: boolean) => void;
  onStar?: (id: string) => void;
}

const Message = React.memo(({ ownMessage, message, onDelete, onStar }: MessageProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
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
  const fileBoxBg = useColorModeValue("rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.05)");
  const fileBoxBorder = useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.1)");
  const menuBorderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  useEffect(() => {
    return () => { audioPlayer?.pause(); setAudioPlayer(null); };
  }, [audioPlayer]);

  const togglePlay = useCallback(() => {
    if (!message.voice) return;
    if (!audioPlayer) {
      const player = new Audio(message.voice);
      player.onended = () => { setIsPlaying(false); setPlaybackProgress(0); };
      player.ontimeupdate = () => setPlaybackProgress((player.currentTime / player.duration) * 100);
      setAudioPlayer(player);
      player.play().catch(console.error);
      setIsPlaying(true);
    } else {
      isPlaying ? audioPlayer.pause() : audioPlayer.play().catch(console.error);
      setIsPlaying(!isPlaying);
    }
  }, [message.voice, audioPlayer, isPlaying]);

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
    setCurrentImage(url); setCurrentMediaType(type); setShowImageModal(true); setZoomLevel(1); setIsImageLoading(true);
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

  const platform = useMemo(() => PLATFORM_CONFIG[message.platform] || PLATFORM_CONFIG.default, [message.platform]);

  const MessageStatus = () => (
    ownMessage && (
      <Tooltip label={message.isOptimistic ? "Sending..." : message.seen ? "Seen" : "Sent"} placement="bottom" hasArrow>
        <Box position="absolute" right="-20px" bottom="0" color={message.seen ? "blue.400" : message.isOptimistic ? "yellow.500" : "gray.500"}>
          {message.isOptimistic ? <BsClock size={14} /> : message.seen ? <BsCheck2All size={14} color="#0088ff" /> : <BsCheck2 size={14} />}
        </Box>
      </Tooltip>
    )
  );

  const FederatedHeader = () => message.isFederated && (
    <Flex align="center" gap={2} mb={2}>
      <Icon as={platform.icon} size={12} color={platform.color} />
      <Text fontSize="xs" color={platform.color} fontWeight="medium">{message.senderUsername || 'Unknown'}</Text>
      <Badge size="xs" colorScheme={message.platform === 'telegram' ? 'blue' : message.platform === 'discord' ? 'purple' : 'green'}>{message.platform}</Badge>
    </Flex>
  );

  const deletedBg = useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.05)");
  const deletedTextColor = useColorModeValue("gray.500", "gray.600");
  const confirmDelete = useCallback(() => { onDelete(message._id, deleteForEveryone); setIsDeleteAlertOpen(false); }, [onDelete, message._id, deleteForEveryone]);

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

  return (
    <>
      <Flex gap={2} alignSelf={ownMessage ? "flex-end" : "flex-start"} mb={3} maxW={ownMessage ? "90%" : "80%"} position="relative" role="group">
        {!ownMessage && (
          <Avatar 
            src={message.sender?.profilePic || message.senderProfilePic || selectedConversation?.userProfilePic || '/placeholder-avatar.png'} 
            name={message.sender?.username || message.senderUsername || selectedConversation?.username || 'User'} 
            size="xs" 
            alignSelf="flex-end" 
            mb={1} 
          />
        )}

        <Flex direction="column">
          {message.text && (
            <Box
              bg={ownMessage ? senderBg : receiverBg}
              color={ownMessage ? senderTextColor : textColor}
              maxW="500px"
              py={2.5}
              px={4}
              borderRadius="20px"
              borderBottomRightRadius={ownMessage ? "4px" : "20px"}
              borderBottomLeftRadius={ownMessage ? "20px" : "4px"}
              transition="all 0.2s"
              className="glass-message-bubble"
              border="1px solid"
              borderColor={useColorModeValue("blackAlpha.50", "rgba(255, 255, 255, 0.1)")}
            >
              <FederatedHeader />
              <Text
                fontSize="md"
                lineHeight="1.6"
                whiteSpace="pre-wrap"
                fontWeight="400"
                letterSpacing="0.2px"
              >
                {message.text}
              </Text>
            </Box>
          )}

          {message.emoji && (
            <Flex p={2} borderRadius="md" backdropFilter="blur(8px)" border="1px solid rgba(255, 255, 255, 0.15)" className="glass-message-bubble"><Text fontSize="4xl">{message.emoji}</Text></Flex>
          )}

          {(message.img || message.gif) && (
            <Box mt={2} w="200px" position="relative">
              <Skeleton isLoaded={imgLoaded} borderRadius="md" minH={!imgLoaded ? "200px" : "auto"}>
                <Image
                  src={message.img || message.gif} 
                  borderRadius="md" 
                  cursor="pointer" 
                  _hover={{ opacity: 0.9 }}
                  onLoad={() => setImgLoaded(true)} 
                  onClick={() => openModal(message.img || message.gif, message.gif ? "gif" : "image")}
                />
              </Skeleton>
            </Box>
          )}

          {message.file && (
            <Flex
              mt={2} p={3} pr={ownMessage ? 12 : 3} borderRadius="xl" align="center" gap={3} cursor="pointer" backdropFilter="blur(20px)"
              border="1px solid" borderColor={fileBoxBorder} className="glass-message-bubble" onClick={() => handleDownloadImage(message.file, "file", message)}
              bg={ownMessage ? (useColorModeValue("brand.primary.500", "rgba(0, 179, 116, 0.2)")) : receiverBg}
              color={ownMessage ? "white" : textColor}
              transition="all 0.2s"
              _hover={{ bg: ownMessage ? "brand.primary.600" : useColorModeValue("gray.200", "whiteAlpha.200") }}
            >
              <Box bg={ownMessage ? "whiteAlpha.200" : "blue.50"} p={2} borderRadius="lg">
                <Icon as={BsFileEarmarkFill} boxSize={6} color={ownMessage ? "white" : "blue.500"} />
              </Box>
              <Box flex={1}>
                <Text fontWeight="700" fontSize="sm" noOfLines={1}>{message.fileName || "Document"}</Text>
                {message.fileSize > 0 && <Text color={ownMessage ? "whiteAlpha.800" : "gray.500"} fontSize="2xs" fontWeight="600">{(message.fileSize / 1024).toFixed(2)} KB</Text>}
                <Text color={ownMessage ? "whiteAlpha.900" : "blue.400"} fontSize="2xs" fontWeight="700" mt={0.5}>Click to download</Text>
              </Box>
            </Flex>
          )}

          {message.voice && (
            <Flex
              bg={ownMessage ? useColorModeValue("rgba(0, 136, 204, 0.8)", "#0088cc") : senderBg}
              p={3} borderRadius="md" direction="column" position="relative" backdropFilter="blur(10px)" border="1px solid rgba(255, 255, 255, 0.2)" className="glass-message-bubble"
            >
              <Flex align="center" gap={3} mb={2}>
                <Icon as={FaMicrophone} boxSize={5} color="red.400" />
                <Text color={ownMessage ? "white" : "inherit"} fontSize="sm" fontWeight="500">Voice {message.voiceDuration ? `(${formatTime(message.voiceDuration)})` : ""}</Text>
              </Flex>
              <Flex align="center" gap={3}>
                <IconButton icon={isPlaying ? <FaPause /> : <FaPlay />} size="sm" colorScheme={isPlaying ? "red" : "blue"} isRound onClick={togglePlay} aria-label="Play" />
                <Progress value={playbackProgress} size="sm" width="100%" colorScheme="blue" borderRadius="full" />
                <Text color={ownMessage ? "white" : "inherit"} fontSize="xs" w="45px">{formatTime(Math.floor((message.voiceDuration || 0) * playbackProgress / 100))}</Text>
              </Flex>
            </Flex>
          )}

          {!(message.text || message.emoji || message.img || message.gif || message.voice || message.file) && (
            <Flex bg="rgba(255, 255, 255, 0.1)" p={2.5} borderRadius="lg" mb={2} className="glass-message-bubble">
              <Text color="gray.500" fontSize="sm" fontStyle="italic">(Empty message)</Text>
            </Flex>
          )}

            <HStack align="center" gap={1}>
              <Text fontSize="2xs" color={mutedTextColor}>{formatMessageTime(message.createdAt)}</Text>
              {message.isStarred && <Icon as={BsStarFill} color="yellow.400" boxSize={2} />}
            </HStack>
            <MessageStatus />
          </Flex>
        
        <Menu placement="bottom-end" isLazy>
          <MenuButton as={IconButton} icon={<BsThreeDotsVertical />} variant="ghost" size="xs" position="absolute" top="4px" right={ownMessage ? "-25px" : "unset"} left={ownMessage ? "unset" : "-25px"} opacity={0} _groupHover={{ opacity: 0.5 }} transition="opacity 0.2s" />
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

      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} isCentered size="4xl">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
          <ModalBody p={0} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Box position="relative">
              {isImageLoading && <Spinner size="xl" color="white" position="absolute" top="50%" left="50%" ml="-24px" mt="-24px" />}
              <Image src={currentImage} maxH="80vh" objectFit="contain" transform={`scale(${zoomLevel})`} transition="transform 0.2s" onLoad={() => setIsImageLoading(false)} />
            </Box>
            <Flex mt={4} gap={4} align="center">
              <IconButton icon={<MinusIcon />} onClick={() => setZoomLevel(p => Math.max(p - 0.25, 0.5))} aria-label="Zoom out" colorScheme="whiteAlpha" />
              <Text color="white">{Math.round(zoomLevel * 100)}%</Text>
              <IconButton icon={<AddIcon />} onClick={() => setZoomLevel(p => Math.min(p + 0.25, 3))} aria-label="Zoom in" colorScheme="whiteAlpha" />
              <Button leftIcon={<DownloadIcon />} onClick={() => handleDownloadImage(currentImage, currentMediaType)} colorScheme="blue" borderRadius="full">Download</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsDeleteAlertOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue("white", "#101010")} className="glass-card">
            <AlertDialogHeader fontWeight="bold">Delete Message</AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to delete this message{deleteForEveryone ? " for everyone" : ""}?{deleteForEveryone && " This cannot be undone."}</AlertDialogBody>
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
