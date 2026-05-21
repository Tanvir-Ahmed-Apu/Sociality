import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { fetchWithSession, Post as PostType } from "../../../utils/api";

interface UsePostStateProps {
  post: PostType;
  showComments: boolean;
  isPostPage: boolean;
}

export const usePostState = ({ post, showComments, isPostPage }: UsePostStateProps) => {
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();
  const [displayComments, setDisplayComments] = useState(showComments);
  const [isReplying, setIsReplying] = useState(false);

  // Memoize images array calculation to prevent recalculation on every render
  const images = useMemo(() => {
    // Check if post has multiple images in the images array
    const hasMultipleImages = post.images && Array.isArray(post.images) && post.images.length > 0;

    // If post has images array, use it; otherwise, if post has a single img, create an array with it
    let imageArray: string[] = [];

    if (hasMultipleImages) {
      // Filter out any null or undefined values
      imageArray = post.images!.filter((img): img is string => !!img);
    } else if (post.img) {
      imageArray = [post.img];
    }

    // Validate that all images are valid URLs
    return imageArray.filter(img =>
      typeof img === 'string' &&
      (img.startsWith('http://') || img.startsWith('https://'))
    );
  }, [post._id, post.images, post.img]);

  // Memoize event handlers to prevent recreation on every render
  const handleDeletePost = useCallback(async (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      if (!window.confirm("Are you sure you want to delete this post?")) return;

      const res = await fetchWithSession(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      setPosts(posts.filter((p) => p._id !== post._id));

      if (isPostPage && post.postedBy) {
        navigate(`/${post.postedBy.username}`);
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    }
  }, [post._id, posts, setPosts, showToast, isPostPage, post.postedBy, navigate]);

  // Handle "Not interested" action
  const handleNotInterested = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Call API to mark post as not interested
      await fetchWithSession(`/api/posts/not-interested/${post._id}`, { method: 'POST' });

      // Remove post from current feed
      setPosts(posts.filter((p) => p._id !== post._id));
      showToast("Success", "You won't see this post again", "success");
    } catch (error) {
      console.error('Error marking post as not interested:', error);
      showToast("Error", "Failed to mark post as not interested", "error");
    }
  }, [post._id, posts, setPosts, showToast]);

  // Memoize the click handler to prevent recreation on every render
  const handlePostClick = useCallback((e: React.MouseEvent) => {
    if (!post.postedBy) return;
    // Navigate on clicking the box, except when clicking interactive elements
    const interactiveElements = ["A", "BUTTON", "IMG", "svg"]; // Tags of elements that shouldn't trigger navigation
    if (
      e.target instanceof Element &&
      !interactiveElements.includes(e.target.tagName) &&
      !e.target.closest("a, button") // Check parent elements too
    ) {
      // Use requestAnimationFrame to defer navigation until after the current frame
      requestAnimationFrame(() => {
        navigate(`/${post.postedBy.username}/post/${post._id}`);
      });
    }
  }, [navigate, post._id, post.postedBy]);

  const handleReplySubmit = async (text: string, image: File | null) => {
    if (!text.trim() && !image) return;
    setIsReplying(true);

    try {
      const formData = new FormData();
      formData.append("text", text);
      if (image) {
        formData.append("img", image);
      }

      const res = await fetchWithSession(`/api/posts/reply/${post._id}`, {
        method: "PUT",
        body: formData,
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
      showToast("Success", "Reply posted successfully", "success");
      setDisplayComments(true); // Show comments after replying
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setIsReplying(false);
    }
  };

  return {
    currentUser,
    posts,
    setPosts,
    displayComments,
    setDisplayComments,
    isReplying,
    images,
    handleDeletePost,
    handleNotInterested,
    handlePostClick,
    handleReplySubmit,
  };
};
