import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useParams } from "react-router-dom";
import { userAtom, postsAtom } from "../../../atoms";
import usePreviewImg from "../../../hooks/usePreviewImg";
import useShowToast from "../../../hooks/useShowToast";
import { Post, fetchWithSession } from "../../../utils/api";

const MAX_CHAR = 500;

interface UseCreatePostProps {
  onPostCreated?: (post: Post) => void;
  onClose: () => void;
}

export const useCreatePost = ({ onPostCreated, onClose }: UseCreatePostProps) => {
  const [postText, setPostText] = useState("");
  const {
    handleImageChange,
    setImgUrl,
    imgUrls,
    setImgUrls,
    removeImage,
    clearImages
  } = usePreviewImg();
  const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
  const user = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const { username } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value;

    if (inputText.length > MAX_CHAR) {
      const truncatedText = inputText.slice(0, MAX_CHAR);
      setPostText(truncatedText);
      setRemainingChar(0);
    } else {
      setPostText(inputText);
      setRemainingChar(MAX_CHAR - inputText.length);
    }
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!user) {
      showToast("Error", "You must be logged in to create a post", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithSession("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postedBy: user._id,
          text: postText,
          img: imgUrls.length > 0 ? imgUrls[0] : null,
          images: imgUrls
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("Success", "Post created successfully", "success");
        if (onPostCreated) {
          onPostCreated(data);
        } else if (username === user.username) {
          setPosts([data, ...posts]);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create post' }));
        showToast("Error", errorData.error || 'Failed to create post', "error");
        return;
      }
      onClose();
      setPostText("");
      setImgUrl("");
      setImgUrls([]);
      setCurrentImageIndex(0);
      setRemainingChar(MAX_CHAR);
    } catch (error: any) {
      showToast("Error", error.message || String(error), "error");
    } finally {
      setLoading(false);
    }
  }, [user, postText, imgUrls, onPostCreated, username, posts, setPosts, onClose, setImgUrl, setImgUrls, showToast]);

  const handleCloseImage = useCallback((index: number) => {
    if (imgUrls.length === 1) {
      clearImages();
    } else {
      removeImage(index);
      if (index >= imgUrls.length - 1) {
        setCurrentImageIndex(imgUrls.length - 2);
      }
    }
  }, [imgUrls, clearImages, removeImage]);

  return {
    postText,
    setPostText,
    remainingChar,
    loading,
    currentImageIndex,
    setCurrentImageIndex,
    imgUrls,
    handleImageChange,
    handleTextChange,
    handleCreatePost,
    handleCloseImage,
    user,
    MAX_CHAR,
  };
};
