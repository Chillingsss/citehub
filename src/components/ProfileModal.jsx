import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import { getProfile } from "../utils/faculty";
import { profileTabs } from "./profile/profileTabs";
import ProfileDetailsTab from "./profile/ProfileDetailsTab";
import ChangePasswordTab from "./profile/ChangePasswordTab";

export default function ProfileModal({
	isOpen,
	onClose,
	profile,
	userId,
	onProfileUpdate,
}) {
	const [activeTab, setActiveTab] = useState("details");
	const [currentProfile, setCurrentProfile] = useState(profile);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	// Update current profile when profile prop changes
	useEffect(() => {
		setCurrentProfile(profile);
	}, [profile]);

	const handlePasswordFormChange = (e) => {
		const { name, value } = e.target;
		setPasswordForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleUpdateProfile = async (updatedData) => {
		setIsLoading(true);
		setMessage({ type: "", text: "" });

		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "updateProfile");
			formData.append(
				"json",
				JSON.stringify({
					user_id: userId,
					...updatedData,
				})
			);

			const response = await axios.post(`${apiUrl}/student.php`, formData);
			const result = response.data;

			if (result.success) {
				setMessage({ type: "success", text: "Profile updated successfully!" });

				// Fetch fresh profile data from database
				try {
					const freshProfile = await getProfile(userId);
					setCurrentProfile(freshProfile);
				} catch (error) {
					console.error("Error fetching updated profile:", error);
				}

				// Call the refresh callback to update the dashboard
				if (onProfileUpdate) {
					onProfileUpdate();
				}

				// Clear the success message after 3 seconds
				setTimeout(() => {
					setMessage({ type: "", text: "" });
				}, 3000);
			} else {
				setMessage({
					type: "error",
					text: result.message || "Failed to update profile",
				});
				throw new Error(result.message || "Failed to update profile");
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			setMessage({
				type: "error",
				text: "An error occurred while updating profile",
			});
			throw error; // Re-throw to prevent ProfileDetailsTab from closing edit mode
		} finally {
			setIsLoading(false);
		}
	};

	const handleChangePassword = async () => {
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setMessage({ type: "error", text: "New passwords do not match" });
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			setMessage({
				type: "error",
				text: "Password must be at least 8 characters long",
			});
			return;
		}

		if (!passwordForm.currentPassword.trim()) {
			setMessage({ type: "error", text: "Please enter your current password" });
			return;
		}

		setIsLoading(true);
		setMessage({ type: "", text: "" });

		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();
			formData.append("operation", "changePassword");
			formData.append(
				"json",
				JSON.stringify({
					user_id: userId,
					current_password: passwordForm.currentPassword,
					new_password: passwordForm.newPassword,
				})
			);

			const response = await axios.post(`${apiUrl}/student.php`, formData);
			const result = response.data;

			if (result.success) {
				setMessage({ type: "success", text: "Password changed successfully!" });
				// Reset password form
				setPasswordForm({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			} else {
				setMessage({
					type: "error",
					text: result.message || "Failed to change password",
				});
			}
		} catch (error) {
			console.error("Error changing password:", error);
			setMessage({
				type: "error",
				text: "An error occurred while changing password",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const resetPasswordForm = () => {
		setPasswordForm({
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});
		setMessage({ type: "", text: "" });
	};

	const handleClose = () => {
		setActiveTab("details");
		setPasswordForm({
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});
		setMessage({ type: "", text: "" });
		onClose();
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case "details":
				return (
					<ProfileDetailsTab
						profile={currentProfile}
						onProfileUpdate={handleUpdateProfile}
					/>
				);
			case "password":
				return (
					<ChangePasswordTab
						passwordForm={passwordForm}
						handlePasswordFormChange={handlePasswordFormChange}
						handleChangePassword={handleChangePassword}
						resetPasswordForm={resetPasswordForm}
						isLoading={isLoading}
						profile={currentProfile}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className={`fixed inset-0 z-50 transition-opacity duration-300 ${
				isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
		>
			{/* Backdrop - not clickable */}
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

			{/* Modal content - prevent clicks from bubbling to backdrop */}
			<div
				className={`fixed inset-y-0 right-0 flex flex-col w-full max-w-xl bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Profile Settings
					</h2>
					<button
						onClick={handleClose}
						className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{message.text && (
					<div
						className={`mx-6 mt-4 p-3 rounded-lg ${
							message.type === "success"
								? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
								: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
						}`}
					>
						{message.text}
					</div>
				)}

				<div className="flex gap-1 p-4 border-b dark:border-gray-700 overflow-x-auto">
					{profileTabs.map((tab) => {
						const IconComponent = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
									activeTab === tab.id
										? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
										: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
								}`}
								title={tab.description}
							>
								<IconComponent className="w-4 h-4" />
								{tab.name}
							</button>
						);
					})}
				</div>

				<div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
			</div>
		</div>
	);
}
