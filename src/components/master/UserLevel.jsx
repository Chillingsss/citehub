import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import {
	getUserLevels,
	addUserLevel,
	updateUserLevel,
	deleteUserLevel,
} from "../../utils/admin";
import ConfirmDialog from "../ui/ConfirmDialog";

// Add keyframe animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default function UserLevel() {
	const [userLevels, setUserLevels] = useState([]);
	const [isAddingUserLevel, setIsAddingUserLevel] = useState(false);
	const [isEditingUserLevel, setIsEditingUserLevel] = useState(false);
	const [selectedUserLevel, setSelectedUserLevel] = useState(null);
	const [userLevelName, setUserLevelName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false,
		userLevelId: null,
		userLevelName: "",
	});

	useEffect(() => {
		fetchUserLevels();
	}, []);

	const fetchUserLevels = async () => {
		try {
			setLoading(true);
			const response = await getUserLevels();
			if (response.success) {
				setUserLevels(response.userLevels);
			}
		} catch (error) {
			console.error("Error fetching user levels:", error);
			setError("Failed to fetch user levels");
		} finally {
			setLoading(false);
		}
	};

	const handleAddUserLevel = async () => {
		try {
			if (!userLevelName.trim()) {
				setError("User level name is required");
				return;
			}

			const response = await addUserLevel({
				userLevelName: userLevelName.trim(),
			});
			if (response.success) {
				await fetchUserLevels();
				setUserLevelName("");
				setIsAddingUserLevel(false);
				setError("");
			} else {
				setError(response.message || "Failed to add user level");
			}
		} catch (error) {
			console.error("Error adding user level:", error);
			setError("Failed to add user level");
		}
	};

	const handleUpdateUserLevel = async () => {
		try {
			if (!userLevelName.trim()) {
				setError("User level name is required");
				return;
			}

			const response = await updateUserLevel({
				userLevelId: selectedUserLevel.userL_id,
				userLevelName: userLevelName.trim(),
			});

			if (response.success) {
				await fetchUserLevels();
				setUserLevelName("");
				setIsEditingUserLevel(false);
				setSelectedUserLevel(null);
				setError("");
			} else {
				setError(response.message || "Failed to update user level");
			}
		} catch (error) {
			console.error("Error updating user level:", error);
			setError("Failed to update user level");
		}
	};

	const handleDeleteUserLevel = async (userLevelId) => {
		const userLevel = userLevels.find((ul) => ul.userL_id === userLevelId);
		setConfirmDialog({
			isOpen: true,
			userLevelId: userLevelId,
			userLevelName: userLevel?.userL_name || "",
		});
	};

	const confirmDeleteUserLevel = async () => {
		try {
			const response = await deleteUserLevel(confirmDialog.userLevelId);
			if (response.success) {
				await fetchUserLevels();
				setConfirmDialog({
					isOpen: false,
					userLevelId: null,
					userLevelName: "",
				});
			} else {
				setError(response.message || "Failed to delete user level");
				setConfirmDialog({
					isOpen: false,
					userLevelId: null,
					userLevelName: "",
				});
			}
		} catch (error) {
			console.error("Error deleting user level:", error);
			setError("Failed to delete user level");
			setConfirmDialog({ isOpen: false, userLevelId: null, userLevelName: "" });
		}
	};

	const cancelDeleteUserLevel = () => {
		setConfirmDialog({ isOpen: false, userLevelId: null, userLevelName: "" });
	};

	const startEdit = (userLevel) => {
		setSelectedUserLevel(userLevel);
		setUserLevelName(userLevel.userL_name);
		setIsEditingUserLevel(true);
		setError("");
	};

	const cancelEdit = () => {
		setIsAddingUserLevel(false);
		setIsEditingUserLevel(false);
		setSelectedUserLevel(null);
		setUserLevelName("");
		setError("");
	};

	const getUserLevelIcon = (userLevelName) => {
		return <User className="w-6 h-6" />;
	};

	const getUserLevelColor = (userLevelName) => {
		switch (userLevelName?.toLowerCase()) {
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
			case "faculty":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
			case "sbo officer":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
			case "student":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{/* Error Message */}
				{error && (
					<div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">
						{error}
					</div>
				)}

				{/* Add/Edit Form */}
				<div
					className={`transform transition-all duration-200 ${
						isAddingUserLevel || isEditingUserLevel
							? "opacity-100 translate-y-0 h-auto"
							: "opacity-0 -translate-y-4 h-0 overflow-hidden"
					}`}
				>
					<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div className="flex gap-2">
							<input
								type="text"
								value={userLevelName}
								onChange={(e) => setUserLevelName(e.target.value)}
								placeholder="Enter user level name"
								className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										isEditingUserLevel
											? handleUpdateUserLevel()
											: handleAddUserLevel();
									}
								}}
							/>
							<button
								onClick={
									isEditingUserLevel
										? handleUpdateUserLevel
										: handleAddUserLevel
								}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								{isEditingUserLevel ? "Update" : "Add"}
							</button>
							<button
								onClick={cancelEdit}
								className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>

				{/* Add Button */}
				{!isAddingUserLevel && !isEditingUserLevel && (
					<button
						onClick={() => setIsAddingUserLevel(true)}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform transition-all duration-200 hover:scale-[1.02]"
					>
						<Plus className="w-4 h-4" />
						Add New User Level
					</button>
				)}

				{/* User Levels List */}
				<div className="space-y-2">
					{userLevels.length === 0 ? (
						<div className="py-8 text-center text-gray-500 dark:text-gray-400">
							No user levels found. Add your first user level to get started.
						</div>
					) : (
						userLevels.map((userLevel, index) => (
							<div
								key={userLevel.userL_id}
								className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
								style={{
									opacity: 0,
									animation: `fadeSlideIn 0.3s ease-out forwards ${
										index * 0.1
									}s`,
								}}
							>
								<div className="flex items-center gap-3">
									<div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full">
										<span className="text-lg">
											{getUserLevelIcon(userLevel.userL_name)}
										</span>
									</div>
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span className="text-gray-900 dark:text-gray-100 font-medium">
												{userLevel.userL_name}
											</span>
											<span
												className={`text-xs font-medium px-2 py-1 rounded-full ${getUserLevelColor(
													userLevel.userL_name
												)}`}
											>
												Level {userLevel.userL_id}
											</span>
										</div>
										{userLevel.userL_createdby && (
											<span className="text-xs text-gray-500 dark:text-gray-400">
												Created:{" "}
												{new Date(
													userLevel.userL_createdby
												).toLocaleDateString()}
											</span>
										)}
									</div>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => startEdit(userLevel)}
										className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transform transition-all duration-200 hover:scale-110 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
										title="Edit user level"
									>
										<Pencil className="w-4 h-4" />
									</button>
									<button
										onClick={() => handleDeleteUserLevel(userLevel.userL_id)}
										className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transform transition-all duration-200 hover:scale-110 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
										title="Delete user level"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				onClose={cancelDeleteUserLevel}
				onConfirm={confirmDeleteUserLevel}
				type="danger"
				title="Delete User Level"
				message={`Are you sure you want to delete the user level "${confirmDialog.userLevelName}"? This action cannot be undone and may affect users assigned to this level.`}
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</>
	);
}
