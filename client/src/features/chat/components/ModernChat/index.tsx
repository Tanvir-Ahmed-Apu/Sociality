import React from 'react';
import { Flex } from '@chakra-ui/react';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../../../../atoms';
import MessageContainer from "../MessageContainer";
import { WorkspaceRail, RightRail } from './components/LayoutRails';
import { ChatList } from './components/ChatList';
import { EmptyChatState } from './components/EmptyChatState';
import { useChatTheme } from '../../hooks/useChatTheme';

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
  const { mainBg, cardBg, cardBorder, shadowColor, scrollbarThumb, scrollbarThumbHover } = useChatTheme();

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
