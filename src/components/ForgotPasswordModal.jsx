import React, { useState } from "react";
import {
	X,
	Mail,
	LockKeyhole,
	Eye,
	EyeOff,
	AlertCircle,
	CheckCircle,
	Check,
	X as XIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";
import { verifyPasswordForgotOTP } from "../utils/security";
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

export default function ForgotPasswordModal({ isOpen, onClose }) {
	const [step, setStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");

	const handleCheckEmail = async () => {
		if (!email.trim()) {
			setError("Please enter your email address.");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			// Simply proceed to password reset step
			// The actual email validation will happen when the user tries to reset the password
			setStep(2);
			toast.success("Please create a new password.");
		} catch (err) {
			console.error("Email check error:", err);
			setError("Failed to verify email. Please try again.");
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
			const result = await verifyPasswordForgotOTP(email, newPassword);
			const data = typeof result === "string" ? JSON.parse(result) : result;

			if (data.success) {
				setStep(3);
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
		setEmail("");
		setNewPassword("");
		setConfirmPassword("");
		setShowNewPassword(false);
		setShowConfirmPassword(false);
		setError("");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/50">
			<div className="mx-4 w-full max-w-md bg-white rounded-3xl border border-green-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-green-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-green-900 dark:text-green-100">
						Forgot Password
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
					{/* Step 1: Enter Email */}
					{step === 1 && (
						<div className="space-y-4">
							<div className="text-center">
								<Mail className="mx-auto mb-4 w-12 h-12 text-green-600 dark:text-green-400" />
								<h3 className="mb-2 text-lg font-semibold text-green-900 dark:text-green-100">
									Enter Your Email
								</h3>
								<p className="text-sm text-green-600 dark:text-green-400">
									Enter your email address to reset your password.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
									Email Address
								</Label>
								<Input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email address"
									className="px-4 py-3 w-full text-green-900 rounded-2xl border-2 border-green-200 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500"
								/>
							</div>

							<Button
								onClick={handleCheckEmail}
								disabled={isLoading || !email.trim()}
								className="w-full py-3 px-6 rounded-2xl font-semibold bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
							>
								{isLoading ? (
									<div className="flex justify-center items-center space-x-3">
										<div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />
										<span>Verifying...</span>
									</div>
								) : (
									"Continue"
								)}
							</Button>
						</div>
					)}

					{/* Step 2: Enter New Password */}
					{step === 2 && (
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

					{/* Step 3: Success */}
					{step === 3 && (
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
					{step > 1 && step < 3 && (
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
								{Array.from({ length: 3 }, (_, i) => (
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
