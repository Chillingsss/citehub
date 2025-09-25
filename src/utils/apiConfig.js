import CryptoJS from "crypto-js";

const SECRET_KEY = "sociatrac_api_secret_key";
const SESSION_KEY = "sociatrac_encrypted_api_url";
const FALLBACK_API_URL = "https://coc-studentinfo.net/cite/socialtrack/api";
// const FALLBACK_API_URL = "http://localhost/socialtrack/api";

export const COOKIE_KEY = "cite_user";
export const COOKIE_SECRET_KEY = "cite_secret_key";

/**
 * Set the encrypted API URL in session storage
 * @param {string} apiUrl - The API URL to encrypt and store
 */
export const setEncryptedApiUrl = (apiUrl) => {
	try {
		const encrypted = CryptoJS.AES.encrypt(apiUrl, SECRET_KEY).toString();
		sessionStorage.setItem(SESSION_KEY, encrypted);
	} catch (error) {
		console.error("Error encrypting API URL:", error);
	}
};

/**
 * Get the decrypted API URL from session storage
 * @returns {string} - The decrypted API URL or fallback URL if not found/invalid
 */
export const getDecryptedApiUrl = () => {
	try {
		// Check if sessionStorage is available
		if (typeof sessionStorage === "undefined") {
			return FALLBACK_API_URL;
		}

		const encrypted = sessionStorage.getItem(SESSION_KEY);
		if (!encrypted) {
			console.warn(
				"No encrypted API URL found in session storage, initializing..."
			);
			setEncryptedApiUrl(FALLBACK_API_URL);
			return FALLBACK_API_URL;
		}

		const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
		const decrypted = bytes.toString(CryptoJS.enc.Utf8);

		if (!decrypted) {
			console.error("Failed to decrypt API URL, using fallback");
			setEncryptedApiUrl(FALLBACK_API_URL);
			return FALLBACK_API_URL;
		}

		return decrypted;
	} catch (error) {
		console.error("Error decrypting API URL, using fallback:", error);
		return FALLBACK_API_URL;
	}
};

/**
 * Remove the encrypted API URL from session storage
 */
export const removeEncryptedApiUrl = () => {
	try {
		if (typeof sessionStorage !== "undefined") {
			sessionStorage.removeItem(SESSION_KEY);
			console.log("Encrypted API URL removed from session storage");
		}
	} catch (error) {
		console.error("Error removing encrypted API URL:", error);
	}
};

/**
 * Initialize the API URL in session storage (call this once when the app starts)
 */
export const initializeApiUrl = () => {
	try {
		// Only initialize if session storage is available and not already set
		if (typeof sessionStorage !== "undefined") {
			const existing = sessionStorage.getItem(SESSION_KEY);
			if (!existing) {
				setEncryptedApiUrl(FALLBACK_API_URL);
				console.log("API URL initialized in session storage");
			} else {
				// console.log("API URL already exists in session storage");
			}
		}
	} catch (error) {
		console.error("Error initializing API URL:", error);
	}
};

/**
 * Get user_id from encrypted cookie
 * @returns {string|null} - The user_id or null if not found/invalid
 */
export const getUserIdFromCookie = () => {
	try {
		const encrypted = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${COOKIE_KEY}=`))
			?.split("=")[1];

		if (!encrypted) {
			console.warn("No user cookie found");
			return null;
		}

		const bytes = CryptoJS.AES.decrypt(encrypted, COOKIE_SECRET_KEY);
		const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

		return user?.user_id || null;
	} catch (error) {
		console.error("Error getting user_id from cookie:", error);
		return null;
	}
};
