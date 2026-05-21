import { useEffect, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { userAtom } from "../../../atoms";
import usePreviewImg from "../../../hooks/usePreviewImg";
import useShowToast from "../../../hooks/useShowToast";
import {
  fetchWithSession,
  setCurrentTabUser,
  validateAuthentication,
  handleAuthenticationError,
} from "../../../utils/api";
import { ProfileFormErrors, ProfileFormInputs } from "../types";
import { validateProfileSetup } from "../utils/validateProfile";

export const useProfileSetup = () => {
  const user = useRecoilValue(userAtom);
  const setUser = useSetRecoilState(userAtom);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<ProfileFormInputs>({
    name: "",
    username: "",
    bio: "",
  });
  const [initialLoad, setInitialLoad] = useState(true);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const {
    handleImageChange: handleProfilePicChange,
    imgUrl: profilePicUrl,
    setImgUrl: setProfilePicUrl,
  } = usePreviewImg();
  const {
    handleImageChange: handleCoverPicChange,
    imgUrl: coverPicUrl,
    setImgUrl: setCoverPicUrl,
  } = usePreviewImg();
  const showToast = useShowToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && initialLoad) {
      setInputs({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
      });
      if (user.profilePic) setProfilePicUrl(user.profilePic);
      if (user.coverPic) setCoverPicUrl(user.coverPic);
      setInitialLoad(false);
    }
  }, [user, initialLoad, setProfilePicUrl, setCoverPicUrl]);

  const handleSubmit = async () => {
    const validationErrors = validateProfileSetup(inputs);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const isAuthenticated = await validateAuthentication();
      if (!isAuthenticated) {
        handleAuthenticationError(navigate, setUser, showToast);
        return;
      }

      const res = await fetchWithSession("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inputs,
          profilePic: profilePicUrl,
          coverPic: coverPicUrl,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          handleAuthenticationError(navigate, setUser, showToast);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      showToast("Success", "Profile setup completed successfully!", "success");

      const updatedUserData = {
        ...data,
        sessionPath: user?.sessionPath || data.sessionPath,
      };

      setUser(updatedUserData);
      setCurrentTabUser(updatedUserData);

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error: any) {
      if (error instanceof Error && error.message.includes("JSON")) {
        showToast("Error", "Server response error. Please try again.", "error");
      } else if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("Unauthorized"))
      ) {
        handleAuthenticationError(navigate, setUser, showToast);
      } else {
        showToast(
          "Error",
          error.message || "Failed to complete profile setup",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    inputs,
    setInputs,
    errors,
    fileRef,
    coverFileRef,
    profilePicUrl,
    coverPicUrl,
    handleProfilePicChange,
    handleCoverPicChange,
    handleSubmit,
  };
};
