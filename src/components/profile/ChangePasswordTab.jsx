import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Check, X as XIcon } from "lucide-react";

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

export default function ChangePasswordTab({
	passwordForm,
	handlePasswordFormChange,
	handleChangePassword,
	resetPasswordForm,
	isLoading,
	profile,
}) {
	const [step, setStep] = useState(1); // 1: Confirm Password, 2: New Password
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleConfirmPassword = async () => {
		if (!passwordForm.currentPassword.trim()) {
			// You can add validation here if needed
			return;
		}

		// Move to step 2 for new password entry
		setStep(2);
	};

	const handleSubmitNewPassword = async () => {
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			// You can add error handling here
			return;
		}

		// Validate password against policy
		const { isValid } = validatePassword(passwordForm.newPassword);
		if (!isValid) {
			// Password validation failed - the policy checker will show the issues
			return;
		}

		// Proceed with password change
		await handleChangePassword();
	};

	const handleStartOver = () => {
		setStep(1);
		resetPasswordForm();
	};

	return (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
				Change Password
			</h3>

			{/* Step 1: Confirm Current Password */}
			{step === 1 && (
				<div className="space-y-4">
					<div className="text-center mb-6">
						<Lock className="mx-auto w-12 h-12 text-blue-600 dark:text-blue-400 mb-3" />
						<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Confirm Your Current Password
						</h4>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Enter your current password to continue
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Current Password
						</label>
						<div className="relative">
							<input
								type={showCurrentPassword ? "text" : "password"}
								name="currentPassword"
								value={passwordForm.currentPassword}
								onChange={handlePasswordFormChange}
								placeholder="Enter your current password"
								className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
							<button
								type="button"
								onClick={() => setShowCurrentPassword(!showCurrentPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							>
								{showCurrentPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<button
						onClick={handleConfirmPassword}
						disabled={isLoading || !passwordForm.currentPassword.trim()}
						className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Continue
					</button>
				</div>
			)}

			{/* Step 2: New Password */}
			{step === 2 && (
				<div className="space-y-4">
					<div className="text-center mb-6">
						<Lock className="mx-auto w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
						<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Create New Password
						</h4>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Enter your new password
						</p>
					</div>

					{/* New Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							New Password
						</label>
						<div className="relative">
							<input
								type={showNewPassword ? "text" : "password"}
								name="newPassword"
								value={passwordForm.newPassword}
								onChange={handlePasswordFormChange}
								placeholder="Enter new password"
								className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
							<button
								type="button"
								onClick={() => setShowNewPassword(!showNewPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							>
								{showNewPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
						{/* Password Policy Checker */}
						{passwordForm.newPassword && (
							<PasswordPolicyChecker password={passwordForm.newPassword} />
						)}
					</div>

					{/* Confirm New Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Confirm New Password
						</label>
						<div className="relative">
							<input
								type={showConfirmPassword ? "text" : "password"}
								name="confirmPassword"
								value={passwordForm.confirmPassword}
								onChange={handlePasswordFormChange}
								placeholder="Confirm new password"
								className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							>
								{showConfirmPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={handleStartOver}
							className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
						>
							Start Over
						</button>
						<button
							onClick={handleSubmitNewPassword}
							disabled={
								isLoading ||
								!passwordForm.newPassword ||
								!passwordForm.confirmPassword ||
								!validatePassword(passwordForm.newPassword).isValid ||
								passwordForm.newPassword !== passwordForm.confirmPassword
							}
							className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							{isLoading ? "Changing Password..." : "Change Password"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
