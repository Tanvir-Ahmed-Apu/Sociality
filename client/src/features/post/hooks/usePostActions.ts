import { useState, useRef, useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { Post, fetchWithSession } from "../../../utils/api";

interface UsePostActionsProps {
  post: Post;
  onClose: () => void;
}

// Simple debounce helper within the hook scope
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const usePostActions = ({ post, onClose }: UsePostActionsProps) => {
  const user = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const showToast = useShowToast();

  const [liked, setLiked] = useState(user && post?.likes ? post.likes.includes(user._id) : false);
  const [isLiking, setIsLiking] = useState(false);
  const [reposted, setReposted] = useState(user && post?.reposts ? post.reposts.includes(user._id) : false);
  const [isReposting, setIsReposting] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Sync state if post updates externally
  useEffect(() => {
    if (user && post) {
      setLiked(post.likes ? post.likes.includes(user._id) : false);
      setReposted(post.reposts ? post.reposts.includes(user._id) : false);
    }
  }, [post, user]);

  const handleLikeAndUnlikeBase = useCallback(async () => {
    if (!user) {
      showToast("Error", "You must be logged in to like a post", "error");
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetchWithSession("/api/posts/like/" + post._id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      if (!liked) {
        const updatedPosts = posts.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: [...(p.likes || []), user._id] };
          }
          return p;
        });
        setPosts(updatedPosts);
      } else {
        const updatedPosts = posts.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: (p.likes || []).filter((id) => id !== user._id) };
          }
          return p;
        });
        setPosts(updatedPosts);
      }

      setLiked(!liked);
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setIsLiking(false);
    }
  }, [user, isLiking, post._id, liked, posts, setPosts, showToast]);

  const handleLikeAndUnlike = useCallback(
    debounce(handleLikeAndUnlikeBase, 300),
    [handleLikeAndUnlikeBase]
  );

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        setImagePreview(event.target?.result as string);
        setImage(file);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleReplyBase = useCallback(async () => {
    if (!user) {
      showToast("Error", "You must be logged in to reply", "error");
      return;
    }
    if (isReplying) return;

    if (!reply.trim() && !image) {
      showToast("Error", "Reply cannot be empty", "error");
      return;
    }

    setIsReplying(true);
    try {
      let imgUrl = null;
      if (image) {
        const reader = new FileReader();
        const imgPromise = new Promise<string | ArrayBuffer | null>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result || null);
          reader.readAsDataURL(image);
        });
        imgUrl = await imgPromise;
      }

      const res = await fetchWithSession("/api/posts/reply/" + post._id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          img: imgUrl
        }),
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      const updatedPosts = posts.map((p) => {
        if (p._id === post._id) {
          return { ...p, replies: [...(p.replies || []), data] };
        }
        return p;
      });
      setPosts(updatedPosts);

      showToast("Success", "Reply posted!", "success");

      onClose();
      setReply("");
      setImage(null);
      setImagePreview(null);
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setIsReplying(false);
    }
  }, [user, isReplying, reply, image, post._id, posts, setPosts, showToast, onClose]);

  const handleReply = useCallback(
    debounce(handleReplyBase, 300),
    [handleReplyBase]
  );

  const handleRepostBase = useCallback(async () => {
    if (!user) {
      showToast("Error", "You must be logged in to repost", "error");
      return;
    }
    if (isReposting) return;
    setIsReposting(true);

    const optimisticUpdatedPosts = posts.map((p) => {
      if (p._id === post._id) {
        const currentReposts = p.reposts || [];
        if (reposted) {
          return { ...p, reposts: currentReposts.filter((id) => id !== user._id) };
        } else {
          return { ...p, reposts: [...currentReposts, user._id] };
        }
      }
      return p;
    });
    setPosts(optimisticUpdatedPosts);
    setReposted(!reposted);

    try {
      const res = await fetchWithSession("/api/posts/repost/" + post._id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.error) {
        setPosts(posts);
        setReposted(reposted);
        showToast("Error", data.error, "error");
        return;
      }
    } catch (error: any) {
      setPosts(posts);
      setReposted(reposted);
    } finally {
      setIsReposting(false);
    }
  }, [user, isReposting, post._id, reposted, posts, setPosts, showToast]);

  const handleRepost = useCallback(
    debounce(handleRepostBase, 300),
    [handleRepostBase]
  );

  const handleShareBase = useCallback(async () => {
    const postUrl = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Sociality Post',
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        showToast("Success", "Link copied to clipboard", "success");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        showToast("Error", error.message, "error");
      }
    }
  }, [post._id, post.postedBy.username, showToast]);

  const handleShare = useCallback(
    debounce(handleShareBase, 300),
    [handleShareBase]
  );

  const clearImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
  }, []);

  return {
    liked,
    reposted,
    isReplying,
    reply,
    setReply,
    imagePreview,
    imageRef,
    handleLikeAndUnlike,
    handleImageChange,
    handleReply,
    handleRepost,
    handleShare,
    clearImage,
    user,
  };
};
