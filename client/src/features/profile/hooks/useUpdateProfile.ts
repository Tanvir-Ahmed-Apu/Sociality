import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { userAtom } from "../../../atoms";
import usePreviewImg from "../../../hooks/usePreviewImg";
import useShowToast from "../../../hooks/useShowToast";
import useUserEvents from "../../../hooks/useUserEvents";
import { fetchWithSession, setCurrentTabUser } from "../../../utils/api";
import { ProfileFormInputs } from "../types";

export const useUpdateProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userAtom);
  const { emitUserUpdate } = useUserEvents();
  const [inputs, setInputs] = useState<ProfileFormInputs>({
    name: "",
    username: "",
    email: "",
    bio: "",
    password: "",
  });
  const [updating, setUpdating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const showToast = useShowToast();
  const {
    handleImageChange: handleProfilePicChange,
    imgUrl: profilePicUrl,
  } = usePreviewImg();
  const {
    handleImageChange: handleCoverPicChange,
    imgUrl: coverPicUrl,
  } = usePreviewImg();

  useEffect(() => {
    if (user) {
      setInputs({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        password: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    try {
      if (e) e.preventDefault();
      if (updating) return;

      if (inputs.password && inputs.password.length < 6) {
        showToast(
          "Error",
          "Password must be at least 6 characters. If you don't want to change it, leave it completely blank.",
          "error"
        );
        return;
      }
      if (!user) {
        showToast("Error", "User session not found", "error");
        return;
      }

      setUpdating(true);

      const payload: Record<string, unknown> = { ...inputs };
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
          isProfileComplete:
            data.isProfileComplete ?? user.isProfileComplete ?? true,
          sessionPath: user.sessionPath,
        };
        setUser(updatedUser);
        setCurrentTabUser(updatedUser);
        emitUserUpdate(updatedUser);
        showToast("Success", "Profile updated successfully", "success");

        const targetPath = `/${updatedUser.username}`;
        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 100);
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to update profile" }));
        showToast(
          "Error",
          errorData.error || errorData.message || "Failed to update profile",
          "error"
        );
      }
    } catch (error: any) {
      showToast("Error", error.message || "An unexpected error occurred", "error");
    } finally {
      setUpdating(false);
    }
  };

  return {
    user,
    inputs,
    setInputs,
    updating,
    fileRef,
    coverFileRef,
    profilePicUrl,
    coverPicUrl,
    handleProfilePicChange,
    handleCoverPicChange,
    handleSubmit,
    navigate,
  };
};
