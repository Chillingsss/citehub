import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function loginUser(username, password) {
	const formData = new FormData();
	formData.append("operation", "login");
	formData.append("json", JSON.stringify({ username: username, password }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function checkPasswordReset(username) {
	const formData = new FormData();
	formData.append("operation", "checkPasswordReset");
	formData.append("json", JSON.stringify({ username }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function sendPasswordResetOTP(username) {
	const formData = new FormData();
	formData.append("operation", "sendPasswordResetOTP");
	formData.append("json", JSON.stringify({ username }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function sendPasswordForgotOTP(email) {
	const formData = new FormData();
	formData.append("operation", "sendPasswordForgotOTP");
	formData.append("json", JSON.stringify({ email }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function verifyOTP(username, otp) {
	const formData = new FormData();
	formData.append("operation", "verifyOTP");
	formData.append("json", JSON.stringify({ username, otp }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function verifyPasswordResetOTP(username, otp, newPassword) {
	const formData = new FormData();
	formData.append("operation", "verifyPasswordResetOTP");
	formData.append("json", JSON.stringify({ username, otp, newPassword }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function verifyPasswordForgotOTP(email, newPassword) {
	const formData = new FormData();
	formData.append("operation", "verifyPasswordForgotOTP");
	formData.append(
		"json",
		JSON.stringify({ email: email, newPassword: newPassword })
	);

	const apiUrl = getDecryptedApiUrl();

	console.log("email", email);
	console.log("newPassword", newPassword);

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		console.log("response", response.data);

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function checkEmail(email) {
	const formData = new FormData();
	formData.append("operation", "checkEmail");
	formData.append("json", JSON.stringify({ email }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function sendPasswordResetOtpMail(email, fullName) {
	const hostname =
		typeof window !== "undefined" ? window.location.hostname : "";
	const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
	const baseOverride = process.env.REACT_APP_MAIL_API_BASE;
	console.log("baseOverride", baseOverride);
	const endpoint = baseOverride
		? `${baseOverride.replace(/\/$/, "")}/api/send-password-reset-otp`
		: isLocal
		? "http://localhost:4001/send-password-reset-otp"
		: "/api/send-password-reset-otp";

	const { data } = await axios.post(endpoint, { email, fullName });
	return data;
}
