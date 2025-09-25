import React, { useState, useRef, useEffect } from "react";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import {
	addSharedPostReaction,
	updatePost,
	updatePostStatus,
} from "../utils/faculty";
import { getSharedPostComments, formatTimeAgo } from "../utils/student";
import { MessageCircle, Share2 } from "lucide-react";
import SharedPostModal from "./SharedPostModal";
import PostActionsMenu from "./ui/PostActionsMenu";
import ReactionDetailsModal from "./ReactionDetailsModal";
import ShareDetailsModal from "./ShareDetailsModal";
import { useNavigate } from "react-router-dom";

export default function SharedPost({
	sharedPost,
	onReactionUpdate,
	userId,
	onImageClick,
}) {
	const [reactionStates, setReactionStates] = useState({});
	const [hoveredPostId, setHoveredPostId] = useState(null);
	const [showReactions, setShowReactions] = useState(null);
	const [showMobileReactions, setShowMobileReactions] = useState(null);
	const [postComments, setPostComments] = useState([]);
	const [selectedPost, setSelectedPost] = useState(null);
	const [showReactionDetails, setShowReactionDetails] = useState(null);
	const [showShareDetails, setShowShareDetails] = useState(null);
	const [modalPostId, setModalPostId] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [shareModalPostId, setShareModalPostId] = useState(null);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [showDropdown, setShowDropdown] = useState(null);
	const [editingPost, setEditingPost] = useState(null);
	const [editCaption, setEditCaption] = useState("");
	const hoverTimeoutRef = useRef(null);
	const reactionPopupRef = useRef(null);
	const reactionDetailsRef = useRef(null);
	const shareDetailsRef = useRef(null);
	const longPressTimeoutRef = useRef(null);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	// Get the correct ID for this shared post
	const postId = sharedPost.postS_id || sharedPost.post_id;

	// Initialize reaction state for this shared post
	useEffect(() => {
		if (sharedPost.user_reaction) {
			setReactionStates((prev) => ({
				...prev,
				[postId]: sharedPost.user_reaction,
			}));
		}
	}, [postId, sharedPost.user_reaction]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}
			if (longPressTimeoutRef.current) {
				clearTimeout(longPressTimeoutRef.current);
			}
		};
	}, []);

	// Handle backdrop clicks to close mobile reactions
	useEffect(() => {
		const handleBackdropClick = (e) => {
			if (showMobileReactions && !e.target.closest(".reaction-popup")) {
				setShowMobileReactions(null);
			}
		};

		if (showMobileReactions) {
			document.addEventListener("click", handleBackdropClick);
			return () => document.removeEventListener("click", handleBackdropClick);
		}
	}, [showMobileReactions]);

	// Fetch comments for shared post
	const fetchSharedPostComments = async () => {
		if (!postId) return;

		try {
			const result = await getSharedPostComments(postId);
			if (result.success) {
				setPostComments(result.comments);
			}
		} catch (error) {
			console.error("Error fetching shared post comments:", error);
		}
	};

	// Fetch comments when component mounts or postId changes
	useEffect(() => {
		if (postId) {
			fetchSharedPostComments();
		}
	}, [postId]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(null);
			}
		};

		if (showDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showDropdown]);

	// Handle viewing all comments - opens ImageModal
	const handleViewAllComments = (post) => {
		setSelectedPost(post);
	};

	// Close image modal
	const closeImageModal = () => {
		setSelectedPost(null);
	};

	// Handle comment added callback for shared post comments
	const handleSharedPostCommentAdded = (postId) => {
		// Refresh shared post comments
		fetchSharedPostComments();
		// Also refresh the shared post data to reflect any changes (like comment counts)
		if (onReactionUpdate) {
			onReactionUpdate();
		}
	};

	// Handle reaction count hover
	const handleReactionCountHover = async (postId) => {
		setShowReactionDetails(postId);
	};

	// Handle reaction count leave
	const handleReactionCountLeave = () => {
		setShowReactionDetails(null);
	};

	// Handle reaction count click
	const handleReactionCountClick = (postId) => {
		setModalPostId(postId);
		setIsModalOpen(true);
	};

	// Handle modal close
	const handleModalClose = () => {
		setIsModalOpen(false);
		setModalPostId(null);
	};

	// Handle share count hover
	const handleShareCountHover = async (postId) => {
		setShowShareDetails(postId);
	};

	// Handle share count leave
	const handleShareCountLeave = () => {
		setShowShareDetails(null);
	};

	// Handle share count click
	const handleShareCountClick = (postId) => {
		setShareModalPostId(postId);
		setIsShareModalOpen(true);
	};

	// Handle share modal close
	const handleShareModalClose = () => {
		setIsShareModalOpen(false);
		setShareModalPostId(null);
	};

	// Handle dropdown menu
	const handleDropdownToggle = (postId) => {
		setShowDropdown(showDropdown === postId ? null : postId);
	};

	// Handle edit post with proper event handling
	const handleEditPostClick = (post, event) => {
		event.preventDefault();
		event.stopPropagation();
		// Set edit state first
		setEditingPost(post.postS_id);
		setEditCaption(post.postS_caption || "");

		// Close dropdown after a small delay to ensure state is set
		setTimeout(() => {
			setShowDropdown(null);
		}, 50);
	};

	// Handle save edit
	const handleSaveEdit = async (postId) => {
		try {
			const result = await updatePost(userId, postId, editCaption, "shared");
			if (result.success) {
				// Update the local post data - you might need to call onReactionUpdate to refresh
				setEditingPost(null);
				setEditCaption("");
				// Refresh the feed to show updated caption
				if (onReactionUpdate) {
					onReactionUpdate();
				}
			} else {
				console.error("Failed to update shared post:", result.error);
				alert("Failed to update shared post. Please try again.");
			}
		} catch (error) {
			console.error("Error updating shared post:", error);
			alert("Error updating shared post. Please try again.");
		}
	};

	const handleArchiveSharedPost = async (postSId) => {
		try {
			const result = await updatePostStatus(
				userId,
				postSId,
				"archive",
				"shared"
			);
			if (result.success) {
				if (onReactionUpdate) onReactionUpdate();
			}
		} catch (e) {
			console.error("Failed to archive shared post", e);
		}
	};

	const handleTrashSharedPost = async (postSId) => {
		try {
			const result = await updatePostStatus(userId, postSId, "trash", "shared");
			if (result.success) {
				if (onReactionUpdate) onReactionUpdate();
			}
		} catch (e) {
			console.error("Failed to move shared post to trash", e);
		}
	};

	// Handle cancel edit
	const handleCancelEdit = () => {
		setEditingPost(null);
		setEditCaption("");
	};

	// Check if user can edit the shared post (owner only)
	const canEditSharedPost = (post) => {
		return (
			post.postS_userId && post.postS_userId.toString() === userId?.toString()
		);
	};

	// Handle profile navigation
	const handleProfileClick = (profileUserId, event) => {
		event.preventDefault();
		event.stopPropagation();

		if (!profileUserId) return;

		// Get current path to determine dashboard type
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
			// Default to AdminDashboard if not recognized
			dashboardType = "/AdminDashboard";
		}

		// Navigate to profile page
		navigate(`${dashboardType}/${profileUserId}`);
	};

	// Truncate message for preview
	const truncateMessage = (message, limit = 100) => {
		if (message.length <= limit) return message;
		return message.substring(0, limit) + "...";
	};

	// Render comments preview (same as regular posts)
	const renderComments = () => {
		const comments = postComments || [];
		if (comments.length === 0) return null;

		// Show the newest comment (last in the array)
		const displayComments = comments.slice(-1);
		const hasMoreComments = comments.length > 1;

		return (
			<div className="mt-2 sm:mt-3 space-y-2">
				{displayComments.map((comment) => (
					<div key={comment.commentS_id} className="flex items-start space-x-2">
						<div className="flex justify-center items-center w-6 h-6 sm:w-8 sm:h-8 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full flex-shrink-0">
							{`${comment?.user_name?.charAt(0) || ""}`}
						</div>
						<div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-xl dark:bg-[#3f3f3f] min-w-0">
							<div className="flex justify-between items-start gap-2">
								<span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
									{comment.user_name}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
									{formatTimeAgo(comment.commentS_createdAt)}
								</span>
							</div>
							<p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
								{truncateMessage(comment.commentS_message, 100)}
							</p>
						</div>
					</div>
				))}

				{hasMoreComments && (
					<button
						onClick={() => handleViewAllComments(sharedPost)}
						className="ml-8 sm:ml-10 text-xs sm:text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 touch-manipulation py-1"
					>
						View all {comments.length} comment{comments.length > 1 ? "s" : ""}{" "}
					</button>
				)}
			</div>
		);
	};

	// Ensure we have the required fields for rendering
	const hasRequiredData =
		sharedPost.postS_id && // Must have shared post ID
		sharedPost.user_name;

	if (!hasRequiredData) {
		console.warn("SharedPost missing required user data:", {
			user_name: sharedPost.user_name,
			postS_id: sharedPost.postS_id,
		});
		return null;
	}

	// Validate that we have the required data - must be after all hooks
	if (!sharedPost || (!sharedPost.postS_id && !sharedPost.post_id)) {
		console.error("SharedPost: Missing required data", sharedPost);
		return null;
	}

	const handleReaction = async (postSId, reactionType) => {
		if (!userId) return;

		try {
			const result = await addSharedPostReaction(userId, postSId, reactionType);

			if (result.success) {
				setReactionStates((prev) => ({
					...prev,
					[postSId]: result.action === "removed" ? null : reactionType,
				}));

				setShowReactions(null);
				setShowMobileReactions(null);

				if (onReactionUpdate) {
					onReactionUpdate();
				}
			}
		} catch (error) {
			console.error("Error adding shared post reaction:", error);
		}
	};

	const handleLikeButtonMouseEnter = (postId) => {
		setHoveredPostId(postId);
		// Clear any existing timeout
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
		// Show reactions after a short delay
		hoverTimeoutRef.current = setTimeout(() => {
			setShowReactions(postId);
		}, 200);
	};

	const handleLikeButtonMouseLeave = () => {
		setHoveredPostId(null);
		// Clear any existing timeout
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
		// Hide reactions after a delay to allow moving to popup
		hoverTimeoutRef.current = setTimeout(() => {
			setShowReactions(null);
		}, 300);
	};

	const handleLikeButtonTouchStart = (postId) => {
		// Start long press timer for mobile
		longPressTimeoutRef.current = setTimeout(() => {
			setShowMobileReactions(postId);
		}, 500); // 500ms long press
	};

	const handleLikeButtonTouchEnd = () => {
		// Clear long press timer
		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
		}
	};

	const handleLikeButtonTouchMove = () => {
		// Cancel long press if finger moves
		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
		}
	};

	const handleLikeButtonContextMenu = (e) => {
		// Prevent context menu on long press
		e.preventDefault();
	};

	const handleReactionPopupMouseEnter = () => {
		// Clear timeout when mouse enters popup
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
	};

	const handleReactionPopupMouseLeave = () => {
		// Hide reactions when mouse leaves popup
		setShowReactions(null);
	};

	const getCurrentUserReaction = (postSId) => {
		if (reactionStates[postSId]) {
			return reactionStates[postSId];
		}
		if (sharedPost.user_reaction) {
			return sharedPost.user_reaction;
		}
		return null;
	};

	const getDefaultReactionEmoji = (postSId) => {
		const reaction = getCurrentUserReaction(postSId);
		if (reaction === "like") return "👍";
		if (reaction === "love") return "❤️";
		if (reaction === "haha") return "😂";
		if (reaction === "sad") return "😢";
		if (reaction === "angry") return "😠";
		if (reaction === "wow") return "😮";
		return "👍";
	};

	const getDefaultReactionText = (postSId) => {
		const reaction = getCurrentUserReaction(postSId);
		if (reaction === "like") return "Like";
		if (reaction === "love") return "Love";
		if (reaction === "haha") return "Haha";
		if (reaction === "sad") return "Sad";
		if (reaction === "angry") return "Angry";
		if (reaction === "wow") return "Wow";
		return "Like";
	};

	const getDefaultReactionColor = (postSId) => {
		const reaction = getCurrentUserReaction(postSId);
		if (reaction === "like") return "text-blue-500";
		if (reaction === "love") return "text-red-500";
		if (reaction === "haha") return "text-yellow-500";
		if (reaction === "sad") return "text-blue-400";
		if (reaction === "angry") return "text-red-600";
		if (reaction === "wow") return "text-purple-500";
		return "text-gray-500";
	};

	const getReactionEmoji = (reactionType) => {
		switch (reactionType) {
			case "like":
				return "👍";
			case "love":
				return "❤️";
			case "haha":
				return "😂";
			case "sad":
				return "😢";
			case "angry":
				return "😠";
			case "wow":
				return "😮";
			default:
				return "👍";
		}
	};

	const getTotalReactions = () => {
		const total = parseInt(sharedPost.total_reactions) || 0;
		if (total === 0) return null;

		const currentUserReaction = getCurrentUserReaction(postId);

		const reactions = [];
		if (parseInt(sharedPost.like_count) > 0)
			reactions.push({
				type: "like",
				count: parseInt(sharedPost.like_count),
				emoji: "👍",
			});
		if (parseInt(sharedPost.love_count) > 0)
			reactions.push({
				type: "love",
				count: parseInt(sharedPost.love_count),
				emoji: "❤️",
			});
		if (parseInt(sharedPost.haha_count) > 0)
			reactions.push({
				type: "haha",
				count: parseInt(sharedPost.haha_count),
				emoji: "😂",
			});
		if (parseInt(sharedPost.sad_count) > 0)
			reactions.push({
				type: "sad",
				count: parseInt(sharedPost.sad_count),
				emoji: "😢",
			});
		if (parseInt(sharedPost.angry_count) > 0)
			reactions.push({
				type: "angry",
				count: parseInt(sharedPost.angry_count),
				emoji: "😠",
			});
		if (parseInt(sharedPost.wow_count) > 0)
			reactions.push({
				type: "wow",
				count: parseInt(sharedPost.wow_count),
				emoji: "😮",
			});

		let topReactions = [];

		if (currentUserReaction) {
			const userReaction = reactions.find(
				(r) => r.type === currentUserReaction
			);
			if (userReaction) {
				topReactions.push(userReaction);
			} else {
				topReactions.push({
					type: currentUserReaction,
					count: 1,
					emoji: getReactionEmoji(currentUserReaction),
				});
			}
		}

		const otherReactions = reactions.filter(
			(r) => r.type !== currentUserReaction
		);
		otherReactions.sort((a, b) => b.count - a.count);

		const remainingSlots = 3 - topReactions.length;
		topReactions = topReactions.concat(otherReactions.slice(0, remainingSlots));

		const reactionIcons = topReactions.map((r) => r.emoji).join(" ");

		return {
			text: `${total}`,
			icons: reactionIcons,
		};
	};

	const renderImages = (imageFiles) => {
		if (!imageFiles) return null;

		const images = imageFiles.split(",");
		const imageCount = images.length;
		const uploadTypes = sharedPost.original_image_upload_types
			? sharedPost.original_image_upload_types.split(",")
			: [];

		const toUrl = (img, index) => {
			const trimmed = (img || "").trim();
			const uploadType = uploadTypes[index]
				? uploadTypes[index].trim()
				: "local";

			// Use uploadType from database to determine URL format
			if (uploadType === "google_drive") {
				// Use thumbnail format for all Google Drive images for better compatibility
				return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1000`;
			}

			// Fallback to filename pattern detection for backward compatibility
			// If this looks like a Google Drive fileId (contains underscore and timestamp pattern)
			if (trimmed && trimmed.includes("_") && trimmed.length >= 15) {
				// Use thumbnail format instead of uc format
				return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1000`;
			}
			// If this looks like a Google Drive fileId (no dot extension, 25+ chars typical)
			if (trimmed && trimmed.indexOf(".") === -1 && trimmed.length >= 20) {
				// Use thumbnail format instead of uc format
				return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1000`;
			}
			// Else assume legacy local upload filename
			const url = `${getDecryptedApiUrl()}/uploads/${trimmed}`;
			return url;
		};
		const imageUrls = images.map((img, index) => toUrl(img, index));

		// Create original post object for image modal
		const originalPost = {
			post_id: sharedPost.original_post_id,
			user_name: sharedPost.original_name,
			user_avatar: sharedPost.original_avatar,
			post_caption: sharedPost.original_caption,
			post_createdAt: sharedPost.original_createdAt,
			image_files: sharedPost.original_images,
			post_userId: sharedPost.original_user_id,
			// Add any other fields that might be needed
			total_reactions: "0", // We'll let ImageModal fetch the real data
			like_count: "0",
			love_count: "0",
			haha_count: "0",
			sad_count: "0",
			angry_count: "0",
			wow_count: "0",
		};

		if (imageCount === 1) {
			return (
				<img
					src={imageUrls[0]}
					alt="Post"
					className="object-cover w-full max-h-80 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
					onClick={() =>
						onImageClick &&
						onImageClick(imageUrls[0], imageUrls, 0, originalPost)
					}
					onLoad={() =>
						console.log("SharedPost Image loaded successfully:", imageUrls[0])
					}
					onError={(e) =>
						console.error("SharedPost Image failed to load:", imageUrls[0], e)
					}
				/>
			);
		}

		if (imageCount === 2) {
			return (
				<div className="grid grid-cols-2 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="object-cover w-full h-40 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() =>
								onImageClick &&
								onImageClick(imageUrls[index], imageUrls, index, originalPost)
							}
							onLoad={() =>
								console.log(
									`SharedPost Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`SharedPost Image ${index + 1} failed to load:`,
									imageUrls[index],
									e
								)
							}
						/>
					))}
				</div>
			);
		}

		if (imageCount === 3) {
			return (
				<div className="grid grid-cols-3 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="object-cover w-full h-32 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() =>
								onImageClick &&
								onImageClick(imageUrls[index], imageUrls, index, originalPost)
							}
							onLoad={() =>
								console.log(
									`SharedPost Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`SharedPost Image ${index + 1} failed to load:`,
									imageUrls[index],
									e
								)
							}
						/>
					))}
				</div>
			);
		}

		if (imageCount === 4) {
			return (
				<div className="grid grid-cols-2 gap-2">
					{images.map((image, index) => (
						<img
							key={index}
							src={imageUrls[index]}
							alt={`Post ${index + 1}`}
							className="object-cover w-full h-32 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() =>
								onImageClick &&
								onImageClick(imageUrls[index], imageUrls, index, originalPost)
							}
							onLoad={() =>
								console.log(
									`SharedPost Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`SharedPost Image ${index + 1} failed to load:`,
									imageUrls[index],
									e
								)
							}
						/>
					))}
				</div>
			);
		}

		// 5 or more images - Facebook style layout
		return (
			<div className="grid grid-cols-2 gap-2">
				{/* First 4 images */}
				{images.slice(0, 4).map((image, index) => (
					<img
						key={index}
						src={imageUrls[index]}
						alt={`Post ${index + 1}`}
						className="object-cover w-full h-32 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
						onClick={() =>
							onImageClick &&
							onImageClick(imageUrls[index], imageUrls, index, originalPost)
						}
						onLoad={() =>
							console.log(
								`SharedPost Image ${index + 1} loaded successfully:`,
								imageUrls[index]
							)
						}
						onError={(e) =>
							console.error(
								`SharedPost Image ${index + 1} failed to load:`,
								imageUrls[index],
								e
							)
						}
					/>
				))}
				{/* 5th image with overlay */}
				{imageCount >= 5 && (
					<div className="relative">
						<img
							src={imageUrls[4]}
							alt="Post 5"
							className="object-cover w-full h-32 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() =>
								onImageClick &&
								onImageClick(imageUrls[4], imageUrls, 4, originalPost)
							}
							onLoad={() =>
								console.log(
									`SharedPost Image 5 loaded successfully:`,
									imageUrls[4]
								)
							}
							onError={(e) =>
								console.error(
									`SharedPost Image 5 failed to load:`,
									imageUrls[4],
									e
								)
							}
						/>
						{imageCount > 5 && (
							<div
								className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-lg transition-opacity cursor-pointer hover:bg-opacity-60"
								onClick={() =>
									onImageClick &&
									onImageClick(imageUrls[4], imageUrls, 4, originalPost)
								}
							>
								<span className="text-lg font-bold text-white">
									+{imageCount - 5}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="p-3 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl shadow dark:bg-[#282828]">
			{/* Sharer Info */}
			<div className="flex items-center mb-2 sm:mb-3">
				<div
					className="flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full mr-2 sm:mr-3 cursor-pointer touch-manipulation"
					onClick={(e) => handleProfileClick(sharedPost.postS_userId, e)}
					title={`View ${sharedPost.user_name}'s profile`}
				>
					{`${sharedPost?.user_name?.charAt(0) || ""}`}
				</div>
				<div className="flex-1 min-w-0">
					<span
						className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation block truncate"
						onClick={(e) => handleProfileClick(sharedPost.postS_userId, e)}
						title={`View ${sharedPost.user_name}'s profile`}
					>
						{sharedPost.user_name}
					</span>
					<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
						shared a post •{" "}
						{new Date(
							sharedPost.postS_createdAt ||
								sharedPost.post_createdAt ||
								Date.now()
						).toLocaleString("en-PH", {
							timeZone: "Asia/Manila",
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "numeric",
							minute: "2-digit",
							hour12: true,
						})}
					</div>
				</div>

				{/* 3-dots menu - only show for shared post owner */}
				{(() => {
					const canEdit = canEditSharedPost(sharedPost);
					return (
						canEdit && (
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => handleDropdownToggle(postId)}
									className="p-1.5 sm:p-2 text-gray-500 rounded-full transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
										/>
									</svg>
								</button>

								{/* Dropdown Menu */}
								{showDropdown === postId && (
									<PostActionsMenu
										canEdit={canEdit}
										onEdit={(e) => handleEditPostClick(sharedPost, e)}
										onArchive={() => handleArchiveSharedPost(postId)}
										onTrash={() => handleTrashSharedPost(postId)}
										isOpen={true}
										onClose={() => setShowDropdown(null)}
									/>
								)}
							</div>
						)
					);
				})()}
			</div>

			{/* Sharer's Caption - Editable */}
			{(() => {
				return editingPost === postId ? (
					<div className="mb-2 sm:mb-3">
						<textarea
							value={editCaption}
							onChange={(e) => setEditCaption(e.target.value)}
							className="p-2 sm:p-3 w-full text-sm sm:text-base text-gray-900 rounded-lg border border-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-400"
							rows="3"
							placeholder="What's on your mind?"
							autoFocus
						/>
						<div className="flex justify-end mt-2 space-x-2">
							<button
								onClick={handleCancelEdit}
								className="px-3 sm:px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 touch-manipulation"
							>
								Cancel
							</button>
							<button
								onClick={() => handleSaveEdit(postId)}
								className="px-3 sm:px-4 py-2 text-sm text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 touch-manipulation"
							>
								Save
							</button>
						</div>
					</div>
				) : (
					sharedPost.postS_caption && (
						<p className="mb-2 sm:mb-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
							{sharedPost.postS_caption}
						</p>
					)
				);
			})()}

			{/* Original Post Preview */}
			<div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 dark:bg-transparent dark:border-gray-600">
				{/* Original Post Author */}
				<div className="flex items-center mb-2">
					<div
						className="flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full mr-2 sm:mr-3 cursor-pointer touch-manipulation"
						onClick={(e) => handleProfileClick(sharedPost.original_user_id, e)}
						title={`View ${sharedPost.original_name}'s profile`}
					>
						{`${sharedPost?.original_name?.charAt(0) || ""}`}
					</div>
					<div className="min-w-0 flex-1">
						<span
							className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation block truncate"
							onClick={(e) =>
								handleProfileClick(sharedPost.original_user_id, e)
							}
							title={`View ${sharedPost.original_name}'s profile`}
						>
							{sharedPost.original_name}
						</span>
						<div className="text-xs text-gray-500 dark:text-gray-400">
							{new Date(
								sharedPost.original_createdAt ||
									sharedPost.post_createdAt ||
									Date.now()
							).toLocaleString("en-PH", {
								timeZone: "Asia/Manila",
								year: "numeric",
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
								hour12: true,
							})}
						</div>
					</div>
				</div>

				{/* Original Post Content */}
				{sharedPost.original_caption &&
					sharedPost.original_caption.trim() !== "" && (
						<p className="mb-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
							{sharedPost.original_caption.toString().trim()}
						</p>
					)}

				{/* Original Post Images */}
				{sharedPost.original_images && renderImages(sharedPost.original_images)}
			</div>

			{/* Reaction and Share Counts */}
			{(getTotalReactions() ||
				(sharedPost.share_count && parseInt(sharedPost.share_count) > 0)) && (
				<div className="flex items-center justify-between mt-2 sm:mt-3 mb-2 px-1">
					{/* Reaction Counts */}
					<div className="flex items-start">
						{getTotalReactions() && (
							<div className="relative">
								<div
									className="flex items-center text-sm text-gray-600 transition-colors cursor-pointer dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
									onMouseEnter={() => handleReactionCountHover(postId)}
									onMouseLeave={handleReactionCountLeave}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleReactionCountClick(postId);
									}}
								>
									<span className="mr-2">{getTotalReactions().icons}</span>
									<span>{getTotalReactions().text}</span>
								</div>

								{/* Desktop Hover Modal for Reactions */}
								{showReactionDetails === postId && (
									<div
										ref={reactionDetailsRef}
										onMouseEnter={() => setShowReactionDetails(postId)}
										onMouseLeave={() => setShowReactionDetails(null)}
										className="hidden absolute left-0 bottom-full z-20 p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 shadow-lg md:block dark:bg-gray-800 dark:border-gray-600 min-w-64"
									>
										<ReactionDetailsModal
											postId={postId}
											isOpen={true}
											postType="shared"
										/>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Share Count - Always on the right */}
					<div className="flex items-end">
						{sharedPost.share_count && parseInt(sharedPost.share_count) > 0 && (
							<div className="relative">
								<div
									className="flex items-center text-sm text-gray-600 transition-colors cursor-pointer dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
									onMouseEnter={() => handleShareCountHover(postId)}
									onMouseLeave={handleShareCountLeave}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleShareCountClick(postId);
									}}
								>
									<svg
										className="mr-2 w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
										/>
									</svg>
									<span>
										{sharedPost.share_count} share
										{parseInt(sharedPost.share_count) !== 1 ? "s" : ""}
									</span>
								</div>

								{/* Desktop Hover Modal for Share Details */}
								{showShareDetails === postId && (
									<div
										ref={shareDetailsRef}
										onMouseEnter={() => setShowShareDetails(postId)}
										onMouseLeave={() => setShowShareDetails(null)}
										className="hidden absolute right-0 bottom-full z-20 p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 shadow-lg md:block dark:bg-gray-800 dark:border-gray-600 min-w-64"
									>
										<ShareDetailsModal
											postId={postId}
											isOpen={true}
											postType="shared"
										/>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 gap-1 sm:gap-0">
				{/* Like Button with Hover Reactions */}
				<div className="relative group">
					<button
						onClick={() =>
							handleReaction(postId, getCurrentUserReaction(postId) || "like")
						}
						onMouseEnter={() => handleLikeButtonMouseEnter(postId)}
						onMouseLeave={handleLikeButtonMouseLeave}
						onTouchStart={() => handleLikeButtonTouchStart(postId)}
						onTouchEnd={handleLikeButtonTouchEnd}
						onTouchMove={handleLikeButtonTouchMove}
						onContextMenu={handleLikeButtonContextMenu}
						className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors select-none touch-manipulation min-h-[44px] ${
							getCurrentUserReaction(postId)
								? `bg-gray-100 ${getDefaultReactionColor(
										postId
								  )} dark:bg-gray-700`
								: "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
						}`}
					>
						<span className="mr-1 sm:mr-2 text-base sm:text-lg">
							{getDefaultReactionEmoji(postId)}
						</span>
						<span className="text-xs sm:text-sm font-medium">
							{getDefaultReactionText(postId)}
						</span>
					</button>

					{/* Hover Reaction Options */}
					{showReactions === postId && (
						<div
							ref={reactionPopupRef}
							onMouseEnter={handleReactionPopupMouseEnter}
							onMouseLeave={handleReactionPopupMouseLeave}
							className="flex absolute left-0 bottom-full z-10 items-center p-2 mb-2 bg-gray-50 rounded-full border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-600"
						>
							{/* Like */}
							<button
								onClick={() => {
									handleReaction(postId, "like");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Like"
							>
								<span className="text-2xl">👍</span>
							</button>

							{/* Love */}
							<button
								onClick={() => {
									handleReaction(postId, "love");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Love"
							>
								<span className="text-2xl">❤️</span>
							</button>

							{/* Haha */}
							<button
								onClick={() => {
									handleReaction(postId, "haha");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Haha"
							>
								<span className="text-2xl">😂</span>
							</button>

							{/* Sad */}
							<button
								onClick={() => {
									handleReaction(postId, "sad");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Sad"
							>
								<span className="text-2xl">😢</span>
							</button>

							{/* Angry */}
							<button
								onClick={() => {
									handleReaction(postId, "angry");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Angry"
							>
								<span className="text-2xl">😠</span>
							</button>

							{/* Wow */}
							<button
								onClick={() => {
									handleReaction(postId, "wow");
									setShowReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Wow"
							>
								<span className="text-2xl">😮</span>
							</button>
						</div>
					)}

					{/* Mobile Long Press Reactions */}
					{showMobileReactions === postId && (
						<div
							ref={reactionPopupRef}
							onMouseEnter={handleReactionPopupMouseEnter}
							onMouseLeave={handleReactionPopupMouseLeave}
							className="flex absolute left-0 bottom-full z-10 items-center p-2 mb-2 bg-gray-50 rounded-full border border-gray-200 shadow-lg reaction-popup dark:bg-gray-800 dark:border-gray-600"
						>
							{/* Like */}
							<button
								onClick={() => {
									handleReaction(postId, "like");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Like"
							>
								<span className="text-2xl">👍</span>
							</button>

							{/* Love */}
							<button
								onClick={() => {
									handleReaction(postId, "love");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Love"
							>
								<span className="text-2xl">❤️</span>
							</button>

							{/* Haha */}
							<button
								onClick={() => {
									handleReaction(postId, "haha");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Haha"
							>
								<span className="text-2xl">😂</span>
							</button>

							{/* Sad */}
							<button
								onClick={() => {
									handleReaction(postId, "sad");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Sad"
							>
								<span className="text-2xl">😢</span>
							</button>

							{/* Angry */}
							<button
								onClick={() => {
									handleReaction(postId, "angry");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Angry"
							>
								<span className="text-2xl">😠</span>
							</button>

							{/* Wow */}
							<button
								onClick={() => {
									handleReaction(postId, "wow");
									setShowMobileReactions(null);
								}}
								className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								title="Wow"
							>
								<span className="text-2xl">😮</span>
							</button>
						</div>
					)}
				</div>

				{/* Comment Button */}
				<button
					onClick={() => handleViewAllComments(sharedPost)}
					className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 rounded-lg transition-colors hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 touch-manipulation min-h-[44px]"
				>
					<MessageCircle className="mr-1 sm:mr-2 w-4 sm:w-5 h-4 sm:h-5" />
					<span className="text-xs sm:text-sm font-medium">
						Comment {postComments.length > 0 && `(${postComments.length})`}
					</span>
				</button>

				{/* Share Button */}
				<button
					className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 rounded-lg cursor-not-allowed opacity-50 min-h-[44px]"
					disabled
				>
					<Share2 className="mr-1 sm:mr-2 w-4 sm:w-5 h-4 sm:h-5" />
					<span className="text-xs sm:text-sm font-medium">Share</span>
				</button>
			</div>

			{/* Comments Section */}
			{renderComments()}

			{/* Approver Information */}
			{sharedPost.approver_name && (
				<div className="flex justify-end mt-2 px-1">
					<span className="text-xs text-gray-400 dark:text-gray-500 italic">
						Approved by {sharedPost.approver_name}
					</span>
				</div>
			)}

			{/* Shared Post Modal for comments */}
			{selectedPost && (
				<SharedPostModal
					selectedPost={selectedPost}
					onClose={closeImageModal}
					userId={userId}
					onCommentAdded={handleSharedPostCommentAdded}
				/>
			)}

			{/* Reaction Details Modal */}
			{isModalOpen && modalPostId && (
				<ReactionDetailsModal
					postId={modalPostId}
					isOpen={isModalOpen}
					onClose={handleModalClose}
					postType="shared"
				/>
			)}

			{/* Share Details Modal */}
			{isShareModalOpen && shareModalPostId && (
				<ShareDetailsModal
					postId={shareModalPostId}
					isOpen={isShareModalOpen}
					onClose={handleShareModalClose}
					postType="shared"
				/>
			)}
		</div>
	);
}
