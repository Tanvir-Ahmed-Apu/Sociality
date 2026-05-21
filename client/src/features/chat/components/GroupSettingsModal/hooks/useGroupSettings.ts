import { useState, useCallback, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useToast } from '@chakra-ui/react';
import { userAtom } from '../../../../../atoms';
import { fetchWithSession } from '../../../../../utils/api';
import { useShowToast } from '../../../../../hooks';

export const useGroupSettings = (selectedConversation: any, isOpen: boolean, onClose: () => void, onUpdateGroup?: (group: any) => void, onDeleteGroup?: (group: any) => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(selectedConversation?.name || '');
  const [groupPhoto, setGroupPhoto] = useState(selectedConversation?.groupPhoto || '');
  const [states, setStates] = useState({
    uploading: false,
    deleting: false,
    loadingRoom: false,
    loadingParticipants: false,
    copied: false,
    showAlert: false
  });
  const [data, setData] = useState<any>({
    roomDetails: null,
    participants: [],
    summary: null
  });

  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const toast = useToast();

  const updateState = useCallback((k: string, v: any) => {
    setStates(p => ({ ...p, [k]: v }));
  }, []);

  const apiCall = useCallback(async (url: string, method = 'GET', body?: any) => {
    const resp = await fetchWithSession(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.error || 'Failed');
    return json;
  }, []);

  const handlePhoto = useCallback((file: File) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      return showToast("Error", "Invalid file or size > 5MB", "error");
    }
    updateState('uploading', true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/photo`, 'PUT', { photo: e.target?.result });
        setGroupPhoto(res.groupPhoto);
        onUpdateGroup?.({ ...selectedConversation, groupPhoto: res.groupPhoto });
        showToast("Success", "Photo updated", "success");
      } catch (err: any) {
        showToast("Error", err.message, "error");
      } finally {
        updateState('uploading', false);
      }
    };
    reader.readAsDataURL(file);
  }, [selectedConversation, onUpdateGroup, apiCall, showToast, updateState]);

  const handleUpdateName = useCallback(async () => {
    if (!groupName.trim() || groupName === selectedConversation?.name) {
      return setIsEditing(false);
    }
    try {
      const res = await apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/name`, 'PUT', { name: groupName.trim() });
      onUpdateGroup?.({ ...selectedConversation, name: res.name });
      setIsEditing(false);
      showToast("Success", "Name updated", "success");
    } catch (err: any) {
      showToast("Error", err.message, "error");
    }
  }, [groupName, selectedConversation, onUpdateGroup, apiCall, showToast]);

  const handleDelete = useCallback(async () => {
    updateState('deleting', true);
    try {
      await fetchWithSession(`/api/cross-platform/rooms/${selectedConversation._id}`, { method: 'DELETE' });
      onDeleteGroup?.(selectedConversation);
      onClose();
      showToast("Success", "Group deleted", "success");
    } catch (err) {
      showToast("Error", "Failed to delete", "error");
    } finally {
      updateState('deleting', false);
      updateState('showAlert', false);
    }
  }, [selectedConversation, onDeleteGroup, onClose, showToast, updateState]);

  const fetchData = useCallback(async () => {
    if (!selectedConversation?._id) return;
    updateState('loadingRoom', true);
    updateState('loadingParticipants', true);
    try {
      const [room, part] = await Promise.all([
        apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/details`),
        apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/participants`)
      ]);
      setData({ roomDetails: room.room, participants: part.participants, summary: part.summary });
    } catch (err) {
      console.error(err);
    } finally {
      updateState('loadingRoom', false);
      updateState('loadingParticipants', false);
    }
  }, [selectedConversation?._id, apiCall, updateState]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(selectedConversation._id);
    updateState('copied', true);
    toast({ title: "Copied!", status: "success", duration: 2000, position: "top" });
    setTimeout(() => updateState('copied', false), 2000);
  }, [selectedConversation?._id, toast, updateState]);

  const shareGroup = useCallback(() => {
    const text = `Join group "${selectedConversation?.name}"!\nRoom ID: ${selectedConversation._id}`;
    if (navigator.share) {
      navigator.share({ title: `Join Group`, text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text).then(() => toast({ title: "Copied share text!", status: "success" }));
    }
  }, [selectedConversation, toast]);

  return {
    isEditing,
    setIsEditing,
    groupName,
    setGroupName,
    groupPhoto,
    states,
    updateState,
    data,
    currentUser,
    handlePhoto,
    handleUpdateName,
    handleDelete,
    copyId,
    shareGroup
  };
};
