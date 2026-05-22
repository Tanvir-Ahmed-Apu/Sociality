import { fetchWithSession } from "../../../utils/api";

export async function roomApiCall<T = Record<string, unknown>>(
	roomId: string,
	path: string,
	method = "GET",
	body?: unknown
): Promise<T> {
	const resp = await fetchWithSession(`/api/cross-platform/rooms/${roomId}${path}`, {
		method,
		headers: { "Content-Type": "application/json" },
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
	const json = await resp.json();
	if (!resp.ok || !json.success) {
		throw new Error(json.error || "Request failed");
	}
	return json as T;
}
