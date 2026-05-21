import React from 'react';
import {
  Box, Flex, Text, Image, Skeleton, Icon, Badge, Progress, IconButton, useColorModeValue
} from "@chakra-ui/react";
import { BsFileEarmarkFill } from "react-icons/bs";
import { FaMicrophone, FaPlay, FaPause } from "react-icons/fa";
import { formatTime } from "../../../utils/timeUtils";

interface MessageContentProps {
  message: any;
  ownMessage: boolean;
  textColor: string;
  senderTextColor: string;
  senderBg: string;
  receiverBg: string;
  fileBoxBorder: string;
  imgLoaded: boolean;
  setImgLoaded: (loaded: boolean) => void;
  openModal: (url: string, type: string) => void;
  handleDownloadImage: (url: string, type: string, fileInfo?: any) => void;
  isPlaying: boolean;
  playbackProgress: number;
  togglePlay: () => void;
  PLATFORM_CONFIG: any;
}

export const MessageContent = ({
  message,
  ownMessage,
  textColor,
  senderTextColor,
  senderBg,
  receiverBg,
  fileBoxBorder,
  imgLoaded,
  setImgLoaded,
  openModal,
  handleDownloadImage,
  isPlaying,
  playbackProgress,
  togglePlay,
  PLATFORM_CONFIG
}: MessageContentProps) => {
  const platform = PLATFORM_CONFIG[message.platform] || PLATFORM_CONFIG.default;

  const glassBorderColor = useColorModeValue("blackAlpha.50", "rgba(255, 255, 255, 0.1)");
  const downloadIconBg = ownMessage ? "whiteAlpha.200" : "blue.50";
  const fileDownloadText = ownMessage ? "whiteAlpha.900" : "blue.400";
  const voiceNoteBg = ownMessage ? useColorModeValue("rgba(0, 136, 204, 0.8)", "#0088cc") : senderBg;

  const FederatedHeader = () => message.isFederated && (
    <Flex align="center" gap={2} mb={2}>
      <Icon as={platform.icon} size={12} color={platform.color} />
      <Text fontSize="xs" color={platform.color} fontWeight="medium">{message.senderUsername || 'Unknown'}</Text>
      <Badge size="xs" colorScheme={message.platform === 'telegram' ? 'blue' : message.platform === 'discord' ? 'purple' : 'green'}>{message.platform}</Badge>
    </Flex>
  );

  return (
    <>
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
          borderColor={glassBorderColor}
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
        <Flex p={2} borderRadius="md" backdropFilter="blur(8px)" border="1px solid rgba(255, 255, 255, 0.15)" className="glass-message-bubble">
          <Text fontSize="4xl">{message.emoji}</Text>
        </Flex>
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
          <Box bg={downloadIconBg} p={2} borderRadius="lg">
            <Icon as={BsFileEarmarkFill} boxSize={6} color={ownMessage ? "white" : "blue.500"} />
          </Box>
          <Box flex={1}>
            <Text fontWeight="700" fontSize="sm" noOfLines={1}>{message.fileName || "Document"}</Text>
            {message.fileSize > 0 && <Text color={ownMessage ? "whiteAlpha.800" : "gray.500"} fontSize="2xs" fontWeight="600">{(message.fileSize / 1024).toFixed(2)} KB</Text>}
            <Text color={fileDownloadText} fontSize="2xs" fontWeight="700" mt={0.5}>Click to download</Text>
          </Box>
        </Flex>
      )}

      {message.voice && (
        <Flex
          bg={voiceNoteBg}
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
    </>
  );
};
