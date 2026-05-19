import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { VStack, HStack, Button, useColorModeValue, useToast } from '@chakra-ui/react';
import { FiSettings, FiUsers as FiUsersIcon } from 'react-icons/fi';
import { useRecoilValue } from "recoil";
import { userAtom } from "../../../../atoms";
import { fetchWithSession } from '../../../../utils/api';
import { useShowToast } from '../../../../hooks';

import SidebarHeader from './SidebarHeader';
import InfoSettingsTab from './InfoSettingsTab';
import MembersTab from './MembersTab';
import { AllMembersModal, DeleteGroupAlert, RemoveParticipantAlert } from './Modals';

const ChatRightSidebar = ({ user, messages = [], onOpenSettings, onDeleteGroup, onUpdateGroup }: any) => {
  const [details, setDetails] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Settings/Info, 1: Members
  
  const [removingParticipant, setRemovingParticipant] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const cancelRef = useRef<HTMLButtonElement>(null);
  const removeCancelRef = useRef<HTMLButtonElement>(null);
  const showToast = useShowToast();
  const toast = useToast();
  const currentUser = useRecoilValue(userAtom);

  const isFederated = user?.isFederated;

  // Find current user's role in the participants list
  const currentUserRole = useMemo(() => {
    if (!currentUser || !participants.length) return 'member';
    const p = participants.find(part => part.platform === 'sociality' && part.id === currentUser._id);
    return p?.role || 'member';
  }, [currentUser, participants]);

  const isAdmin = currentUserRole === 'admin';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isFederated) {
        const [roomRes, partRes] = await Promise.all([
          fetchWithSession(`/api/cross-platform/rooms/${user._id}/details`),
          fetchWithSession(`/api/cross-platform/rooms/${user._id}/participants`)
        ]);

        if (roomRes.ok) {
          const roomData = await roomRes.json();
          if (roomData.success) {
            setDetails(roomData.room);
            setGroupName(roomData.room.name || '');
          }
        }

        if (partRes.ok) {
          const partData = await partRes.json();
          if (partData.success) {
            const sorted = partData.participants.sort((a: any, b: any) => (b.messageCount || 0) - (a.messageCount || 0));
            setParticipants(sorted);
            setSummary(partData.summary);
          }
        }
      } else {
        const res = await fetchWithSession(`/api/users/profile/${user.userId || user.username}`);
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
          setGroupName(data.username || '');
        }
      }
    } catch (error) {
      console.error("Error fetching sidebar details:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isFederated]);

  useEffect(() => {
    if (!isFederated) setActiveTab(0);
    fetchData();
  }, [fetchData, isFederated]);

  const media = useMemo(() => messages.filter((m: any) => m.img).reverse(), [messages]);
  const files = useMemo(() => messages.filter((m: any) => m.file).reverse(), [messages]);
  const starredMessages = useMemo(() => messages.filter((m: any) => m.isStarred).reverse(), [messages]);

  const displayAvatar = isFederated ? (details?.groupPhoto || user.groupPhoto) : (details?.profilePic || user.userProfilePic);
  const displayName = isFederated ? (details?.name || user.name) : (details?.username || user.username);

  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast("Error", "File size must be less than 5MB", "error");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: e.target?.result })
        });
        const data = await res.json();
        if (data.success) {
          setDetails((prev: any) => ({ ...prev, groupPhoto: data.groupPhoto }));
          onUpdateGroup?.({ ...user, groupPhoto: data.groupPhoto });
          showToast("Success", "Group photo updated", "success");
        }
      } catch (err) { showToast("Error", "Failed to update photo", "error"); } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === displayName) { setIsEditing(false); return; }
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDetails((prev: any) => ({ ...prev, name: data.name }));
        onUpdateGroup?.({ ...user, name: data.name });
        setIsEditing(false);
        showToast("Success", "Group name updated", "success");
      }
    } catch (err) { showToast("Error", "Failed to update name", "error"); }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Success", "Group deleted successfully", "success");
        onDeleteGroup?.(user);
        setShowDeleteAlert(false);
      }
    } catch (err) { showToast("Error", "Failed to delete group", "error"); } finally { setDeleting(false); }
  };

  const handleRemoveParticipant = async () => {
    if (!removingParticipant) return;
    setIsRemoving(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/participants/${removingParticipant.id}?platform=${removingParticipant.platform}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast("Success", "Participant removed", "success");
        fetchData(); // Refresh list
        setRemovingParticipant(null);
      } else {
        showToast("Error", data.error || "Failed to remove participant", "error");
      }
    } catch (err) {
      showToast("Error", "Failed to remove participant", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!`, status: "success", duration: 2000, position: "top" });
  };

  return (
    <VStack 
      w="full" h="full" bg={useColorModeValue("white", "#0A0A0A")} p={6} align="stretch" spacing={6}
      overflowY="auto"
      flexShrink={0}
      className="custom-scrollbar"
    >
      <SidebarHeader 
        user={user} details={details} displayAvatar={displayAvatar} displayName={displayName} 
        isFederated={isFederated} isAdmin={isAdmin} uploading={uploading} isEditing={isEditing} 
        groupName={groupName} participants={participants} setIsEditing={setIsEditing} 
        setGroupName={setGroupName} handlePhotoUpload={handlePhotoUpload} handleUpdateName={handleUpdateName} 
      />

      {isFederated && (
        <HStack bg={useColorModeValue("gray.50", "black")} p={1.5} borderRadius="18px" spacing={1} border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.100")}>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiSettings size={14} />} borderRadius="14px" bg={activeTab === 0 ? useColorModeValue("white", "whiteAlpha.100") : "transparent"} color={activeTab === 0 ? useColorModeValue("black", "white") : "gray.500"} _hover={{ bg: useColorModeValue("white", "whiteAlpha.100"), color: useColorModeValue("black", "white") }} onClick={() => setActiveTab(0)}>
            Settings
          </Button>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiUsersIcon size={14} />} borderRadius="14px" bg={activeTab === 1 ? useColorModeValue("white", "whiteAlpha.100") : "transparent"} color={activeTab === 1 ? useColorModeValue("black", "white") : "gray.500"} _hover={{ bg: useColorModeValue("white", "whiteAlpha.100"), color: useColorModeValue("black", "white") }} onClick={() => setActiveTab(1)}>
            Members
          </Button>
        </HStack>
      )}

      <VStack align="stretch" spacing={6}>
        {activeTab === 0 ? (
          <InfoSettingsTab 
            user={user} details={details} isFederated={isFederated} isAdmin={isAdmin} 
            summary={summary} media={media} files={files} starredMessages={starredMessages} 
            copyToClipboard={copyToClipboard} setShowDeleteAlert={setShowDeleteAlert} 
          />
        ) : (
          <MembersTab 
            participants={participants} setShowAllMembers={setShowAllMembers} 
            isAdmin={isAdmin} currentUser={currentUser} setRemovingParticipant={setRemovingParticipant} 
          />
        )}
      </VStack>

      <AllMembersModal 
        showAllMembers={showAllMembers} setShowAllMembers={setShowAllMembers} 
        participants={participants} isAdmin={isAdmin} currentUser={currentUser} 
        setRemovingParticipant={setRemovingParticipant} 
      />

      <DeleteGroupAlert 
        showDeleteAlert={showDeleteAlert} setShowDeleteAlert={setShowDeleteAlert} 
        cancelRef={cancelRef} handleDeleteGroup={handleDeleteGroup} deleting={deleting} 
      />

      <RemoveParticipantAlert 
        removingParticipant={removingParticipant} setRemovingParticipant={setRemovingParticipant} 
        removeCancelRef={removeCancelRef} handleRemoveParticipant={handleRemoveParticipant} 
        isRemoving={isRemoving} 
      />
    </VStack>
  );
};

export default ChatRightSidebar;
