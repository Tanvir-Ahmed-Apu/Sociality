import React from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, InputGroup, InputLeftElement,
  Avatar, AvatarBadge, IconButton, Icon, Badge,
  useColorModeValue, Heading, Skeleton, SkeletonCircle, Tooltip
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { FaGlobe, FaTelegram, FaDiscord } from "react-icons/fa";
import { useChatTheme } from '../../../hooks/useChatTheme';

export const ChatList = ({
  currentUser,
  conversations,
  federatedRooms,
  isCrossPlatformMode,
  selectedConversation,
  setSelectedConversation,
  loading,
  searchText,
  setSearchText,
  onToggleMode,
  onShowCreateRoom,
  onShowJoinRoom,
  onlineUsers
}: any) => {
  const {
    bgColor, hoverBg, activeBg, textColor, mutedColor,
    segmentedControlBg, segmentedControlBorder,
    itemActiveBg, itemHoverBg, badgeBg, badgeColor,
    skeletonStart, skeletonEnd, shadowColor
  } = useChatTheme();
  const activeTabShadow = useColorModeValue("0 2px 8px rgba(0,0,0,0.1)", "0 4px 12px rgba(0,0,0,0.4)");
  const unreadTextColor = useColorModeValue("blackAlpha.900", "whiteAlpha.900");

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <VStack
      w={{ base: "full", md: "350px" }} h="100vh" bg={bgColor}
      align="stretch" spacing={0} flexShrink={0}
      display={{ base: selectedConversation?._id ? "none" : "flex", md: "flex" }}
    >
      <Box px={6} pt={8} pb={4}>
        <Flex justify="space-between" align="center" mb={6}>
          {isSearchOpen ? (
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search people or messages..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                bg={useColorModeValue("blackAlpha.50", "whiteAlpha.100")}
                border="none"
                borderRadius="full"
                _focus={{ bg: useColorModeValue("blackAlpha.100", "whiteAlpha.200"), boxShadow: "none" }}
                color={textColor}
                autoFocus
                onBlur={() => !searchText && setIsSearchOpen(false)}
              />
            </InputGroup>
          ) : (
            <Heading size="lg" fontWeight="800" color={textColor} letterSpacing="-0.5px">Messages</Heading>
          )}

          <HStack spacing={1}>
            {isCrossPlatformMode && (
              <Tooltip label="Join Room" placement="bottom" hasArrow>
                <IconButton 
                  icon={<FaGlobe size={18} />} 
                  size="sm" 
                  variant="ghost" 
                  color="gray.400"
                  borderRadius="full" 
                  _hover={{ bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100"), color: textColor }} 
                  aria-label="Join Room" 
                  onClick={onShowJoinRoom}
                />
              </Tooltip>
            )}
            <Tooltip label={isCrossPlatformMode ? "Create Room" : "New Chat"} placement="bottom" hasArrow>
              <IconButton 
                icon={<FiPlus size={20} />} 
                size="sm" 
                variant="ghost" 
                color="gray.400"
                borderRadius="full" 
                _hover={{ bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100"), color: textColor }} 
                aria-label="New Chat" 
                onClick={onShowCreateRoom}
              />
            </Tooltip>
            <IconButton
              icon={<FiSearch size={20} />}
              size="sm"
              variant="ghost"
              color={isSearchOpen ? "brand.primary.500" : "gray.400"}
              borderRadius="full"
              _hover={{ bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100"), color: textColor }}
              aria-label="Search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            />
          </HStack>
        </Flex>

        <Box px={1} mb={6}>
          <Flex 
            bg={segmentedControlBg} 
            p="2px" 
            borderRadius="16px" 
            border="1px solid"
            borderColor={segmentedControlBorder}
            position="relative"
            backdropFilter="blur(10px)"
          >
            <Flex 
              flex={1} 
              py={2.5} 
              px={3} 
              align="center" 
              justify="center" 
              gap={2.5} 
              cursor="pointer"
              borderRadius="14px"
              bg={!isCrossPlatformMode ? itemActiveBg : "transparent"}
              color={!isCrossPlatformMode ? textColor : "gray.500"}
              boxShadow={!isCrossPlatformMode ? activeTabShadow : "none"}
              onClick={() => isCrossPlatformMode && onToggleMode()}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{ color: textColor, bg: !isCrossPlatformMode ? itemActiveBg : itemHoverBg }}
            >
              <Icon as={FiMessageSquare} boxSize={4} />
              <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">DIRECT</Text>
            </Flex>
            <Flex 
              flex={1} 
              py={2.5} 
              px={3} 
              align="center" 
              justify="center" 
              gap={2.5} 
              cursor="pointer"
              borderRadius="14px"
              bg={isCrossPlatformMode ? itemActiveBg : "transparent"}
              color={isCrossPlatformMode ? textColor : "gray.500"}
              boxShadow={isCrossPlatformMode ? activeTabShadow : "none"}
              onClick={() => !isCrossPlatformMode && onToggleMode()}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{ color: textColor, bg: isCrossPlatformMode ? itemActiveBg : itemHoverBg }}
            >
              <Icon as={FaGlobe} boxSize={4} />
              <Text fontSize="xs" fontWeight="800" letterSpacing="0.5px">UNIFIED</Text>
            </Flex>
          </Flex>
        </Box>

        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="xs" fontWeight="700" color={mutedColor} letterSpacing="1px">
            {isCrossPlatformMode ? "UNIFIED GROUPS" : "DIRECT MESSAGES"}
          </Text>
          <Badge bg={badgeBg} color={badgeColor} px={2} py={0.5} borderRadius="md" textTransform="none" fontSize="10px">
            {isCrossPlatformMode ? "Cross-platform" : "Sociality"}
          </Badge>
        </Flex>
      </Box>

      <VStack flex={1} overflowY="auto" spacing={1} px={3} pb={4} align="stretch" className="custom-scrollbar">
        {loading ? (
          [0, 1, 2, 3, 4].map(i => (
            <HStack key={i} p={3} spacing={3}>
              <SkeletonCircle size="12" startColor={skeletonStart} endColor={skeletonEnd} />
              <VStack align="stretch" flex={1} spacing={2}>
                <Skeleton h="12px" w="60%" startColor={skeletonStart} endColor={skeletonEnd} />
                <Skeleton h="10px" w="40%" startColor={skeletonStart} endColor={skeletonEnd} />
              </VStack>
            </HStack>
          ))
        ) : (isCrossPlatformMode ? federatedRooms : conversations).map((item: any) => {
          const itemId = item.roomId || item._id;
          const isSelected = selectedConversation?._id === itemId;
          const participant = item?.participants?.[0];
          const displayName = item.name || participant?.username;
          const displayPic = item.groupPhoto || participant?.profilePic;
          const lastMsg = item.lastMessage?.text || (item.mock ? "Start a new conversation" : "New conversation");

          return (
            <HStack 
              key={itemId} 
              p={4} 
              borderRadius="20px" 
              cursor="pointer" 
              spacing={4}
              bg={isSelected ? activeBg : 'transparent'}
              _hover={{ bg: isSelected ? activeBg : hoverBg }}
              onClick={() => {
                if (isCrossPlatformMode) {
                  setSelectedConversation({ 
                    _id: itemId, 
                    name: item.name, 
                    groupPhoto: item.groupPhoto, 
                    roomCode: item.roomCode,
                    isFederated: true, 
                    platforms: item.peers || [] 
                  });
                } else {
                  setSelectedConversation({ _id: itemId, userId: participant?._id, userProfilePic: participant?.profilePic, username: participant?.username, mock: item.mock });
                }
              }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              position="relative"
              borderLeft={isSelected ? "4px solid" : "4px solid transparent"}
              borderColor={isSelected ? "brand.primary.500" : "transparent"}
              mx={2}
            >
              <Box position="relative">
                <Avatar 
                  size="md" 
                  src={displayPic} 
                  name={displayName}
                >
                  {!isCrossPlatformMode && (
                    <AvatarBadge boxSize="1.2em" bg={onlineUsers?.includes(participant?._id) ? 'green.400' : 'gray.600'} border="2px solid" borderColor={bgColor} />
                  )}
                </Avatar>
                {isCrossPlatformMode && (
                  <HStack spacing={0.5} position="absolute" bottom="-2px" right="-2px">
                    {item.peers?.includes('http://localhost:7301') && <Badge size="xs" colorScheme="blue" borderRadius="full" p={0.5}><FaTelegram size={8} /></Badge>}
                    {item.peers?.includes('http://localhost:7302') && <Badge size="xs" colorScheme="purple" borderRadius="full" p={0.5}><FaDiscord size={8} /></Badge>}
                  </HStack>
                )}
              </Box>
              <VStack align="stretch" flex={1} spacing={1}>
                <Flex justify="space-between" align="baseline">
                  <Text 
                    fontWeight={!item.lastMessage?.seen && item.lastMessage?.sender !== currentUser?._id ? "800" : "600"} 
                    fontSize="md" 
                    color={textColor} 
                    noOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text fontSize="10px" fontWeight="600" color={mutedColor}>12:45 PM</Text>
                </Flex>
                <Text 
                  fontSize="sm" 
                  color={!item.lastMessage?.seen && item.lastMessage?.sender !== currentUser?._id ? unreadTextColor : mutedColor} 
                  fontWeight={!item.lastMessage?.seen && item.lastMessage?.sender !== currentUser?._id ? "600" : "400"}
                  noOfLines={1}
                >
                  {lastMsg}
                </Text>
              </VStack>
              {!item.lastMessage?.seen && item.lastMessage?.sender !== currentUser?._id && !item.mock && (
                <Box w="10px" h="10px" bg="brand.primary.500" borderRadius="full" boxShadow="0 0 8px #00B374" />
              )}
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );
};
