import { useRef, useEffect } from "react";

// OTP storage for local verification
const otpStorage = new Map();

export const useOTP = () => {
	const otpStorageRef = useRef(otpStorage);

	// Local OTP management functions
	const storeOTPLocally = (email, otp) => {
		const timestamp = Date.now();
		console.log("Storing OTP in local storage:", { email, otp, timestamp });
		otpStorageRef.current.set(email, {
			otp: otp,
			timestamp: timestamp,
			attempts: 0,
		});
		console.log(
			"Current OTP storage:",
			Array.from(otpStorageRef.current.entries())
		);
	};

	const verifyOTPLocally = (email, inputOTP) => {
		console.log("Verifying OTP for email:", email, "input OTP:", inputOTP);
		const otpData = otpStorageRef.current.get(email);
		console.log("Retrieved OTP data:", otpData);

		if (!otpData) {
			console.log("No OTP data found for email:", email);
			return false;
		}

		// Check if OTP is expired (5 minutes)
		const now = Date.now();
		const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
		const timeDiff = now - otpData.timestamp;
		console.log(
			"Time difference:",
			timeDiff,
			"ms, Expiration time:",
			expirationTime,
			"ms"
		);

		if (timeDiff > expirationTime) {
			console.log("OTP expired, deleting from storage");
			otpStorageRef.current.delete(email);
			return false;
		}

		// Check if max attempts reached (3 attempts)
		if (otpData.attempts >= 3) {
			console.log("Max attempts reached, deleting from storage");
			otpStorageRef.current.delete(email);
			return false;
		}

		// Verify OTP
		console.log(
			"Comparing OTPs - Stored:",
			otpData.otp,
			"Input:",
			inputOTP,
			"Match:",
			otpData.otp === inputOTP
		);
		if (otpData.otp === inputOTP) {
			console.log("OTP verified successfully");
			// Don't delete OTP yet - keep it for backend verification
			return true;
		} else {
			otpData.attempts++;
			console.log("OTP mismatch, attempts increased to:", otpData.attempts);
			return false;
		}
	};

	// New function to clear OTP after successful backend operation
	const clearOTPAfterSuccess = (email) => {
		console.log(
			"Clearing OTP after successful backend operation for email:",
			email
		);
		otpStorageRef.current.delete(email);
	};

	const clearOTPLocally = (email) => {
		otpStorageRef.current.delete(email);
	};

	return {
		storeOTPLocally,
		verifyOTPLocally,
		clearOTPLocally,
		clearOTPAfterSuccess,
	};
};
