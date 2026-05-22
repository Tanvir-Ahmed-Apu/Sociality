import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { useToast } from "@chakra-ui/react";
import { userAtom } from "../../../atoms";
import { fetchWithSession } from "../../../utils/api";
import useShowToast from "../../../hooks/useShowToast";
import { fileToDataUrl } from "../../post/utils/feedUpdates";
import { roomApiCall } from "../utils/roomApi";

interface UseChatRightSidebarOptions {
	user: any;
	onUpdateGroup?: (group: any) => void;
	onDeleteGroup?: (group: any) => void;
}

export function useChatRightSidebar({
	user,
	onUpdateGroup,
	onDeleteGroup,
}: UseChatRightSidebarOptions) {
	const [details, setDetails] = useState<any>(null);
	const [participants, setParticipants] = useState<any[]>([]);
	const [summary, setSummary] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [groupName, setGroupName] = useState("");
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [showAllMembers, setShowAllMembers] = useState(false);
	const [activeTab, setActiveTab] = useState(0);
	const [removingParticipant, setRemovingParticipant] = useState<any>(null);
	const [isRemoving, setIsRemoving] = useState(false);

	const showToast = useShowToast();
	const toast = useToast();
	const currentUser = useRecoilValue(userAtom);
	const isFederated = user?.isFederated;

	const currentUserRole = useMemo(() => {
		if (!currentUser || !participants.length) return "member";
		const p = participants.find(
			(part) => part.platform === "sociality" && part.id === currentUser._id
		);
		return p?.role || "member";
	}, [currentUser, participants]);

	const isAdmin = currentUserRole === "admin";

	const fetchData = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			if (isFederated) {
				const [roomData, partData] = await Promise.all([
					roomApiCall<{ room: any }>(user._id, "/details"),
					roomApiCall<{ participants: any[]; summary: any }>(
						user._id,
						"/participants"
					),
				]);
				setDetails(roomData.room);
				setGroupName(roomData.room.name || "");
				const sorted = [...partData.participants].sort(
					(a, b) => (b.messageCount || 0) - (a.messageCount || 0)
				);
				setParticipants(sorted);
				setSummary(partData.summary);
			} else {
				const res = await fetchWithSession(
					`/api/users/profile/${user.userId || user.username}`
				);
				if (res.ok) {
					const data = await res.json();
					setDetails(data);
					setGroupName(data.username || "");
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

	const displayAvatar = isFederated
		? details?.groupPhoto || user?.groupPhoto
		: details?.profilePic || user?.userProfilePic;
	const displayName = isFederated
		? details?.name || user?.name
		: details?.username || user?.username;

	const handlePhotoUpload = useCallback(
		async (file: File) => {
			if (!file || !isFederated) return;
			if (file.size > 5 * 1024 * 1024) {
				showToast("Error", "File size must be less than 5MB", "error");
				return;
			}
			setUploading(true);
			try {
				const photo = await fileToDataUrl(file);
				const data = await roomApiCall<{ groupPhoto: string }>(
					user._id,
					"/photo",
					"PUT",
					{ photo }
				);
				setDetails((prev: any) => ({ ...prev, groupPhoto: data.groupPhoto }));
				onUpdateGroup?.({ ...user, groupPhoto: data.groupPhoto });
				showToast("Success", "Group photo updated", "success");
			} catch {
				showToast("Error", "Failed to update photo", "error");
			} finally {
				setUploading(false);
			}
		},
		[isFederated, user, onUpdateGroup, showToast]
	);

	const handleUpdateName = useCallback(async () => {
		if (!isFederated || !groupName.trim() || groupName === displayName) {
			setIsEditing(false);
			return;
		}
		try {
			const data = await roomApiCall<{ name: string }>(
				user._id,
				"/name",
				"PUT",
				{ name: groupName.trim() }
			);
			setDetails((prev: any) => ({ ...prev, name: data.name }));
			onUpdateGroup?.({ ...user, name: data.name });
			setIsEditing(false);
			showToast("Success", "Group name updated", "success");
		} catch {
			showToast("Error", "Failed to update name", "error");
		}
	}, [isFederated, groupName, displayName, user, onUpdateGroup, showToast]);

	const handleDeleteGroup = useCallback(async () => {
		setDeleting(true);
		try {
			await roomApiCall(user._id, "", "DELETE");
			showToast("Success", "Group deleted successfully", "success");
			onDeleteGroup?.(user);
			setShowDeleteAlert(false);
		} catch {
			showToast("Error", "Failed to delete group", "error");
		} finally {
			setDeleting(false);
		}
	}, [user, onDeleteGroup, showToast]);

	const handleRemoveParticipant = useCallback(async () => {
		if (!removingParticipant) return;
		setIsRemoving(true);
		try {
			await roomApiCall(
				user._id,
				`/participants/${removingParticipant.id}?platform=${removingParticipant.platform}`,
				"DELETE"
			);
			showToast("Success", "Participant removed", "success");
			await fetchData();
			setRemovingParticipant(null);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to remove participant";
			showToast("Error", message, "error");
		} finally {
			setIsRemoving(false);
		}
	}, [removingParticipant, user._id, fetchData, showToast]);

	const copyToClipboard = useCallback(
		(text: string, label: string) => {
			navigator.clipboard.writeText(text);
			toast({
				title: `${label} copied!`,
				status: "success",
				duration: 2000,
				position: "top",
			});
		},
		[toast]
	);

	return {
		details,
		participants,
		summary,
		loading,
		isEditing,
		setIsEditing,
		groupName,
		setGroupName,
		uploading,
		deleting,
		showDeleteAlert,
		setShowDeleteAlert,
		showAllMembers,
		setShowAllMembers,
		activeTab,
		setActiveTab,
		removingParticipant,
		setRemovingParticipant,
		isRemoving,
		currentUser,
		isFederated,
		isAdmin,
		displayAvatar,
		displayName,
		handlePhotoUpload,
		handleUpdateName,
		handleDeleteGroup,
		handleRemoveParticipant,
		copyToClipboard,
	};
}
