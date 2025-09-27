import React, { useState, useEffect } from "react";
import {
	X,
	LockKeyhole,
	Eye,
	EyeOff,
	AlertCircle,
	CheckCircle,
	Check,
	X as XIcon,
	Mail,
	Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";
import {
	checkPasswordReset,
	verifyPasswordResetOTP,
	sendPasswordResetOtpMail,
} from "../utils/security";
import toast from "react-hot-toast";

// Password validation function
const validatePassword = (password) => {
	const rules = {
		minLength: password.length >= 8,
		hasUpperCase: /[A-Z]/.test(password),
		hasLowerCase: /[a-z]/.test(password),
		hasNumber: /\d/.test(password),
		hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
		noSpaces: !/\s/.test(password),
	};

	const isValid = Object.values(rules).every(Boolean);
	return { rules, isValid };
};

// Password Policy Checker Component
const PasswordPolicyChecker = ({ password }) => {
	const { rules } = validatePassword(password);

	const policyRules = [
		{ key: "minLength", label: "At least 8 characters", met: rules.minLength },
		{
			key: "hasUpperCase",
			label: "1 uppercase letter",
			met: rules.hasUpperCase,
		},
		{
			key: "hasLowerCase",
			label: "1 lowercase letter",
			met: rules.hasLowerCase,
		},
		{ key: "hasNumber", label: "1 number", met: rules.hasNumber },
		{
			key: "hasSpecialChar",
			label: "1 special character",
			met: rules.hasSpecialChar,
		},
		{ key: "noSpaces", label: "No spaces", met: rules.noSpaces },
	];

	return (
		<div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
			<p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
				Password Requirements:
			</p>
			<div className="space-y-1">
				{policyRules.map((rule) => (
					<div key={rule.key} className="flex items-center space-x-2">
						{rule.met ? (
							<Check className="w-3 h-3 text-green-500 dark:text-green-400" />
						) : (
							<XIcon className="w-3 h-3 text-red-500 dark:text-red-400" />
						)}
						<span
							className={`text-xs ${
								rule.met
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{rule.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default function PasswordResetModal({
	isOpen,
	onClose,
	username,
	isRequired = false,
}) {
	const [step, setStep] = useState(isRequired ? 2 : 1); // Start at step 2 (send OTP) if password reset is required
	const [isLoading, setIsLoading] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [userEmail, setUserEmail] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [otp, setOtp] = useState("");
	const [sentOtp, setSentOtp] = useState(""); // Store the OTP that was sent via email
	const [error, setError] = useState("");
	const [otpSent, setOtpSent] = useState(false);

	// Auto-fill email if password reset is required
	useEffect(() => {
		if (isRequired && isOpen) {
			// Get user email automatically
			handleGetUserEmail();
		}
	}, [isRequired, isOpen]);

	const handleGetUserEmail = async () => {
		if (!username.trim()) return;

		try {
			const result = await checkPasswordReset(username);
			const data = typeof result === "string" ? JSON.parse(result) : result;

			if (data.success && data.needsReset) {
				setUserEmail(data.user_email);
				setUserFullName(data.user_fullname || data.full_name || "");
			}
		} catch (err) {
			console.error("Error getting user email:", err);
		}
	};

	const handleCheckReset = async () => {
		if (!username.trim()) {
			setError("Please enter a username first.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const result = await checkPasswordReset(username);
			const data = typeof result === "string" ? JSON.parse(result) : result;

			if (data.success && data.needsReset) {
				setUserEmail(data.user_email);
				setUserFullName(data.user_fullname || data.full_name || "");
				setStep(2); // Go to send OTP step
				toast.success(
					"Password reset required. Please verify your email to continue."
				);
			} else if (data.success && !data.needsReset) {
				setError(
					"Password has already been changed. Please contact administrator if you need assistance."
				);
			} else {
				setError(data.message || "User not found or error occurred.");
			}
		} catch (err) {
			console.error("Check reset error:", err);
			setError("Failed to check password reset status. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendOTP = async () => {
		if (!userEmail.trim()) {
			setError("Email address is required.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const result = await sendPasswordResetOtpMail(userEmail, userFullName);

			if (result.status === "success") {
				// Store the OTP that was sent via email for validation
				setSentOtp(result.otp || "");
				setOtpSent(true);
				setStep(3); // Go to OTP verification step
				toast.success("OTP sent successfully to your email!");
			} else {
				setError(result.message || "Failed to send OTP. Please try again.");
			}
		} catch (err) {
			console.error("Send OTP error:", err);
			setError("Failed to send OTP. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOTP = async () => {
		if (!otp.trim() || otp.length !== 6) {
			setError("Please enter a valid 6-digit OTP.");
			return;
		}

		if (!sentOtp.trim()) {
			setError("No OTP found. Please request a new OTP.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			// Validate OTP format
			if (otp.length === 6 && /^\d{6}$/.test(otp)) {
				// Compare with the OTP that was sent via email
				if (otp === sentOtp) {
					setStep(4); // Go to password reset step
					toast.success("OTP verified successfully!");
				} else {
					setError("Invalid OTP. Please check the code and try again.");
				}
			} else {
				setError("Invalid OTP format. Please enter a 6-digit number.");
			}
		} catch (err) {
			console.error("Verify OTP error:", err);
			setError("Failed to verify OTP. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async () => {
		if (!newPassword.trim() || !confirmPassword.trim()) {
			setError("Please fill in all password fields.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		// Validate password against policy
		const { isValid, rules } = validatePassword(newPassword);
		if (!isValid) {
			const failedRules = [];
			if (!rules.minLength) failedRules.push("at least 8 characters");
			if (!rules.hasUpperCase) failedRules.push("1 uppercase letter");
			if (!rules.hasLowerCase) failedRules.push("1 lowercase letter");
			if (!rules.hasNumber) failedRules.push("1 number");
			if (!rules.hasSpecialChar) failedRules.push("1 special character");
			if (!rules.noSpaces) failedRules.push("no spaces");

			setError(`Password must contain: ${failedRules.join(", ")}.`);
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const result = await verifyPasswordResetOTP(username, otp, newPassword);
			const data = typeof result === "string" ? JSON.parse(result) : result;

			if (data.success) {
				setStep(5);
				toast.success("Password updated successfully!");
			} else {
				setError(
					data.message || "Failed to update password. Please try again."
				);
			}
		} catch (err) {
			console.error("Reset password error:", err);
			setError("Failed to update password. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setStep(1);
		setNewPassword("");
		setConfirmPassword("");
		setShowNewPassword(false);
		setShowConfirmPassword(false);
		setUserEmail("");
		setUserFullName("");
		setOtp("");
		setSentOtp("");
		setError("");
		setOtpSent(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/50">
			<div className="mx-4 w-full max-w-md bg-white rounded-3xl border border-green-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-green-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-green-900 dark:text-green-100">
						{isRequired ? "Password Reset Required" : "Password Reset"}
					</h2>
					<button
						onClick={handleClose}
						className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Step 1: Check Reset */}
					{step === 1 && (
						<div className="space-y-4">
							<div className="text-center">
								<LockKeyhole className="mx-auto mb-4 w-12 h-12 text-green-600 dark:text-green-400" />
								<h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
									Check Password Reset
								</h3>
								<p className="text-sm text-green-600 dark:text-green-400">
									{isRequired
										? "Your account requires a password reset before you can continue."
										: "Enter your username to check if password reset is required."}
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									Username
								</Label>
								<Input
									type="text"
									value={username}
									readOnly
									className="px-4 py-3 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50"
								/>
							</div>

							<Button
								onClick={handleCheckReset}
								disabled={isLoading || !username.trim()}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
							>
								{isLoading ? (
									<div className="flex justify-center items-center space-x-3">
										<div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />
										<span>Checking...</span>
									</div>
								) : isRequired ? (
									"Continue to Reset"
								) : (
									"Check Reset Status"
								)}
							</Button>
						</div>
					)}

					{/* Step 2: Send OTP */}
					{step === 2 && (
						<div className="space-y-4">
							<div className="text-center">
								<Mail className="mx-auto mb-4 w-12 h-12 text-green-600 dark:text-green-400" />
								<h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
									Verify Your Email
								</h3>
								<p className="text-sm text-green-600 dark:text-green-400">
									We'll send an OTP to your email address to verify your
									identity.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									Email Address
								</Label>
								<Input
									type="email"
									value={userEmail}
									readOnly
									className="px-4 py-3 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50"
								/>
							</div>

							{userFullName && (
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
										Full Name
									</Label>
									<Input
										type="text"
										value={userFullName}
										readOnly
										className="px-4 py-3 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50"
									/>
								</div>
							)}

							<Button
								onClick={handleSendOTP}
								disabled={isLoading || !userEmail.trim()}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
							>
								{isLoading ? (
									<div className="flex justify-center items-center space-x-3">
										<div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />
										<span>Sending...</span>
									</div>
								) : (
									"Send OTP to Email"
								)}
							</Button>
						</div>
					)}

					{/* Step 3: Verify OTP */}
					{step === 3 && (
						<div className="space-y-4">
							<div className="text-center">
								<Shield className="mx-auto mb-4 w-12 h-12 text-green-600 dark:text-green-400" />
								<h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
									Enter Verification Code
								</h3>
								<p className="text-sm text-green-600 dark:text-green-400">
									Please enter the 6-digit OTP sent to your email address.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									Verification Code
								</Label>
								<Input
									type="text"
									value={otp}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, "").slice(0, 6);
										setOtp(value);
									}}
									placeholder="Enter 6-digit code"
									className="px-4 py-3 w-full text-center text-2xl font-mono tracking-widest text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500"
								/>
							</div>

							<div className="text-center">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									Didn't receive the code?{" "}
									<button
										onClick={() => {
											setOtp(""); // Clear current OTP input
											handleSendOTP(); // Resend OTP
										}}
										disabled={isLoading}
										className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
									>
										Resend OTP
									</button>
								</p>
							</div>

							<Button
								onClick={handleVerifyOTP}
								disabled={isLoading || otp.length !== 6}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
							>
								{isLoading ? (
									<div className="flex justify-center items-center space-x-3">
										<div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />
										<span>Verifying...</span>
									</div>
								) : (
									"Verify OTP"
								)}
							</Button>
						</div>
					)}

					{/* Step 4: Enter New Password */}
					{step === 4 && (
						<div className="space-y-4">
							<div className="text-center">
								<LockKeyhole className="mx-auto mb-4 w-12 h-12 text-green-600 dark:text-green-400" />
								<h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
									Create New Password
								</h3>
								<p className="text-sm text-green-600 dark:text-green-400">
									Please create a new password for your account.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									New Password
								</Label>
								<div className="relative">
									<Input
										type={showNewPassword ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Enter new password"
										className="px-4 py-3 pr-12 pl-4 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500"
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute right-3 top-1/2 text-green-500 transition-colors transform -translate-y-1/2 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
									>
										{showNewPassword ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</button>
								</div>
								{/* Password Policy Checker */}
								{newPassword && (
									<PasswordPolicyChecker password={newPassword} />
								)}
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									Confirm New Password
								</Label>
								<div className="relative">
									<Input
										type={showConfirmPassword ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Confirm new password"
										className="px-4 py-3 pr-12 pl-4 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-3 top-1/2 text-green-500 transition-colors transform -translate-y-1/2 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
									>
										{showConfirmPassword ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</button>
								</div>
							</div>

							<Button
								onClick={handleResetPassword}
								disabled={
									isLoading ||
									!newPassword.trim() ||
									!confirmPassword.trim() ||
									!validatePassword(newPassword).isValid ||
									newPassword !== confirmPassword
								}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
							>
								{isLoading ? (
									<div className="flex justify-center items-center space-x-3">
										<div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />
										<span>Updating...</span>
									</div>
								) : (
									"Update Password"
								)}
							</Button>
						</div>
					)}

					{/* Step 5: Success */}
					{step === 5 && (
						<div className="space-y-4 text-center">
							<CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-600 dark:text-green-400" />
							<h3 className="mb-2 text-xl font-semibold text-green-900 dark:text-green-100">
								Password Reset Successful!
							</h3>
							<p className="mb-6 text-sm text-green-600 dark:text-green-400">
								Your password has been updated successfully. You can now log in
								with your new password.
							</p>

							<Button
								onClick={handleClose}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
							>
								Close
							</Button>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="flex items-start p-4 space-x-3 bg-red-50 rounded-2xl border border-red-200 dark:bg-red-900/20 dark:border-red-800">
							<AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
							<div>
								<p className="text-sm font-medium text-red-800 dark:text-red-300">
									Error
								</p>
								<p className="text-sm text-red-700 dark:text-red-400">
									{error}
								</p>
							</div>
						</div>
					)}

					{/* Navigation */}
					{step > 1 && step < 5 && (
						<div className="flex justify-between items-center pt-4 border-t border-green-200 dark:border-gray-700">
							<button
								onClick={() => {
									setStep(step - 1);
								}}
								className="text-sm text-green-600 transition-colors dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
							>
								← Back
							</button>
							<div className="flex space-x-2">
								{Array.from({ length: 5 }, (_, i) => (
									<div
										key={i}
										className={`w-2 h-2 rounded-full ${
											i + 1 === step
												? "bg-green-600 dark:bg-green-400"
												: "bg-green-200 dark:bg-gray-600"
										}`}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
