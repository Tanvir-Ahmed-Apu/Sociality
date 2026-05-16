// v2
import { useEffect } from "react";
import { Flex, Spinner } from "@chakra-ui/react";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import { useParams, useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { postsAtom } from "../atoms";
import { Post as PostType, fetchWithSession } from "../utils/api";
import Post from "../features/post/components/Post";
import ContentCard from "../components/ui/ContentCard";

const PostPage = () => {
	const { user, loading } = useGetUserProfile();
	const [posts, setPosts] = useRecoilState(postsAtom);
	const showToast = useShowToast();
	const { pid } = useParams();
	const location = useLocation();

	// Get the current post from the posts array
	const currentPost = posts.find((p: PostType) => p._id === pid);

	// Get highlighted reply ID from URL search params
	const searchParams = new URLSearchParams(location.search);
	const highlightReplyId = searchParams.get('highlight');

	useEffect(() => {
		const getPost = async () => {
			try {
				const res = await fetchWithSession(`/api/posts/${pid}`);
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					return;
				}
				
				// Keep the feed intact! Update or append the specific post.
				setPosts((prev) => {
					const exists = prev.some(p => p._id === data._id);
					if (exists) {
						return prev.map(p => p._id === data._id ? data : p);
					}
					return [data, ...prev];
				});
			} catch (error: any) {
				showToast("Error", error.message, "error");
			}
		};
		getPost();
	}, [showToast, pid, setPosts]);

	if (!user && loading) {
		return (
			<Flex justifyContent={"center"}>
				<Spinner size={"xl"} />
			</Flex>
		);
	}

	if (!currentPost) return null;

	return (
		<ContentCard p={0} mb={6}>
			<Post 
				post={currentPost} 
				isPostPage={true} 
				showComments={true}
				highlightReplyId={highlightReplyId || undefined}
			/>
		</ContentCard>
	);
};

export default PostPage;
