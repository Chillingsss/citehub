import { getDecryptedApiUrl } from "./apiConfig";

/**
 * Check if user is returning from OAuth authorization and retry upload
 */
export function checkOAuthReturn() {
	const urlParams = new URLSearchParams(window.location.search);
	const oauthSuccess = urlParams.get("oauth_success");

	if (oauthSuccess === "true") {
		// Clean up URL
		window.history.replaceState({}, document.title, window.location.pathname);

		// Show success message
		console.log("OAuth authorization completed successfully");

		// Try to retry any pending upload
		const pendingUpload = sessionStorage.getItem("pendingUpload");
		if (pendingUpload) {
			try {
				const uploadData = JSON.parse(pendingUpload);
				console.log("Found pending upload, attempting retry...");

				// Remove from session storage
				sessionStorage.removeItem("pendingUpload");

				// Trigger a custom event to retry the upload
				window.dispatchEvent(
					new CustomEvent("oauthComplete", {
						detail: uploadData,
					})
				);
			} catch (e) {
				console.error("Error processing pending upload:", e);
			}
		}
	}
}

/**
 * Upload file with automatic authorization handling
 * Tries direct upload first, handles authorization if needed
 */
export async function uploadWithAutoAuth(file) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("file", file);

	try {
		// First attempt: direct upload
		const response = await fetch(`${apiUrl}/upload.php`, {
			method: "POST",
			body: formData,
		});

		const data = await response.json();

		// If successful, return the result
		if (data.success) {
			return data;
		}

		// If authorization is required, handle it automatically
		if (data.requiresAuth && data.authUrl) {
			console.log(
				"Google Drive authorization required, opening authorization window..."
			);
			console.log("Auth URL:", data.authUrl);

			// Open OAuth URL in a new window
			const authWindow = window.open(
				data.authUrl,
				"googleDriveAuth",
				"width=600,height=700,scrollbars=yes,resizable=yes,location=yes,status=yes"
			);

			if (!authWindow) {
				// Fallback: redirect to OAuth URL in same window
				console.log("Popup blocked, redirecting to OAuth URL in same window");
				window.location.href = data.authUrl;
				return;
			}

			// Focus the popup window
			authWindow.focus();

			// Wait for authorization to complete
			await new Promise((resolve, reject) => {
				let resolved = false;
				let authCompleted = false;

				console.log("Setting up OAuth window listeners...");

				// Listen for messages from the popup window
				const messageListener = (event) => {
					console.log("Received message from popup:", event.data);
					if (event.data && event.data.type === "GOOGLE_DRIVE_AUTH_SUCCESS") {
						console.log("OAuth success message received");
						resolved = true;
						authCompleted = true;
						clearTimeout(timeoutId);
						window.removeEventListener("message", messageListener);
						resolve();
					} else if (
						event.data &&
						event.data.type === "GOOGLE_DRIVE_AUTH_ERROR"
					) {
						console.log("OAuth error message received:", event.data.error);
						resolved = true;
						clearTimeout(timeoutId);
						window.removeEventListener("message", messageListener);
						reject(new Error("OAuth Error: " + event.data.error));
					}
				};

				window.addEventListener("message", messageListener);

				// Use a simpler approach - just wait for the message or timeout
				// Don't check window.closed as it's blocked by COOP
				const timeoutId = setTimeout(() => {
					if (!resolved) {
						console.log("OAuth authorization timeout");
						window.removeEventListener("message", messageListener);
						reject(
							new Error(
								"Authorization timeout - please complete the authorization within 5 minutes"
							)
						);
					}
				}, 300000); // 5 minutes
			});

			// Wait a bit for the token to be saved
			console.log("Authorization completed, waiting for token to be saved...");
			await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased wait time

			// Retry upload after authorization
			console.log("Retrying upload...");
			const retryResponse = await fetch(`${apiUrl}/upload.php`, {
				method: "POST",
				body: formData,
			});

			const retryData = await retryResponse.json();
			console.log("Retry upload response:", retryData);

			if (retryData.success) {
				console.log("Upload successful after authorization");
				return retryData;
			} else if (retryData.requiresAuth && retryData.authUrl) {
				console.error(
					"Still requires authorization after retry:",
					retryData.debug
				);
				throw new Error(
					"Authorization did not complete successfully. Please try again."
				);
			} else {
				console.error("Upload failed after authorization:", retryData);
				throw new Error(retryData.error || "Upload failed after authorization");
			}
		}

		// Other errors
		throw new Error(data.error || "Upload failed");
	} catch (error) {
		console.error("Upload error:", error);
		throw error;
	}
}
