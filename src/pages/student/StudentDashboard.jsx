import React, { useState, useEffect, useRef } from "react";
import {
	getProfile,
	getPostsWithUserReactions,
	getPosts,
} from "../../utils/faculty";
import { getPendingPosts } from "../../utils/student";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { COOKIE_KEY, COOKIE_SECRET_KEY } from "../../utils/apiConfig";
import Feed from "../../components/Feed";
import AvatarDropdown from "../../components/AvatarDropdown";
import RefreshButton from "../../components/RefreshButton";
import PostCreation from "../../components/PostCreation";
import SearchBar from "../../components/SearchBar";
import QRCodeModal from "../../components/QRCodeModal";
import StudentTallyModal from "../../components/StudentTallyModal";
import RightSidebar from "../../components/RightSidebar";
import { Menu, Search } from "lucide-react"; // Added Menu icon import
import ArchiveTrashModal from "../../components/ArchiveTrashModal";
import PendingPostModal from "../../components/PendingPostModal";
import StudentEvaluationModal from "../../components/StudentEvaluationModal";

export default function StudentDashboard() {
	const [posts, setPosts] = useState([]);
	const [profile, setProfile] = useState(null);
	const [currentUserProfile, setCurrentUserProfile] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [tallyModalOpen, setTallyModalOpen] = useState(false);
	const [pendingPostModalOpen, setPendingPostModalOpen] = useState(false);
	const [pendingPostsCount, setPendingPostsCount] = useState(0);
	const [archiveTrashOpen, setArchiveTrashOpen] = useState(false);
	const [archiveTrashTab, setArchiveTrashTab] = useState("archive");
	const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
	const [filteredPosts, setFilteredPosts] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const mobileMenuRef = useRef(null);
	const navigate = useNavigate();
	const { userId: profileUserId } = useParams(); // Get userId from URL params

	// Extract current user ID from cookies first
	let currentUserId = "";
	const encrypted = Cookies.get(COOKIE_KEY);
	if (encrypted) {
		try {
			const bytes = CryptoJS.AES.decrypt(encrypted, COOKIE_SECRET_KEY);
			const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
			currentUserId = user?.user_id || "";
		} catch {}
	}

	// Determine if we're viewing a profile or the main feed
	const isProfileView = !!profileUserId;

	// Get the target user ID for profile view or current user for main feed
	const targetUserId = isProfileView ? profileUserId : currentUserId;

	// Keep userId for backward compatibility with existing code
	const userId = currentUserId;

	useEffect(() => {
		// Always fetch current user's profile for AvatarDropdown
		if (currentUserId) {
			getProfile(currentUserId)
				.then((profileData) => {
					setCurrentUserProfile(profileData);
				})
				.catch((error) => {
					console.error("Error fetching current user profile:", error);
					setCurrentUserProfile(null);
				});
		}
	}, [currentUserId]);

	useEffect(() => {
		if (targetUserId) {
			// console.log("Fetching profile for userId:", targetUserId);
			getProfile(targetUserId)
				.then((profileData) => {
					// console.log("Profile data received:", profileData);
					setProfile(profileData);
				})
				.catch((error) => {
					console.error("Error fetching profile:", error);
					setProfile(null);
				});
		} else {
			console.log("No userId found");
		}
	}, [targetUserId]);

	// Fetch posts from database with user reactions
	const fetchPosts = () => {
		if (targetUserId) {
			getPostsWithUserReactions(targetUserId)
				.then((postsData) => {
					// console.log("Posts data received:", postsData);
					setPosts(postsData);
					setFilteredPosts(postsData);
				})
				.catch((error) => {
					console.error("Error fetching posts:", error);
					setPosts([]);
					setFilteredPosts([]);
				});
		} else {
			// Fallback to regular getPosts if no userId
			getPosts()
				.then((postsData) => {
					console.log("Posts data received:", postsData);
					setPosts(postsData);
					setFilteredPosts(postsData);
				})
				.catch((error) => {
					console.error("Error fetching posts:", error);
					setPosts([]);
					setFilteredPosts([]);
				});
		}
	};

	// Handle search functionality
	const handleSearch = (query) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setFilteredPosts(posts);
			return;
		}

		const filtered = posts.filter((post) => {
			const searchLower = query.toLowerCase();

			// Search in regular posts
			if (post.post_type !== "shared") {
				// Search in user names
				const userName = `${post.user_name || ""}`.toLowerCase();
				if (userName.includes(searchLower)) return true;

				// Search in post caption
				if (
					post.post_caption &&
					post.post_caption.toLowerCase().includes(searchLower)
				)
					return true;
			}

			// Search in shared posts
			if (post.post_type === "shared" || post.postS_id) {
				// Search in sharer names
				const sharerName = `${post.user_name || ""}`.toLowerCase();
				if (sharerName.includes(searchLower)) return true;

				// Search in shared post caption
				if (
					post.postS_caption &&
					post.postS_caption.toLowerCase().includes(searchLower)
				)
					return true;

				// Search in original post caption
				if (
					post.original_caption &&
					post.original_caption.toLowerCase().includes(searchLower)
				)
					return true;

				// Search in original author names
				const originalAuthorName = `${post.original_firstname || ""} ${
					post.original_lastname || ""
				}`.toLowerCase();
				if (originalAuthorName.includes(searchLower)) return true;
			}

			return false;
		});

		setFilteredPosts(filtered);
	};

	useEffect(() => {
		fetchPosts();
		fetchPendingPostsCount();
	}, [userId]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setMobileMenuOpen(false);
			}
		}
		if (mobileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [mobileMenuOpen]);

	const handleLogout = () => {
		// Clear all cookies
		Object.keys(
			document.cookie.split(";").reduce((acc, cookie) => {
				const eqPos = cookie.indexOf("=");
				const name =
					eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				if (name) acc[name] = true;
				return acc;
			}, {})
		).forEach((name) => {
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		});
		navigate("/");
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);

		try {
			// Refresh posts and pending posts count concurrently
			await Promise.all([
				new Promise((resolve) => {
					fetchPosts();
					// Small delay to ensure fetchPosts completes
					setTimeout(resolve, 100);
				}),
				fetchPendingPostsCount(),
			]);

			// Refresh profile data if userId exists
			if (userId) {
				await getProfile(userId)
					.then((profileData) => {
						setProfile(profileData);
					})
					.catch((error) => {
						console.error("Error fetching profile:", error);
						setProfile(null);
					});
			}
		} finally {
			// Small delay to show the animation briefly even if operations complete quickly
			setTimeout(() => {
				setIsRefreshing(false);
			}, 500);
		}
	};

	const handleAttendanceClick = () => {
		setQrModalOpen(true);
		setMobileMenuOpen(false); // Close mobile menu if open
	};

	const handleTallyClick = () => {
		setTallyModalOpen(true);
		setMobileMenuOpen(false); // Close mobile menu if open
	};

	// Fetch pending posts count
	const fetchPendingPostsCount = async () => {
		if (!userId) return;

		try {
			const response = await getPendingPosts(userId);
			if (response.success) {
				setPendingPostsCount(response.posts.length);
			} else {
				setPendingPostsCount(0);
			}
		} catch (error) {
			console.error("Error fetching pending posts count:", error);
			setPendingPostsCount(0);
		}
	};

	const handlePendingPostClick = () => {
		setPendingPostModalOpen(true);
		setMobileMenuOpen(false); // Close mobile menu if open
	};

	const handleEvaluationClick = () => {
		setEvaluationModalOpen(true);
		setMobileMenuOpen(false); // Close mobile menu if open
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-200 dark:bg-[#121212]">
			{/* Top Bar with Avatar and Mobile Menu */}
			<div className="flex sticky z-40 top-0 items-center px-4 py-2 w-full bg-gray-200 dark:bg-[#121212] md:px-8">
				{/* Left side - Menu button and Logo */}
				<div className="flex items-center gap-3">
					{/* Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(true)}
						className="rounded-lg transition-colors duration-200 md:hidden"
					>
						<Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
					</button>

					{/* Logo - Mobile */}
					<div
						className="flex items-center cursor-pointer md:hidden"
						onClick={handleRefresh}
					>
						<img
							src="https://coc-studentinfo.net/images/cocLogo.png"
							alt="CITE Logo"
							className="w-auto h-10"
						/>
					</div>

					{/* Logo - Desktop */}
					<div
						className="hidden items-center md:flex cursor-pointer"
						onClick={() => navigate("/StudentDashboard")}
					>
						<img
							src="https://coc-studentinfo.net/images/cocLogo.png"
							alt="CITE Logo"
							className="w-auto h-16"
						/>
					</div>
				</div>

				{/* Search Bar - Desktop, right next to logo */}
				<div className="hidden md:flex">
					<SearchBar
						onSearch={handleSearch}
						placeholder="Search posts, people..."
					/>
				</div>

				{/* Spacer to push right side elements */}
				<div className="flex-1"></div>

				{/* Right side - Refresh button and Avatar */}
				<div className="flex gap-3 items-center">
					{/* Refresh Button */}
					<RefreshButton
						onRefresh={handleRefresh}
						isRefreshing={isRefreshing}
					/>

					{/* Avatar Dropdown */}
					<AvatarDropdown
						profile={currentUserProfile}
						onLogout={handleLogout}
						userRole="Student"
						userId={userId}
						onProfileUpdate={handleRefresh}
					/>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			<div
				className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 md:hidden ${
					mobileMenuOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
				}`}
			>
				<div
					className={`fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
						mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
					}`}
					ref={mobileMenuRef}
				>
					<div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
						<h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">
							Menu
						</h2>
						<button
							onClick={() => setMobileMenuOpen(false)}
							className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<svg
								className="w-6 h-6 text-gray-600 dark:text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
					<div className="p-4 space-y-3">
						<button
							onClick={handleAttendanceClick}
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300"
						>
							<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
								<svg
									className="w-4 h-4 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
							</div>
							<span className="font-medium">Attendance</span>
						</button>
						<button
							onClick={handleTallyClick}
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
						>
							<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
								<svg
									className="w-4 h-4 text-blue-600 dark:text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<span className="font-medium">Tally</span>
						</button>
						<button
							onClick={handlePendingPostClick}
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300"
						>
							<div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
								<svg
									className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div className="flex items-center justify-between flex-1">
								<span className="font-medium">Pending Post</span>
								{pendingPostsCount > 0 && (
									<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
										{pendingPostsCount}
									</span>
								)}
							</div>
						</button>
						<button
							onClick={handleEvaluationClick}
							className="flex gap-3 items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-xl transition-all duration-200 dark:text-gray-300 dark:bg-gray-700/50 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 group"
						>
							<div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
								<svg
									className="w-4 h-4 text-purple-600 dark:text-purple-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<span className="font-medium">Evaluation</span>
						</button>
					</div>
				</div>
			</div>

			<div className="flex flex-1 gap-6 px-2 py-4 mx-auto w-full max-w-7xl">
				{/* Left Sidebar */}
				<aside className="hidden flex-col p-6 mt-4 w-64 bg-gray-50 rounded-2xl shadow-sm lg:flex dark:bg-[#282828] sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
					<div className="mb-6">
						<h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
							Quick Actions
						</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Manage your activities
						</p>
					</div>
					<div className="space-y-1">
						<button
							onClick={handleAttendanceClick}
							className="flex gap-3 items-center py-3 w-full text-left text-gray-700 rounded-xl transition-all duration-200 dark:text-gray-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300 group"
						>
							<div className="p-2 bg-green-100 rounded-lg transition-colors duration-200 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
								<svg
									className="w-4 h-4 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
							</div>
							<div>
								<div className="font-medium">Attendance</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Check in to IT days
								</div>
							</div>
						</button>
						<button
							onClick={handleTallyClick}
							className="flex gap-3 items-center py-3 w-full text-left text-gray-700 rounded-xl transition-all duration-200 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 group"
						>
							<div className="p-2 bg-blue-100 rounded-lg transition-colors duration-200 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
								<svg
									className="w-4 h-4 text-blue-600 dark:text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<div>
								<div className="font-medium">Tally</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									View your progress
								</div>
							</div>
						</button>
						<button
							onClick={handlePendingPostClick}
							className="flex gap-3 items-center py-3 w-full text-left text-gray-700 rounded-xl transition-all duration-200 dark:text-gray-300 hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300 group relative"
						>
							<div className="p-2 bg-yellow-100 rounded-lg transition-colors duration-200 dark:bg-yellow-900/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50">
								<svg
									className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="font-medium">Pending Post</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									View your pending posts
								</div>
							</div>
							{pendingPostsCount > 0 && (
								<span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
									{pendingPostsCount}
								</span>
							)}
						</button>
						<button
							onClick={handleEvaluationClick}
							className="flex gap-3 items-center py-3 w-full text-left text-gray-700 rounded-xl transition-all duration-200 dark:text-gray-300 hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300 group relative"
						>
							<div className="p-2 bg-purple-100 rounded-lg transition-colors duration-200 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50">
								<svg
									className="w-4 h-4 text-purple-600 dark:text-purple-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div>
								<div className="font-medium">Evaluation</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Answer evaluation questions
								</div>
							</div>
						</button>
					</div>
				</aside>

				{/* Main Feed */}
				<div className="flex flex-col flex-1 gap-4 lg:gap-6">
					{/* Mobile Search Bar - Above Post Creation for better mobile UX */}
					<div className="md:hidden">
						<div className="relative">
							<SearchBar
								onSearch={handleSearch}
								placeholder="Search posts, people..."
							/>
						</div>
					</div>

					{/* Profile Header or Post Creation */}
					<div className="mx-auto max-w-2xl w-full">
						{isProfileView ? (
							/* Profile Header - Show when viewing a profile */
							<div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-[#282828] dark:border-gray-700">
								<div className="flex items-center mb-4">
									<button
										onClick={() => navigate("/StudentDashboard")}
										className="flex items-center mr-2 p-1.5 sm:p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
										title="Back to main feed"
									>
										<svg
											className="w-4 h-4 sm:w-5 sm:h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
									</button>
									<div className="flex items-center flex-1 min-w-0 overflow-hidden">
										{profile?.user_avatar ? (
											<img
												src={profile.user_avatar}
												alt={`${profile.user_name}`}
												className="mr-2 sm:mr-3 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full border-2 sm:border-4 border-gray-200 dark:border-gray-600 flex-shrink-0"
											/>
										) : (
											<div className="flex justify-center items-center mr-2 sm:mr-3 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gray-300 rounded-full dark:bg-gray-600 flex-shrink-0">
												<span className="text-sm sm:text-lg md:text-2xl font-semibold text-gray-700 dark:text-gray-200">
													{profile?.user_name?.[0] || ""}
												</span>
											</div>
										)}
										<div className="min-w-0 flex-1 overflow-hidden">
											<h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
												{profile?.user_name}
											</h1>
											{profile?.user_email && (
												<p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 truncate mt-0.5">
													{profile.user_email}
												</p>
											)}
										</div>
									</div>
									{/* 3-dots trigger opens modal directly (owner only) */}
									{targetUserId?.toString() === userId?.toString() && (
										<div className="ml-2 flex-shrink-0">
											<button
												onClick={() => {
													setArchiveTrashTab("archive");
													setArchiveTrashOpen(true);
												}}
												className="p-1.5 sm:p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
												title="Archive/Trash"
											>
												<svg
													className="w-4 h-4 sm:w-5 sm:h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
													/>
												</svg>
											</button>
										</div>
									)}
								</div>
							</div>
						) : (
							/* Post Creation - Show when viewing main feed */
							<PostCreation
								userId={userId}
								onPostCreated={() => {
									fetchPosts();
									fetchPendingPostsCount(); // Refresh pending count when new post is created
								}}
								profile={profile}
							/>
						)}
					</div>

					{/* Right Sidebar - Mobile only, below Post Creation */}
					<div className="lg:hidden">
						<RightSidebar posts={filteredPosts} userId={userId} />
					</div>

					{/* Main Feed */}
					<main className="mx-auto max-w-2xl w-full">
						<Feed
							posts={filteredPosts}
							userId={userId}
							onReactionUpdate={fetchPosts}
							profileUserId={profileUserId}
							isProfileView={isProfileView}
						/>
					</main>
				</div>

				{/* Right Sidebar - Desktop only */}
				<div className="hidden lg:block">
					<RightSidebar posts={filteredPosts} userId={userId} />
				</div>
			</div>

			{/* QR Code Modal */}
			<QRCodeModal
				isOpen={qrModalOpen}
				onClose={() => setQrModalOpen(false)}
				userId={userId}
				userProfile={profile}
			/>

			{/* Tally Modal */}
			<StudentTallyModal
				isOpen={tallyModalOpen}
				onClose={() => setTallyModalOpen(false)}
				studentId={userId}
				studentProfile={profile}
			/>

			{/* Archive/Trash Drawer */}
			<ArchiveTrashModal
				isOpen={archiveTrashOpen}
				onClose={() => setArchiveTrashOpen(false)}
				userId={userId}
				initialTab={archiveTrashTab}
				onRestored={fetchPosts}
			/>

			{/* Pending Post Modal */}
			<PendingPostModal
				isOpen={pendingPostModalOpen}
				onClose={() => {
					setPendingPostModalOpen(false);
					fetchPendingPostsCount(); // Refresh count when modal closes
				}}
				userId={userId}
			/>

			{/* Student Evaluation Modal */}
			<StudentEvaluationModal
				isOpen={evaluationModalOpen}
				onClose={() => setEvaluationModalOpen(false)}
				studentId={userId}
			/>
		</div>
	);
}
