import ModernChat from "../features/chat/components/ModernChat";
import { CrossPlatformRoomModals } from "../features/chat/components/CrossPlatformRoomModals";
import { useChatConversations } from "../features/chat/hooks/useChatConversations";
import { useCrossPlatformRooms } from "../features/chat/hooks/useCrossPlatformRooms";

const ChatPage = () => {
  const {
    loadingConversations,
    searchText,
    setSearchText,
    selectedConversation,
    setSelectedConversation,
    filteredConversations,
    onlineUsers,
  } = useChatConversations();

  const crossPlatform = useCrossPlatformRooms();

  return (
    <>
      <ModernChat
        conversations={filteredConversations}
        federatedRooms={crossPlatform.federatedRooms}
        isCrossPlatformMode={crossPlatform.isCrossPlatformMode}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        loading={
          loadingConversations || crossPlatform.loadingFederatedRooms
        }
        searchText={searchText}
        setSearchText={setSearchText}
        onToggleMode={crossPlatform.handleToggleCrossPlatform}
        onShowCreateRoom={() => crossPlatform.setShowCreateRoomModal(true)}
        onShowJoinRoom={() => crossPlatform.setShowJoinRoomModal(true)}
        onShareRoom={crossPlatform.handleShareRoom}
        onDeleteRoom={crossPlatform.handleDeleteRoom}
        onlineUsers={onlineUsers}
      />

      <CrossPlatformRoomModals
        showCreateRoomModal={crossPlatform.showCreateRoomModal}
        setShowCreateRoomModal={crossPlatform.setShowCreateRoomModal}
        newRoomName={crossPlatform.newRoomName}
        setNewRoomName={crossPlatform.setNewRoomName}
        creatingRoom={crossPlatform.creatingRoom}
        onCreateRoom={crossPlatform.handleCreateRoom}
        showShareRoomModal={crossPlatform.showShareRoomModal}
        setShowShareRoomModal={crossPlatform.setShowShareRoomModal}
        selectedRoom={crossPlatform.selectedRoom}
        hasCopied={crossPlatform.hasCopied}
        onCopyRoomId={crossPlatform.handleCopyRoomId}
        showJoinRoomModal={crossPlatform.showJoinRoomModal}
        setShowJoinRoomModal={crossPlatform.setShowJoinRoomModal}
        joinRoomId={crossPlatform.joinRoomId}
        setJoinRoomId={crossPlatform.setJoinRoomId}
        joiningRoom={crossPlatform.joiningRoom}
        onJoinRoom={crossPlatform.handleJoinRoom}
        showDeleteRoomModal={crossPlatform.showDeleteRoomModal}
        setShowDeleteRoomModal={crossPlatform.setShowDeleteRoomModal}
        deletingRoom={crossPlatform.deletingRoom}
        onConfirmDeleteRoom={crossPlatform.handleConfirmDeleteRoom}
      />
    </>
  );
};

export default ChatPage;
