import { getTabId, setCurrentTabUser, User } from "./api";

export const isMobileDevice = (): boolean => {
	const userAgent =
		navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || "";
	const mobilePatterns = [
		/Android/i,
		/webOS/i,
		/iPhone/i,
		/iPad/i,
		/iPod/i,
		/BlackBerry/i,
		/Windows Phone/i,
	];
	return (
		mobilePatterns.some((pattern) => pattern.test(userAgent)) ||
		window.innerWidth <= 768
	);
};

export const arePopupsBlocked = (): boolean => {
	if (isMobileDevice()) return true;
	try {
		const testPopup = window.open("", "test", "width=1,height=1");
		if (testPopup) {
			testPopup.close();
			return false;
		}
		return true;
	} catch {
		return true;
	}
};

/** @deprecated Use arePopupsBlocked */
export const testPopupAllowed = (): boolean => !arePopupsBlocked();

export const getOAuthMethod = (): "redirect" | "popup" =>
	arePopupsBlocked() ? "redirect" : "popup";

export const openOAuthPopup = (
	url: string,
	name = "oauth",
	options: Record<string, string | number> = {}
): Promise<User> => {
	return new Promise((resolve, reject) => {
		const tabId = getTabId();
		const separator = url.includes("?") ? "&" : "?";
		const urlWithTabId = `${url}${separator}tabId=${tabId}`;

		const popupOptions = {
			width: 500,
			height: 600,
			scrollbars: "yes",
			resizable: "yes",
			toolbar: "no",
			menubar: "no",
			location: "no",
			directories: "no",
			status: "no",
			...options,
		};

		const left = Math.round(window.screen.width / 2 - Number(popupOptions.width) / 2);
		const top = Math.round(window.screen.height / 2 - Number(popupOptions.height) / 2);

		const optionsString = Object.entries({ ...popupOptions, left, top })
			.map(([key, value]) => `${key}=${value}`)
			.join(",");

		let popup = window.open(urlWithTabId, name, optionsString);
		if (!popup) {
			popup = window.open(urlWithTabId, "_blank");
		}

		if (!popup || popup.closed) {
			reject(
				new Error(
					!popup
						? "Popup blocked by browser. Please allow popups for this site."
						: "Popup was immediately closed."
				)
			);
			return;
		}

		try {
			popup.focus();
		} catch {
			/* ignore */
		}

		const messageListener = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "OAUTH_SUCCESS") {
				cleanup();
				setCurrentTabUser(event.data.userData);
				resolve(event.data.userData);
			} else if (event.data.type === "OAUTH_ERROR") {
				cleanup();
				reject(new Error(event.data.error || "OAuth authentication failed"));
			}
		};

		const checkClosed = setInterval(() => {
			if (popup.closed) {
				cleanup();
				reject(new Error("OAuth popup was closed before completion"));
			}
		}, 1000);

		const cleanup = () => {
			window.removeEventListener("message", messageListener);
			clearInterval(checkClosed);
			if (!popup.closed) popup.close();
		};

		window.addEventListener("message", messageListener);

		setTimeout(() => {
			if (!popup.closed) {
				cleanup();
				reject(new Error("OAuth popup timed out"));
			}
		}, 5 * 60 * 1000);
	});
};

export const googleOAuthPopup = (
	useRedirectFallback = false
): Promise<User> => {
	return new Promise((resolve, reject) => {
		if (arePopupsBlocked()) {
			if (useRedirectFallback) {
				window.location.href = "/api/auth/google";
				return;
			}
			reject(
				new Error(
					"Popups are blocked. Please allow popups for this site or try the redirect method."
				)
			);
			return;
		}

		openOAuthPopup("/api/auth/google/popup", "google_oauth", {
			width: 500,
			height: 600,
		})
			.then(resolve)
			.catch((error) => {
				if (
					useRedirectFallback &&
					error.message.includes("Popup blocked")
				) {
					window.location.href = "/api/auth/google";
					return;
				}
				reject(error);
			});
	});
};

