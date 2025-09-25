import React, { useState, useEffect } from "react";
import { Mail, Edit, Save, X } from "lucide-react";

export default function ProfileDetailsTab({ profile, onProfileUpdate }) {
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({
		user_name: profile?.user_name || "",
	});

	// Update form when profile changes
	useEffect(() => {
		if (profile?.user_name) {
			setEditForm({
				user_name: profile.user_name,
			});
		}
	}, [profile]);

	const handleEditFormChange = (e) => {
		const { name, value } = e.target;
		setEditForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSave = async () => {
		try {
			// Call the parent's update function
			if (onProfileUpdate) {
				await onProfileUpdate(editForm);
			}
			setIsEditing(false);
		} catch (error) {
			console.error("Error saving profile:", error);
			// Don't close editing mode if there's an error
		}
	};

	const handleCancel = () => {
		// Reset form to current profile values
		setEditForm({
			user_name: profile?.user_name || "",
		});
		setIsEditing(false);
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				{/* <img
					src={
						profile?.avatar ||
						`https://ui-avatars.com/api/?name=${encodeURIComponent(
							profile?.user_name
						)}`
					}
					alt="Profile"
					className="mx-auto w-24 h-24 rounded-full border-4 border-green-500 shadow-lg"
				/> */}

				<div className="flex justify-center items-center mx-auto w-20 h-20 text-xl font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full">
					{`${profile?.user_name?.charAt(0)}`}
				</div>

				{/* Name - Editable */}
				{isEditing ? (
					<div className="mt-4 space-y-3">
						<input
							type="text"
							name="user_name"
							value={editForm.user_name}
							onChange={handleEditFormChange}
							placeholder="Enter your name"
							className="w-full px-3 py-2 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
					</div>
				) : (
					<h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
						{profile?.user_name}
					</h3>
				)}

				<p className="text-gray-600 dark:text-gray-400">
					{profile?.user_email}
				</p>
			</div>

			{/* Edit/View Toggle */}
			<div className="flex justify-center">
				{!isEditing ? (
					<button
						onClick={() => setIsEditing(true)}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
					>
						<Edit className="w-4 h-4" />
						Edit Profile
					</button>
				) : (
					<div className="flex gap-2">
						<button
							onClick={handleSave}
							className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
						>
							<Save className="w-4 h-4" />
							Save Changes
						</button>
						<button
							onClick={handleCancel}
							className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
						>
							<X className="w-4 h-4" />
							Cancel
						</button>
					</div>
				)}
			</div>

			{/* Email - Read Only */}
			<div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
				<Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
				<div className="flex-1">
					<div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
					<div className="font-medium text-gray-900 dark:text-gray-100">
						{profile?.user_email || "Not provided"}
					</div>
				</div>
			</div>
		</div>
	);
}
