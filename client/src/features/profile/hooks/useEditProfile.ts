import { useState, useEffect, useRef, useCallback } from "react";
import { useRecoilState } from "recoil";
import { useToast } from "@chakra-ui/react";
import { userAtom } from "../../../atoms";
import usePreviewImg from "../../../hooks/usePreviewImg";
import { fetchWithSession, setCurrentTabUser } from "../../../utils/api";
import useUserEvents from "../../../hooks/useUserEvents";

interface UseEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const useEditProfile = ({ isOpen, onClose }: UseEditProfileProps) => {
  const [user, setUser] = useRecoilState(userAtom);
  const { emitUserUpdate } = useUserEvents();
  const toast = useToast();

  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });

  const [updating, setUpdating] = useState(false);

  const { handleImageChange: handleProfilePicChange, imgUrl: profilePicUrl, setImgUrl: setProfilePicUrl } = usePreviewImg();
  const { handleImageChange: handleCoverPicChange, imgUrl: coverPicUrl, setImgUrl: setCoverPicUrl } = usePreviewImg();

  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Sync inputs with user info on open
  useEffect(() => {
    if (user && isOpen) {
      setInputs({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
      });
    }
  }, [user, isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setUpdating(true);

    try {
      const payload: Record<string, any> = { ...inputs };
      if (profilePicUrl) payload.profilePic = profilePicUrl as string;
      if (coverPicUrl) payload.coverPic = coverPicUrl as string;

      const res = await fetchWithSession(`/api/users/update/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          ...user,
          ...data,
          isProfileComplete: true,
        };
        setUser(updatedUser);
        setCurrentTabUser(updatedUser);
        emitUserUpdate(updatedUser);
        toast({ title: "Success", description: "Profile updated", status: "success", duration: 3000 });
        onClose();
      } else {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || "Failed to update", status: "error", duration: 3000 });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, status: "error", duration: 3000 });
    } finally {
      setUpdating(false);
    }
  }, [user, inputs, profilePicUrl, coverPicUrl, emitUserUpdate, setUser, toast, onClose]);

  const handleInputChange = useCallback((field: keyof typeof inputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    inputs,
    handleInputChange,
    updating,
    profilePicUrl,
    setProfilePicUrl,
    coverPicUrl,
    setCoverPicUrl,
    handleProfilePicChange,
    handleCoverPicChange,
    fileRef,
    coverFileRef,
    handleSubmit,
    user,
  };
};
