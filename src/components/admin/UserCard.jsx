import React from "react";
import {
	Pencil,
	User,
	Mail,
	Shield,
	GraduationCap,
	Users,
	X,
	Save,
	RefreshCw,
	Info,
} from "lucide-react";

export default function UserCard({
	user,
	isEditing,
	editDrafts,
	onStartEdit,
	onUpdateDraft,
	onSave,
	saving,
	colorTheme,
	yearLevels,
	tribes,
	showTribeManager,
	selectedUsers,
	onToggleSelection,
}) {
	const getInitials = (firstName, lastName) => {
		return `${firstName?.charAt(0) || ""}${
			lastName?.charAt(0) || ""
		}`.toUpperCase();
	};

	const roleColors = {
		Admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
		Faculty: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
		"SBO Officer":
			"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
		Student:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
	};

	if (isEditing) {
		return (
			<div className="p-2 bg-white md:p-3 dark:bg-gray-800">
				<div className="space-y-4">
					{/* Edit Form Header */}
					<div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
						<div className="flex gap-2 items-center">
							<div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full dark:from-emerald-900 dark:to-green-900">
								<Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<h4 className="text-base font-semibold text-gray-900 dark:text-white">
									Editing User
								</h4>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									ID: {user.user_id}
								</p>
							</div>
						</div>
						<button
							onClick={() => onStartEdit({ user_id: null })}
							className="p-1.5 text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Form Fields */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-1.5">
							<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
								<User className="w-3 h-3 text-gray-500" />
								User ID
							</label>
							<input
								type="text"
								className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								value={editDrafts.newUserId || editDrafts.userId || ""}
								onChange={(e) => onUpdateDraft("newUserId", e.target.value)}
								placeholder="Enter user ID"
							/>
							{editDrafts.newUserId &&
								editDrafts.newUserId !== editDrafts.userId && (
									<div className="flex gap-1.5 items-center p-2 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
										<Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
										<span className="text-xs text-blue-700 dark:text-blue-300">
											User ID will be changed from "{editDrafts.userId}" to "
											{editDrafts.newUserId}"
										</span>
									</div>
								)}
						</div>
						<div className="space-y-1.5">
							<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
								<User className="w-3 h-3 text-gray-500" />
								Name
							</label>
							<input
								type="text"
								className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								value={editDrafts.name || ""}
								onChange={(e) => onUpdateDraft("name", e.target.value)}
								placeholder="Enter name"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
								<Mail className="w-3 h-3 text-gray-500" />
								Email Address
							</label>
							<input
								type="email"
								className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								value={editDrafts.email || ""}
								onChange={(e) => onUpdateDraft("email", e.target.value)}
								placeholder="Enter email address"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
								<Shield className="w-3 h-3 text-gray-500" />
								User Role
							</label>
							<select
								className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								value={editDrafts.role || ""}
								onChange={(e) => onUpdateDraft("role", e.target.value)}
							>
								<option value="Admin">Administrator</option>
								<option value="Faculty">Faculty Member</option>
								<option value="Student">Student</option>
								<option value="SBO Officer">SBO Officer</option>
							</select>
						</div>

						{/* Year Level Selection for Students and SBO Officers */}
						{(editDrafts.role === "Student" ||
							editDrafts.role === "SBO Officer") && (
							<div className="space-y-1.5">
								<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
									<GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
									Year Level
								</label>
								<select
									className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									value={editDrafts.yearLevelId || ""}
									onChange={(e) => onUpdateDraft("yearLevelId", e.target.value)}
								>
									<option value="">Select Year Level</option>
									{yearLevels?.map((level) => (
										<option key={level.yearL_id} value={level.yearL_id}>
											{level.yearL_name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Tribe Selection for Faculty and SBO Officers */}
						{(editDrafts.role === "Faculty" ||
							editDrafts.role === "SBO Officer") && (
							<div className="space-y-1.5">
								<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
									<Users className="w-3 h-3 text-gray-500" />
									Tribe
								</label>
								<select
									className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									value={editDrafts.tribeId || ""}
									onChange={(e) => onUpdateDraft("tribeId", e.target.value)}
								>
									<option value="">Select Tribe</option>
									{tribes?.map((tribe) => (
										<option key={tribe.tribe_id} value={tribe.tribe_id}>
											{tribe.tribe_name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Tribe Selection for Students */}
						{editDrafts.role === "Student" && (
							<div className="space-y-1.5">
								<label className="flex gap-1.5 items-center text-xs font-semibold text-gray-900 dark:text-white">
									<Users className="w-3 h-3 text-gray-500" />
									Tribe
								</label>
								<select
									className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border-2 border-gray-200 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									value={editDrafts.tribeId || ""}
									onChange={(e) => onUpdateDraft("tribeId", e.target.value)}
								>
									<option value="">Select Tribe</option>
									{tribes?.map((tribe) => (
										<option key={tribe.tribe_id} value={tribe.tribe_id}>
											{tribe.tribe_name}
										</option>
									))}
								</select>
							</div>
						)}
					</div>

					{/* Password Reset Option */}
					<div className="p-3 bg-yellow-50 rounded-md border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
						<label className="flex gap-2 items-center">
							<input
								type="checkbox"
								className="w-4 h-4 text-yellow-600 bg-white rounded border-2 border-yellow-300 focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:border-yellow-600"
								checked={!!editDrafts.resetPassword}
								onChange={(e) =>
									onUpdateDraft("resetPassword", e.target.checked)
								}
							/>
							<div>
								<span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
									Reset password to user ID
								</span>
								<p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
									The user will need to change their password on next login
									{editDrafts.newUserId &&
										editDrafts.newUserId !== editDrafts.userId && (
											<span className="block mt-1">
												New password will be:{" "}
												<strong>{editDrafts.newUserId}</strong>
											</span>
										)}
								</p>
							</div>
						</label>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col gap-2 pt-3 sm:flex-row">
						<button
							onClick={onSave}
							disabled={saving}
							className="flex flex-1 gap-1.5 justify-center items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-md transition-all hover:from-emerald-700 hover:to-green-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? (
								<RefreshCw className="w-3 h-3 animate-spin" />
							) : (
								<Save className="w-3 h-3" />
							)}
							{saving ? "Saving Changes..." : "Save Changes"}
						</button>
						<button
							onClick={() => onStartEdit({ user_id: null })}
							disabled={saving}
							className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md transition-colors sm:flex-none hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`p-2 transition-colors md:p-3 ${
				showTribeManager && selectedUsers.includes(user.user_id)
					? "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500"
					: showTribeManager
					? "bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:border-l-4 hover:border-emerald-300 dark:hover:border-emerald-600"
					: "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
			} ${
				showTribeManager ? "cursor-pointer border-l-4 border-transparent" : ""
			}`}
			onClick={
				showTribeManager ? () => onToggleSelection(user.user_id) : undefined
			}
		>
			<div className="flex flex-col gap-2 lg:flex-row lg:items-center">
				{/* User Info */}
				<div className="flex-1">
					<div className="flex gap-2 items-center mb-2">
						{/* Tribe Management Checkbox */}
						{showTribeManager && (
							<input
								type="checkbox"
								checked={selectedUsers.includes(user.user_id)}
								onChange={(e) => {
									e.stopPropagation(); // Prevent card click when clicking checkbox
									onToggleSelection(user.user_id);
								}}
								className="w-4 h-4 text-emerald-600 bg-white rounded border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600"
							/>
						)}

						<div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full shadow-sm dark:from-emerald-900 dark:to-green-900">
							<span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
								{getInitials(user.user_name)}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<h4 className="text-base font-semibold text-gray-900 truncate dark:text-white">
								{user.user_name}
							</h4>
							<div className="flex gap-2 items-center mt-1">
								<Mail className="w-3 h-3 text-gray-400" />
								<p className="text-xs text-gray-600 truncate dark:text-gray-400">
									{user.user_email}
								</p>
								{showTribeManager && (
									<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
										• Click to select
									</span>
								)}
							</div>
						</div>
					</div>

					{/* User Details */}
					<div className="flex flex-wrap gap-1.5 items-center">
						<div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
							<User className="w-3 h-3 text-gray-500" />
							<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
								ID: {user.user_id}
							</span>
						</div>
						<span
							className={`px-2 py-1 rounded-md text-xs font-medium ${
								roleColors[user.userLevel] || roleColors.Student
							}`}
						>
							{user.userLevel}
						</span>
						{/* Year Level Display */}
						{(user.userLevel === "Student" ||
							user.userLevel === "SBO Officer") &&
							user.yearLevel && (
								<div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
									<GraduationCap className="w-3 h-3 text-blue-500" />
									<span className="text-xs font-medium text-blue-700 dark:text-blue-300">
										{user.yearLevel}
									</span>
								</div>
							)}
						{/* Tribe Display */}
						{(user.userLevel === "Faculty" ||
							user.userLevel === "Student" ||
							user.userLevel === "SBO Officer") &&
							user.tribe && (
								<div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
									<Users className="w-3 h-3 text-purple-500" />
									<span className="text-xs font-medium text-purple-700 dark:text-purple-300">
										{user.tribe}
									</span>
								</div>
							)}

						{/* Current Tribe Indicator for Tribe Management */}
						{showTribeManager && user.tribe && (
							<div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-md">
								<span className="text-xs font-medium text-amber-700 dark:text-amber-300">
									Current: {user.tribe}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2 items-center">
					<button
						onClick={() => onStartEdit(user)}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
					>
						<Pencil className="w-3 h-3" />
						<span className="hidden sm:inline">Edit</span>
					</button>
				</div>
			</div>
		</div>
	);
}