export const handleOAuthPopupCallback = () => {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const oauthSuccess = urlParams.get("oauth");
		const oauthError = urlParams.get("error");
		const setupRequired = urlParams.get("setup");
		const sessionPath = urlParams.get("session");
		const tabId = urlParams.get("tabId");

		if (oauthSuccess === "success") {
			fetch(`/api/auth/oauth/user?session=${sessionPath || ""}`, {
				credentials: "include",
			})
				.then((response) => response.json())
				.then((userData) => {
					userData.sessionPath = sessionPath;
					userData.tabId = tabId;
					userData.setupRequired = setupRequired === "required";
					window.opener?.postMessage(
						{ type: "OAUTH_SUCCESS", userData },
						window.location.origin
					);
					window.close();
				})
				.catch(() => {
					window.opener?.postMessage(
						{ type: "OAUTH_ERROR", error: "Failed to fetch user data" },
						window.location.origin
					);
					window.close();
				});
		} else if (oauthError) {
			const errorMessage =
				oauthError === "oauth_failed"
					? "Google authentication was cancelled or failed"
					: oauthError === "oauth_callback_failed"
						? "Failed to process Google login"
						: "Google login failed";

			window.opener?.postMessage(
				{ type: "OAUTH_ERROR", error: errorMessage },
				window.location.origin
			);
			window.close();
		}
	} catch {
		window.opener?.postMessage(
			{ type: "OAUTH_ERROR", error: "OAuth callback processing failed" },
			window.location.origin
		);
		window.close();
	}
};

const redirectToGoogleAuth = () => {
	sessionStorage.setItem("oauth_redirect_time", Date.now().toString());
	if (isMobileDevice()) {
		setTimeout(() => {
			window.location.href = "/api/auth/google";
		}, 500);
	} else {
		window.location.href = "/api/auth/google";
	}
};

export const startGoogleOAuth = async (
	onSuccess: (userData: User) => void,
	onError: (error: unknown) => void,
	setLoading: (loading: boolean) => void
) => {
	try {
		setLoading(true);

		if (getOAuthMethod() === "redirect") {
			redirectToGoogleAuth();
			return;
		}

		try {
			const userData = await googleOAuthPopup(false);
			onSuccess(userData);
		} catch {
			redirectToGoogleAuth();
		}
	} catch (error) {
		setLoading(false);
		onError(error);
	}
};

/** @deprecated Use startGoogleOAuth */
export const handleMobileOAuth = startGoogleOAuth;

export const isOAuthCallback = (): boolean => {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.has("oauth") || urlParams.has("error");
};

export const handleOAuthCallback = async (): Promise<User | null> => {
	const urlParams = new URLSearchParams(window.location.search);
	const oauthSuccess = urlParams.get("oauth");
	const oauthError = urlParams.get("error");
	const setupRequired = urlParams.get("setup");
	const sessionPath = urlParams.get("session");

	if (oauthSuccess === "success") {
		const response = await fetch(
			`/api/auth/oauth/user?session=${sessionPath || ""}`,
			{ credentials: "include" }
		);

		if (!response.ok) throw new Error("Failed to fetch user data");

		const userData = await response.json();
		userData.setupRequired = setupRequired === "required";
		userData.sessionPath = sessionPath;
		window.history.replaceState({}, document.title, window.location.pathname);
		return userData;
	}

	if (oauthError) {
		window.history.replaceState({}, document.title, window.location.pathname);
		throw new Error(
			oauthError === "oauth_failed" ? "Google login failed" : oauthError
		);
	}

	return null;
};

export const getOAuthButtonText = () =>
	isMobileDevice() ? "Continue with Google" : "Sign in with Google";

export const getOAuthLoadingText = () =>
	isMobileDevice() ? "Redirecting..." : "Opening Google...";
