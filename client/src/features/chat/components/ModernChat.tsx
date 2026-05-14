import React from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, InputGroup, InputLeftElement,
  Avatar, AvatarBadge, IconButton, Icon, Badge,
  useColorModeValue, Heading, Skeleton, SkeletonCircle,
  Switch, Tooltip, Divider
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { FaGlobe, FaTelegram, FaDiscord } from "react-icons/fa";
import { useRecoilValue } from 'recoil';
import { userAtom } from '../../../atoms';
import MessageContainer from "./MessageContainer";

const WorkspaceRail = () => {
  const railBg = useColorModeValue('white', '#000000');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <VStack 
      w="2px" h="full" bg={railBg} py={1} spacing={2} align="center" 
      flexShrink={0}
      display={{ base: "none", md: "flex" }}
      borderRight="1px solid"
      borderColor={borderColor}
    >
      <Box flex={1} />
    </VStack>
  );
};

const RightRail = () => {
  const railBg = useColorModeValue('white', '#000000');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <VStack 
      w="60px" h="full" bg={railBg} flexShrink={0}
      display={{ base: "none", md: "block" }}
      borderLeft="1px solid"
      borderColor={borderColor}
    />
  );
};

const ChatList = ({
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
  const bgColor = useColorModeValue('white', '#0A0A0A');
  const hoverBg = useColorModeValue('gray.50', '#121212');
  const activeBg = useColorModeValue('gray.100', '#1A1A1A');
  const textColor = useColorModeValue('black', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.500');
  const segmentedControlBg = useColorModeValue('gray.100', 'rgba(255, 255, 255, 0.03)');
  const segmentedControlBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const itemActiveBg = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200');
  const itemHoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50');
  const badgeBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const badgeColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.700');
  const skeletonStart = useColorModeValue('gray.100', '#1A1A1A');
  const skeletonEnd = useColorModeValue('gray.200', '#111111');

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

        {/* Messaging Mode Switch - Premium Segmented Control */}
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
              boxShadow={!isCrossPlatformMode ? useColorModeValue("0 2px 8px rgba(0,0,0,0.1)", "0 4px 12px rgba(0,0,0,0.4)") : "none"}
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
              boxShadow={isCrossPlatformMode ? useColorModeValue("0 2px 8px rgba(0,0,0,0.1)", "0 4px 12px rgba(0,0,0,0.4)") : "none"}
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
                    <AvatarBadge boxSize="1.2em" bg={onlineUsers.includes(participant?._id) ? 'green.400' : 'gray.600'} border="2px solid" borderColor={bgColor} />
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
                  color={!item.lastMessage?.seen && item.lastMessage?.sender !== currentUser?._id ? useColorModeValue("blackAlpha.900", "whiteAlpha.900") : mutedColor} 
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

const ModernChat = ({
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
  onShareRoom,
  onDeleteRoom,
  onlineUsers
}: any) => {
  const currentUser = useRecoilValue(userAtom);
  const mainBg = useColorModeValue('gray.50', '#000000');
  const cardBg = useColorModeValue('white', 'rgba(255, 255, 255, 0.02)');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.4)');
  const textColor = useColorModeValue('black', 'white');
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.02)');
  const badgeBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const badgeColor = useColorModeValue('blackAlpha.700', 'whiteAlpha.700');
  const scrollbarThumb = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255, 255, 255, 0.1)');
  const scrollbarThumbHover = useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255, 255, 255, 0.2)');

  return (
    <Flex h="100vh" w="full" overflow="hidden" fontFamily="'Inter', sans-serif" bg={mainBg} p={{ base: 0, md: 4 }} gap={{ base: 0, md: 4 }}>
      <WorkspaceRail />

      {/* Left Card: Chat List */}
      <Flex 
        w={{ base: "full", md: "350px" }} 
        h="full" 
        bg={cardBg} 
        backdropFilter="blur(30px)" 
        borderRadius={{ base: "0px", md: "32px" }}
        border="1px solid" 
        borderColor={cardBorder}
        overflow="hidden"
        boxShadow={`0 20px 50px ${shadowColor}`}
        flexShrink={0}
        display={{ base: selectedConversation?._id ? "none" : "flex", md: "flex" }}
      >
        <ChatList
          currentUser={currentUser}
          conversations={conversations}
          federatedRooms={federatedRooms}
          isCrossPlatformMode={isCrossPlatformMode}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          loading={loading}
          searchText={searchText}
          setSearchText={setSearchText}
          onToggleMode={onToggleMode}
          onShowCreateRoom={onShowCreateRoom}
          onShowJoinRoom={onShowJoinRoom}
          onlineUsers={onlineUsers}
        />
      </Flex>

      {/* Right Card: Message Content */}
      <Flex 
        flex={1} 
        h="full" 
        bg={cardBg} 
        backdropFilter="blur(30px)" 
        borderRadius={{ base: "0px", md: "32px" }}
        border="1px solid" 
        borderColor={cardBorder}
        overflow="hidden"
        boxShadow={`0 20px 50px ${shadowColor}`}
        position="relative"
      >
        <Flex direction="column" flex={1} h="full" position="relative" bg="transparent">
          {selectedConversation?._id ? (
            <MessageContainer onShareRoom={onShareRoom} onDeleteRoom={onDeleteRoom} />
          ) : (
            <Flex 
              direction="column" align="center" justify="center" h="full"
              bgGradient={useColorModeValue(
                "radial(circle at 50% 50%, rgba(0, 179, 116, 0.03) 0%, transparent 100%)",
                "radial(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 100%)"
              )}
              position="relative"
              overflow="hidden"
            >
              {/* Decorative Floating Elements */}
              <Box position="absolute" top="-10%" left="-10%" w="40%" h="40%" bg="brand.primary.500" filter="blur(150px)" opacity="0.05" borderRadius="full" />
              <Box position="absolute" bottom="-10%" right="-10%" w="40%" h="40%" bg="blue.500" filter="blur(150px)" opacity="0.05" borderRadius="full" />
              
              <VStack spacing={8} zIndex={1}>
                <Box 
                  p={12} 
                  borderRadius="50px" 
                  bg={glassBg} 
                  border="1px solid" 
                  borderColor={cardBorder}
                  backdropFilter="blur(30px)"
                  boxShadow={`0 30px 60px ${shadowColor}`}
                  position="relative"
                >
                  <Icon as={FiMessageSquare} boxSize={20} color="brand.primary.500" filter="drop-shadow(0 0 20px rgba(0, 179, 116, 0.3))" />
                  <Box position="absolute" top="-5px" right="-5px" w="15px" h="15px" bg="brand.primary.500" borderRadius="full" boxShadow="0 0 10px #00B374" />
                </Box>
                <VStack spacing={4}>
                  <Heading size="xl" color={textColor} fontWeight="900" letterSpacing="-1px">Sociality Messaging</Heading>
                  <Text color="gray.500" fontWeight="500" fontSize="lg" textAlign="center" maxW="400px" lineHeight="tall">
                    Your hub for direct and cross-platform conversations. Select a contact to begin.
                  </Text>
                </VStack>
                <Box pt={4}>
                  <Badge variant="subtle" colorScheme="brand" px={4} py={1} borderRadius="full" textTransform="none" fontSize="xs" bg={badgeBg} color="brand.primary.500" border="1px solid" borderColor="brand.primary.500">
                    Ready to connect
                  </Badge>
                </Box>
              </VStack>
            </Flex>
          )}
        </Flex>
      </Flex>

      <RightRail />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${scrollbarThumb}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${scrollbarThumbHover}; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Flex>
  );
};

export default ModernChat;
