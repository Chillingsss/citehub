import React, { useState, useRef, useEffect } from "react";
import ProfileModal from "./ProfileModal";
import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router-dom";

export default function AvatarDropdown({
	profile = {},
	onLogout,
	userRole = "User",
	userId,
	onProfileUpdate,
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [profileModalOpen, setProfileModalOpen] = useState(false);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			}
		}
		if (dropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [dropdownOpen]);

	const handleProfileClick = () => {
		setProfileModalOpen(true);
		setDropdownOpen(false);
	};

	const handleSettingsClick = () => {
		// TODO: Implement settings functionality
		console.log("Settings clicked");
	};

	const handleNavigateToProfile = () => {
		if (!userId) return;
		const currentPath = window.location.pathname;
		let dashboardType = "";
		if (currentPath.includes("/AdminDashboard")) {
			dashboardType = "/AdminDashboard";
		} else if (currentPath.includes("/StudentDashboard")) {
			dashboardType = "/StudentDashboard";
		} else if (currentPath.includes("/FacultyDashboard")) {
			dashboardType = "/FacultyDashboard";
		} else if (currentPath.includes("/SboDashboard")) {
			dashboardType = "/SboDashboard";
		} else {
			// default to StudentDashboard if unknown
			dashboardType = "/StudentDashboard";
		}
		setDropdownOpen(false);
		navigate(`${dashboardType}/${userId}`);
	};

	return (
		<>
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setDropdownOpen((v) => !v)}
					className="flex items-center transition-transform duration-200 focus:outline-none hover:scale-105"
				>
					<div className="flex justify-center items-center w-9 h-9 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm">
						{`${profile?.user_name?.charAt(0) || userRole?.charAt(0) || ""}`}
					</div>
					<svg
						className={`ml-2 w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
							dropdownOpen ? "rotate-180" : ""
						}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{dropdownOpen && (
					<div className="overflow-hidden absolute right-0 z-50 mt-3 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-[#282828] dark:border-gray-700">
						{/* Profile Header */}
						<div className="p-4 bg-gradient-to-r from-green-700 to-green-800">
							<div
								className="flex items-center cursor-pointer"
								onClick={handleNavigateToProfile}
								title="View profile"
							>
								<div className="flex justify-center items-center w-9 h-9 text-xs font-semibold text-black bg-gray-300 rounded-full ring-2 sm:w-10 sm:h-10 sm:text-sm">
									{`${
										profile?.user_name?.charAt(0) || userRole?.charAt(0) || ""
									}`}
								</div>
								<div className="ml-3 text-white">
									<div className="text-sm font-semibold">
										{profile?.user_name || userRole}
									</div>
									<div className="text-xs opacity-90">{userRole}</div>
								</div>
							</div>
						</div>

						{/* Menu Items */}
						<div className="py-2">
							<button
								onClick={handleProfileClick}
								className="flex items-center px-4 py-3 w-full text-left text-gray-700 transition-colors duration-200 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								<svg
									className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								Profile
							</button>
							<button
								onClick={handleSettingsClick}
								className="flex items-center px-4 py-3 w-full text-left text-gray-400 transition-colors duration-200 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-not-allowed"
								disabled
							>
								<svg
									className="mr-3 w-5 h-5 text-gray-400 dark:text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								Settings
							</button>

							{/* Theme Toggle */}
							<div className="px-4 py-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500 dark:text-gray-400">
										Theme
									</span>
									<ThemeToggle />
								</div>
							</div>

							<div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
							<button
								onClick={onLogout}
								className="flex items-center px-4 py-3 w-full text-left text-red-600 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
							>
								<svg
									className="mr-3 w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Logout
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Profile Modal */}
			<ProfileModal
				isOpen={profileModalOpen}
				onClose={() => setProfileModalOpen(false)}
				profile={profile}
				userId={userId}
				onProfileUpdate={onProfileUpdate}
			/>
		</>
	);
}
