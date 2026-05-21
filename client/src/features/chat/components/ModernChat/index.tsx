import React from 'react';
import { Flex, useColorModeValue } from '@chakra-ui/react';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../../../../atoms';
import MessageContainer from "../MessageContainer";
import { WorkspaceRail, RightRail } from './components/LayoutRails';
import { ChatList } from './components/ChatList';
import { EmptyChatState } from './components/EmptyChatState';

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
  const scrollbarThumb = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255, 255, 255, 0.1)');
  const scrollbarThumbHover = useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255, 255, 255, 0.2)');

  return (
    <Flex h="100vh" w="full" overflow="hidden" fontFamily="'Inter', sans-serif" bg={mainBg} p={{ base: 0, md: 4 }} gap={{ base: 0, md: 4 }}>
      <WorkspaceRail />

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
            <EmptyChatState />
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
