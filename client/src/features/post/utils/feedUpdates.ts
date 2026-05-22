import type { Post } from "../../../types/models";

type PostLike = Post | Record<string, unknown>;

export function updatePost<T extends PostLike>(
	posts: T[],
	postId: string,
	patch: Partial<T> | ((post: T) => T)
): T[] {
	return posts.map((post) => {
		if (post._id !== postId) return post;
		return typeof patch === "function"
			? patch(post)
			: { ...post, ...patch };
	});
}

export function mapPostReplies<T extends PostLike>(
	posts: T[],
	postId: string,
	mapReply: (reply: Record<string, unknown>) => Record<string, unknown>
): T[] {
	return updatePost(posts, postId, (post) => ({
		...post,
		replies: ((post.replies as Record<string, unknown>[]) || []).map(mapReply),
	}));
}

export function updateReplyInPost<T extends PostLike>(
	posts: T[],
	postId: string,
	replyId: string,
	patch: Record<string, unknown> | ((reply: Record<string, unknown>) => Record<string, unknown>)
): T[] {
	return mapPostReplies(posts, postId, (reply) => {
		if (reply._id !== replyId) return reply;
		return typeof patch === "function" ? patch(reply) : { ...reply, ...patch };
	});
}

export function removeReplyFromPost<T extends PostLike>(
	posts: T[],
	postId: string,
	replyId: string
): T[] {
	return updatePost(posts, postId, (post) => ({
		...post,
		replies: ((post.replies as Record<string, unknown>[]) || []).filter(
			(r) => r._id !== replyId
		),
	}));
}

export function appendReplyToPost<T extends PostLike>(
	posts: T[],
	postId: string,
	reply: Record<string, unknown>
): T[] {
	return updatePost(posts, postId, (post) => ({
		...post,
		replies: [...((post.replies as Record<string, unknown>[]) || []), reply],
	}));
}

export function toggleIdInList(
	list: string[] | undefined,
	userId: string,
	shouldInclude: boolean
): string[] {
	const current = list || [];
	if (shouldInclude) {
		return current.includes(userId) ? current : [...current, userId];
	}
	return current.filter((id) => id !== userId);
}

export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result;
			if (typeof result === "string") resolve(result);
			else reject(new Error("Failed to read file"));
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}
