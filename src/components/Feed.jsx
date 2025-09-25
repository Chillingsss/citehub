import React, { useState, useRef, useEffect } from "react";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import { addReaction, updatePost, updatePostStatus } from "../utils/faculty";
import { getComments, formatTimeAgo } from "../utils/student";
import ReactionDetailsModal from "./ReactionDetailsModal";
import ShareDetailsModal from "./ShareDetailsModal";
import ImageModal from "./ImageModal";
import SharePostModal from "./SharePostModal";
import SharedPost from "./SharedPost";
import PostActionsMenu from "./ui/PostActionsMenu";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Share2 } from "lucide-react";

export default function Feed({
	posts,
	userId,
	onReactionUpdate,
	profileUserId = null,
}) {
	const [selectedImage, setSelectedImage] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImageSet, setCurrentImageSet] = useState([]);
	const [selectedPost, setSelectedPost] = useState(null);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [reactionStates, setReactionStates] = useState({});
	const [hoveredPostId, setHoveredPostId] = useState(null);
	const [showReactions, setShowReactions] = useState(null);
	const [showReactionDetails, setShowReactionDetails] = useState(null);
	const [showShareDetails, setShowShareDetails] = useState(null);
	const [modalPostId, setModalPostId] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [shareModalPostId, setShareModalPostId] = useState(null);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [showMobileReactions, setShowMobileReactions] = useState(null);
	const [postComments, setPostComments] = useState({});
	const [showDropdown, setShowDropdown] = useState(null);
	const [editingPost, setEditingPost] = useState(null);
	const [editCaption, setEditCaption] = useState("");
	const [localPosts, setLocalPosts] = useState(posts || []);
	const [showShareModal, setShowShareModal] = useState(false);
	const [selectedPostForShare, setSelectedPostForShare] = useState(null);
	const hoverTimeoutRef = useRef(null);
	const reactionPopupRef = useRef(null);
	const reactionDetailsRef = useRef(null);
	const shareDetailsRef = useRef(null);
	const longPressTimeoutRef = useRef(null);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	// Determine if we're viewing a profile
	const isProfileView = !!profileUserId;

	// Update localPosts when posts prop changes
	useEffect(() => {
		if (isProfileView && profileUserId) {
			// Filter posts to show only the profile user's posts
			const filteredPosts =
				posts?.filter((post) => {
					if (post.post_type === "shared") {
						// For shared posts, check if the sharer is the profile user
						return post.postS_userId === profileUserId;
					} else {
						// For regular posts, check if the post creator is the profile user
						return post.post_userId === profileUserId;
					}
				}) || [];
			setLocalPosts(filteredPosts);
		} else {
			// Show all posts for main feed
			setLocalPosts(posts || []);
		}
	}, [posts, isProfileView, profileUserId]);

	const handleImageClick = (
		imageUrl,
		imageSet = null,
		imageIndex = 0,
		post = null
	) => {
		if (imageSet) {
			setCurrentImageSet(imageSet);
			setCurrentImageIndex(imageIndex);
		}
		setSelectedImage(imageUrl);
		setSelectedPost(post);
		setZoomLevel(1); // Reset zoom when opening new image
	};

	const closeImageModal = () => {
		setSelectedImage(null);
		setCurrentImageIndex(0);
		setCurrentImageSet([]);
		setSelectedPost(null);
		setZoomLevel(1); // Reset zoom when closing
	};

	const nextImage = () => {
		if (currentImageSet.length > 0) {
			const nextIndex = (currentImageIndex + 1) % currentImageSet.length;
			setCurrentImageIndex(nextIndex);
			setSelectedImage(currentImageSet[nextIndex]);
			setZoomLevel(1); // Reset zoom when changing images
		}
	};

	const prevImage = () => {
		if (currentImageSet.length > 0) {
			const prevIndex =
				currentImageIndex === 0
					? currentImageSet.length - 1
					: currentImageIndex - 1;
			setCurrentImageIndex(prevIndex);
			setSelectedImage(currentImageSet[prevIndex]);
			setZoomLevel(1); // Reset zoom when changing images
		}
	};

	const zoomIn = () => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max zoom 3x
	};

	const zoomOut = () => {
		setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
	};

	const resetZoom = () => {
		setZoomLevel(1);
	};

	const handleReaction = async (postId, reactionType) => {
		if (!userId) return;

		try {
			const result = await addReaction(userId, postId, reactionType);

			if (result.success) {
				const previousReaction =
					reactionStates[postId] ||
					(selectedPost?.post_id === postId
						? selectedPost.user_reaction
						: null);

				setReactionStates((prev) => ({
					...prev,
					[postId]: result.action === "removed" ? null : reactionType,
				}));

				// If modal is open for this post, update selectedPost directly
				if (selectedPost && selectedPost.post_id === postId) {
					setSelectedPost((prev) => {
						const newPost = { ...prev };

						// Update user reaction
						newPost.user_reaction =
							result.action === "removed" ? null : reactionType;

						// Handle reaction count updates
						if (result.action === "removed") {
							// Remove the previous reaction count
							if (previousReaction) {
								const prevKey = `${previousReaction}_count`;
								if (newPost[prevKey] !== undefined) {
									newPost[prevKey] = Math.max(
										0,
										parseInt(newPost[prevKey]) - 1
									);
								}
							}
							newPost.total_reactions = Math.max(
								0,
								parseInt(newPost.total_reactions) - 1
							);
						} else if (result.action === "added") {
							// Add the new reaction count
							const newKey = `${reactionType}_count`;
							if (newPost[newKey] !== undefined) {
								newPost[newKey] = parseInt(newPost[newKey]) + 1;
							}
							newPost.total_reactions = parseInt(newPost.total_reactions) + 1;
						} else if (result.action === "changed") {
							// Remove previous reaction and add new one
							if (previousReaction && previousReaction !== reactionType) {
								const prevKey = `${previousReaction}_count`;
								if (newPost[prevKey] !== undefined) {
									newPost[prevKey] = Math.max(
										0,
										parseInt(newPost[prevKey]) - 1
									);
								}
								// Add new reaction
								const newKey = `${reactionType}_count`;
								if (newPost[newKey] !== undefined) {
									newPost[newKey] = parseInt(newPost[newKey]) + 1;
								}
								// Total reactions stays the same when changing
							}
						}

						return newPost;
					});
				}

				setShowReactions(null);
				setShowMobileReactions(null);

				if (onReactionUpdate) {
					onReactionUpdate();
				}
			}
		} catch (error) {
			console.error("Error adding reaction:", error);
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

	const handleReactionCountHover = async (postId) => {
		setShowReactionDetails(postId);
	};

	const handleReactionCountLeave = () => {
		setShowReactionDetails(null);
	};

	const handleReactionCountClick = (postId) => {
		setModalPostId(postId);
		setIsModalOpen(true);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setModalPostId(null);
	};

	const handleShareCountHover = async (postId) => {
		setShowShareDetails(postId);
	};

	const handleShareCountLeave = () => {
		setShowShareDetails(null);
	};

	const handleShareCountClick = (postId) => {
		setShareModalPostId(postId);
		setIsShareModalOpen(true);
	};

	const handleShareModalClose = () => {
		setIsShareModalOpen(false);
		setShareModalPostId(null);
	};

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

	const getCurrentUserReaction = (post) => {
		if (reactionStates[post.post_id]) {
			return reactionStates[post.post_id];
		}
		if (post.user_reaction) {
			return post.user_reaction;
		}
		return null;
	};

	const getDefaultReactionEmoji = (post) => {
		const reaction = getCurrentUserReaction(post);
		if (reaction === "like") return "👍";
		if (reaction === "love") return "❤️";
		if (reaction === "haha") return "😂";
		if (reaction === "sad") return "😢";
		if (reaction === "angry") return "😠";
		if (reaction === "wow") return "😮";
		return "👍"; // Default emoji
	};

	const getDefaultReactionText = (post) => {
		const reaction = getCurrentUserReaction(post);
		if (reaction === "like") return "Like";
		if (reaction === "love") return "Love";
		if (reaction === "haha") return "Haha";
		if (reaction === "sad") return "Sad";
		if (reaction === "angry") return "Angry";
		if (reaction === "wow") return "Wow";
		return "Like"; // Default text
	};

	const getDefaultReactionColor = (post) => {
		const reaction = getCurrentUserReaction(post);
		if (reaction === "like") return "text-blue-500";
		if (reaction === "love") return "text-red-500";
		if (reaction === "haha") return "text-yellow-500";
		if (reaction === "sad") return "text-blue-400";
		if (reaction === "angry") return "text-red-600";
		if (reaction === "wow") return "text-purple-500";
		return "text-gray-500"; // Default color
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

	const getTotalReactions = (post) => {
		const total = parseInt(post.total_reactions) || 0;
		if (total === 0) return null;

		// Get current user's reaction
		const currentUserReaction = getCurrentUserReaction(post);

		// Get reaction counts and create array of reactions with counts
		const reactions = [];
		if (parseInt(post.like_count) > 0)
			reactions.push({
				type: "like",
				count: parseInt(post.like_count),
				emoji: "👍",
			});
		if (parseInt(post.love_count) > 0)
			reactions.push({
				type: "love",
				count: parseInt(post.love_count),
				emoji: "❤️",
			});
		if (parseInt(post.haha_count) > 0)
			reactions.push({
				type: "haha",
				count: parseInt(post.haha_count),
				emoji: "😂",
			});
		if (parseInt(post.sad_count) > 0)
			reactions.push({
				type: "sad",
				count: parseInt(post.sad_count),
				emoji: "😢",
			});
		if (parseInt(post.angry_count) > 0)
			reactions.push({
				type: "angry",
				count: parseInt(post.angry_count),
				emoji: "😠",
			});
		if (parseInt(post.wow_count) > 0)
			reactions.push({
				type: "wow",
				count: parseInt(post.wow_count),
				emoji: "😮",
			});

		// If user has a reaction, always include it first
		let topReactions = [];

		if (currentUserReaction) {
			// Find the user's reaction
			const userReaction = reactions.find(
				(r) => r.type === currentUserReaction
			);
			if (userReaction) {
				topReactions.push(userReaction);
			} else {
				// If user's reaction isn't in the list (count might be 0), add it manually
				topReactions.push({
					type: currentUserReaction,
					count: 1,
					emoji: getReactionEmoji(currentUserReaction),
				});
			}
		}

		// Add other reactions (excluding user's reaction if already added)
		const otherReactions = reactions.filter(
			(r) => r.type !== currentUserReaction
		);
		otherReactions.sort((a, b) => b.count - a.count);

		// Add up to 2 more reactions to fill the 3 slots
		const remainingSlots = 3 - topReactions.length;
		topReactions = topReactions.concat(otherReactions.slice(0, remainingSlots));

		const reactionIcons = topReactions.map((r) => r.emoji).join(" ");

		return {
			text: `${total}`, // Only return the number, no "reactions" text
			icons: reactionIcons,
		};
	};

	const renderImages = (imageFiles, post) => {
		if (!imageFiles) return null;

		const images = imageFiles.split(",");
		const imageCount = images.length;
		const uploadTypes = post.image_upload_types
			? post.image_upload_types.split(",")
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

		if (imageCount === 1) {
			return (
				<div>
					<img
						src={imageUrls[0]}
						alt="Post"
						className="object-cover w-full max-h-80 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
						onClick={() => handleImageClick(imageUrls[0], imageUrls, 0, post)}
						onLoad={() =>
							console.log("Image loaded successfully:", imageUrls[0])
						}
						onError={(e) =>
							console.error("Image failed to load:", imageUrls[0], e)
						}
					/>
				</div>
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
								handleImageClick(imageUrls[index], imageUrls, index, post)
							}
							onLoad={() =>
								console.log(
									`Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`Image ${index + 1} failed to load:`,
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
								handleImageClick(imageUrls[index], imageUrls, index, post)
							}
							onLoad={() =>
								console.log(
									`Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`Image ${index + 1} failed to load:`,
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
								handleImageClick(imageUrls[index], imageUrls, index, post)
							}
							onLoad={() =>
								console.log(
									`Image ${index + 1} loaded successfully:`,
									imageUrls[index]
								)
							}
							onError={(e) =>
								console.error(
									`Image ${index + 1} failed to load:`,
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
							handleImageClick(imageUrls[index], imageUrls, index, post)
						}
						onLoad={() =>
							console.log(
								`Image ${index + 1} loaded successfully:`,
								imageUrls[index]
							)
						}
						onError={(e) =>
							console.error(
								`Image ${index + 1} failed to load:`,
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
							onClick={() => handleImageClick(imageUrls[4], imageUrls, 4, post)}
							onLoad={() =>
								console.log(`Image 5 loaded successfully:`, imageUrls[4])
							}
							onError={(e) =>
								console.error(`Image 5 failed to load:`, imageUrls[4], e)
							}
						/>
						{imageCount > 5 && (
							<div
								className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-lg transition-opacity cursor-pointer hover:bg-opacity-60"
								onClick={() =>
									handleImageClick(imageUrls[4], imageUrls, 4, post)
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

	// Fetch comments for a specific post
	const fetchPostComments = async (postId, force = false) => {
		if (postComments[postId] && !force) return; // Already fetched and not forcing refresh

		try {
			const result = await getComments(postId);
			if (result.success) {
				setPostComments((prev) => ({
					...prev,
					[postId]: result.comments,
				}));
			}
		} catch (error) {
			console.error("Error fetching post comments:", error);
		}
	};

	// Fetch comments for all posts when component mounts
	useEffect(() => {
		if (posts && posts.length > 0) {
			posts.forEach((post) => {
				fetchPostComments(post.post_id);
			});
		}
	}, [posts]);

	const handleViewAllComments = (post) => {
		setSelectedPost(post);

		// If the post has images, show the first image
		if (post.image_files) {
			const images = post.image_files.split(",");
			const uploadTypes = post.image_upload_types
				? post.image_upload_types.split(",")
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
			setSelectedImage(imageUrls[0]);
			setCurrentImageSet(imageUrls);
			setCurrentImageIndex(0);
		} else {
			setSelectedImage(null);
			setCurrentImageSet([]);
			setCurrentImageIndex(0);
		}

		setZoomLevel(1);
	};

	const truncateMessage = (message, limit = 100) => {
		if (message.length <= limit) return message;
		return message.substring(0, limit) + "...";
	};

	const renderComments = (post) => {
		const comments = postComments[post.post_id] || [];
		if (comments.length === 0) return null;

		// Show the newest comment (last in the array)
		const displayComments = comments.slice(-1);
		const hasMoreComments = comments.length > 1;

		return (
			<div className="mt-2 sm:mt-3 space-y-2">
				{displayComments.map((comment) => (
					<div key={comment.comment_id} className="flex items-start space-x-2">
						<div className="flex justify-center items-center w-6 h-6 sm:w-8 sm:h-8 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full flex-shrink-0">
							{`${comment?.user_name?.charAt(0) || ""}`}
						</div>
						<div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-xl dark:bg-[#3f3f3f] min-w-0">
							<div className="flex justify-between items-start gap-2">
								<span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
									{comment.user_name}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
									{formatTimeAgo(comment.comment_createdAt)}
								</span>
							</div>
							<p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
								{truncateMessage(comment.comment_message, 100)}
							</p>
						</div>
					</div>
				))}

				{hasMoreComments && (
					<button
						onClick={() => handleViewAllComments(post)}
						className="ml-8 sm:ml-10 text-xs sm:text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 touch-manipulation py-1"
					>
						View all {comments.length} comment{comments.length > 1 ? "s" : ""}{" "}
					</button>
				)}
			</div>
		);
	};

	const handleCommentAdded = (postId) => {
		// Refresh comments for the specific post with force=true
		fetchPostComments(postId, true);
		// Also refresh the entire feed data to reflect any changes (like comment counts)
		if (onReactionUpdate) {
			onReactionUpdate();
		}
	};

	// Handle share completed
	const handleShareCompleted = (result) => {
		setShowShareModal(false);
		setSelectedPostForShare(null);

		// Show success toast if share was successful
		if (result && result.success) {
			toast.success("Post shared successfully!", {
				duration: 3000,
			});
		}

		// Optionally refresh the feed
		if (onReactionUpdate) {
			onReactionUpdate();
		}
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
		setEditingPost(post.post_id);
		setEditCaption(post.post_caption);
		// Close dropdown immediately
		setShowDropdown(null);
	};

	// Handle save edit
	const handleSaveEdit = async (postId) => {
		try {
			const result = await updatePost(userId, postId, editCaption);
			if (result.success) {
				// Update the local post data
				setLocalPosts((prevPosts) =>
					prevPosts.map((post) =>
						post.post_id === postId
							? { ...post, post_caption: editCaption }
							: post
					)
				);
				setEditingPost(null);
				setEditCaption("");
			} else {
				console.error("Failed to update post:", result.error);
				alert("Failed to update post. Please try again.");
			}
		} catch (error) {
			console.error("Error updating post:", error);
			alert("Error updating post. Please try again.");
		}
	};

	const handleArchivePost = async (postId, event) => {
		event.preventDefault();
		event.stopPropagation();
		// Close dropdown first
		setShowDropdown(null);

		try {
			const result = await updatePostStatus(
				userId,
				postId,
				"archive",
				"regular"
			);
			if (result.success) {
				if (onReactionUpdate) onReactionUpdate();
			}
		} catch (e) {
			console.error("Failed to archive post", e);
		}
	};

	const handleTrashPost = async (postId, event) => {
		event.preventDefault();
		event.stopPropagation();
		// Close dropdown first
		setShowDropdown(null);

		try {
			const result = await updatePostStatus(userId, postId, "trash", "regular");
			if (result.success) {
				if (onReactionUpdate) onReactionUpdate();
			}
		} catch (e) {
			console.error("Failed to move post to trash", e);
		}
	};

	// Handle cancel edit
	const handleCancelEdit = () => {
		setEditingPost(null);
		setEditCaption("");
	};

	// Check if user can edit the post (owner only)
	const canEditPost = (post) => {
		return (
			post.post_userId && post.post_userId.toString() === userId?.toString()
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

	// Render post based on type (regular or shared)
	const renderPost = (post, key) => {
		// If it's a shared post, render SharedPost component
		if (post.post_type === "shared" || post.postS_id) {
			return (
				<SharedPost
					key={`shared-${post.postS_id || key}`}
					sharedPost={post}
					onReactionUpdate={onReactionUpdate}
					userId={userId}
					onImageClick={handleImageClick}
					onCommentAdded={handleCommentAdded}
					profileUserId={profileUserId}
				/>
			);
		}

		// Otherwise render regular post
		return (
			<div
				key={`regular-${post.post_id || key}`}
				className="p-3 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl shadow dark:bg-[#282828]"
			>
				<div className="flex items-center mb-2 sm:mb-3">
					<div
						className="flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full mr-2 sm:mr-3 cursor-pointer touch-manipulation"
						onClick={(e) => handleProfileClick(post.post_userId, e)}
						title={`View ${post.user_name}'s profile`}
					>
						{`${post?.user_name?.charAt(0) || ""}`}
					</div>
					<div className="flex-1 min-w-0">
						<span
							className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation block truncate"
							onClick={(e) => handleProfileClick(post.post_userId, e)}
							title={`View ${post.user_name}'s profile`}
						>
							{post.user_name}
						</span>
						<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
							{new Date(post.post_createdAt).toLocaleString("en-PH", {
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

					{/* 3-dots menu - only show for post owner */}
					{(() => {
						const canEdit = canEditPost(post);
						return (
							canEdit && (
								<div className="relative" ref={dropdownRef}>
									<button
										onClick={() => handleDropdownToggle(post.post_id)}
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
									{showDropdown === post.post_id && (
										<PostActionsMenu
											canEdit={canEdit}
											onEdit={(e) => handleEditPostClick(post, e)}
											onArchive={(e) => handleArchivePost(post.post_id, e)}
											onTrash={(e) => handleTrashPost(post.post_id, e)}
											isOpen={true}
											onClose={() => setShowDropdown(null)}
										/>
									)}
								</div>
							)
						);
					})()}
				</div>

				{/* Post Caption - Editable */}
				{(() => {
					return editingPost === post.post_id ? (
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
									onClick={() => handleSaveEdit(post.post_id)}
									className="px-3 sm:px-4 py-2 text-sm text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 touch-manipulation"
								>
									Save
								</button>
							</div>
						</div>
					) : (
						<p className="mb-2 sm:mb-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
							{post.post_caption}
						</p>
					);
				})()}

				{post.image_files && renderImages(post.image_files, post)}

				{/* Reaction and Share Counts */}
				{(getTotalReactions(post) || parseInt(post.share_count) > 0) && (
					<div className="flex items-center justify-between mt-2 sm:mt-3 mb-2 px-1">
						{/* Reaction Counts */}
						<div className="flex items-start">
							{getTotalReactions(post) && (
								<div className="relative">
									<div
										className="flex items-center text-sm text-gray-600 transition-colors cursor-pointer dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
										onMouseEnter={() => handleReactionCountHover(post.post_id)}
										onMouseLeave={handleReactionCountLeave}
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleReactionCountClick(post.post_id);
										}}
									>
										<span className="mr-2">
											{getTotalReactions(post).icons}
										</span>
										<span>{getTotalReactions(post).text}</span>
									</div>

									{/* Desktop Hover Modal for Reactions */}
									{showReactionDetails === post.post_id && (
										<div
											ref={reactionDetailsRef}
											onMouseEnter={() => setShowReactionDetails(post.post_id)}
											onMouseLeave={() => setShowReactionDetails(null)}
											className="hidden absolute left-0 bottom-full z-20 p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 shadow-lg md:block dark:bg-gray-800 dark:border-gray-600 min-w-64"
										>
											<ReactionDetailsModal
												postId={post.post_id}
												isOpen={true}
											/>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Share Count - Only show when greater than 0 */}
						{parseInt(post.share_count) > 0 && (
							<div className="flex items-end">
								<div className="relative">
									<div
										className="flex items-center text-sm text-gray-600 transition-colors cursor-pointer dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
										onMouseEnter={() => handleShareCountHover(post.post_id)}
										onMouseLeave={handleShareCountLeave}
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleShareCountClick(post.post_id);
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
											{post.share_count} share
											{parseInt(post.share_count) !== 1 ? "s" : ""}
										</span>
									</div>

									{/* Desktop Hover Modal for Share Details */}
									{showShareDetails === post.post_id && (
										<div
											ref={shareDetailsRef}
											onMouseEnter={() => setShowShareDetails(post.post_id)}
											onMouseLeave={() => setShowShareDetails(null)}
											className="hidden absolute right-0 bottom-full z-20 p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 shadow-lg md:block dark:bg-gray-800 dark:border-gray-600 min-w-64"
										>
											<ShareDetailsModal postId={post.post_id} isOpen={true} />
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Reaction Buttons - Facebook Style */}
				<div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 gap-1 sm:gap-0">
					{/* Like Button with Hover Reactions */}
					<div className="relative group">
						<button
							onClick={() =>
								handleReaction(
									post.post_id,
									getCurrentUserReaction(post) || "like"
								)
							}
							onMouseEnter={() => handleLikeButtonMouseEnter(post.post_id)}
							onMouseLeave={handleLikeButtonMouseLeave}
							onTouchStart={() => handleLikeButtonTouchStart(post.post_id)}
							onTouchEnd={handleLikeButtonTouchEnd}
							onTouchMove={handleLikeButtonTouchMove}
							onContextMenu={handleLikeButtonContextMenu}
							className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors select-none touch-manipulation min-h-[44px] ${
								getCurrentUserReaction(post)
									? `bg-gray-100 ${getDefaultReactionColor(
											post
									  )} dark:bg-gray-700`
									: "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
							}`}
						>
							<span className="mr-1 sm:mr-2 text-base sm:text-lg">
								{getDefaultReactionEmoji(post)}
							</span>
							<span className="text-xs sm:text-sm font-medium">
								{getDefaultReactionText(post)}
							</span>
						</button>

						{/* Hover Reaction Options */}
						{showReactions === post.post_id && (
							<div
								ref={reactionPopupRef}
								onMouseEnter={handleReactionPopupMouseEnter}
								onMouseLeave={handleReactionPopupMouseLeave}
								className="flex absolute left-0 bottom-full items-center p-2 mb-2 bg-gray-50 rounded-full border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-600 z-40"
							>
								{/* Like */}
								<button
									onClick={() => {
										handleReaction(post.post_id, "like");
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
										handleReaction(post.post_id, "love");
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
										handleReaction(post.post_id, "haha");
										setShowReactions(null);
									}}
									className="flex justify-center items-center w-12 h-12 rounded-full transition-colors hover:bg-gray-700"
									title="Haha"
								>
									<span className="text-2xl">😂</span>
								</button>

								{/* Sad */}
								<button
									onClick={() => {
										handleReaction(post.post_id, "sad");
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
										handleReaction(post.post_id, "angry");
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
										handleReaction(post.post_id, "wow");
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
						{showMobileReactions === post.post_id && (
							<div
								ref={reactionPopupRef}
								onMouseEnter={handleReactionPopupMouseEnter}
								onMouseLeave={handleReactionPopupMouseLeave}
								className="flex absolute left-0 bottom-full z-40 items-center p-2 mb-2 bg-gray-50 rounded-full border border-gray-200 shadow-lg reaction-popup dark:bg-gray-800 dark:border-gray-600"
							>
								{/* Like */}
								<button
									onClick={() => {
										handleReaction(post.post_id, "like");
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
										handleReaction(post.post_id, "love");
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
										handleReaction(post.post_id, "haha");
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
										handleReaction(post.post_id, "sad");
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
										handleReaction(post.post_id, "angry");
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
										handleReaction(post.post_id, "wow");
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
						onClick={() => handleViewAllComments(post)}
						className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 rounded-lg transition-colors hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 touch-manipulation min-h-[44px]"
					>
						<MessageCircle className="mr-1 sm:mr-2 w-4 sm:w-5 h-4 sm:h-5" />
						<span className="text-xs sm:text-sm font-medium">
							Comment{" "}
							{postComments[post.post_id] &&
								postComments[post.post_id].length > 0 &&
								`(${postComments[post.post_id].length})`}
						</span>
					</button>

					{/* Share Button */}
					<button
						onClick={() => {
							setSelectedPostForShare(post);
							setShowShareModal(true);
						}}
						className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 rounded-lg transition-colors hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 touch-manipulation min-h-[44px]"
					>
						<Share2 className="mr-1 sm:mr-2 w-4 sm:w-5 h-4 sm:h-5" />
						<span className="text-xs sm:text-sm font-medium">Share</span>
					</button>
				</div>

				{/* Comments Section */}
				{renderComments(post)}

				{/* Approver Information */}
				{post.approver_name && (
					<div className="flex justify-end mt-2 px-1">
						<span className="text-xs text-gray-400 dark:text-gray-500 italic">
							Approved by {post.approver_name}
						</span>
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<Toaster position="top-right" />
			{/* No Posts Message */}
			{(!localPosts || localPosts.length === 0) && (
				<div className="flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-16 bg-gray-50 rounded-xl sm:rounded-2xl shadow dark:bg-[#282828]">
					<div className="max-w-md text-center">
						{/* Icon */}
						<div className="mb-4 sm:mb-6">
							<svg
								className="mx-auto w-16 sm:w-20 h-16 sm:h-20 text-gray-300 dark:text-gray-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
								/>
							</svg>
						</div>

						{/* Main Message */}
						<h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">
							No Posts Yet
						</h3>

						{/* Show extra encouragement only on main feed, not on profile view */}
						{!isProfileView && (
							<>
								<p className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed text-gray-500 dark:text-gray-400">
									Be the first to share something! Start a conversation, share
									your thoughts, or post an update to connect with your
									community.
								</p>
								<div className="flex flex-col gap-3 justify-center items-center sm:flex-row">
									<div className="flex items-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">
										<span className="mr-2">✨</span>
										<span className="text-center sm:text-left">
											Share your first post and get the conversation started!
										</span>
									</div>
								</div>
								<div className="flex justify-center mt-6 sm:mt-8 space-x-2">
									<div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-200 rounded-full dark:bg-blue-800"></div>
									<div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-300 rounded-full dark:bg-blue-700"></div>
									<div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full dark:bg-blue-600"></div>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* Posts List */}
			{localPosts && localPosts.length > 0 && (
				<div className="flex flex-col gap-4 sm:gap-6">
					{localPosts.map((post, index) => renderPost(post, index))}
				</div>
			)}

			{/* Image Modal */}
			<ImageModal
				selectedImage={selectedImage}
				selectedPost={selectedPost}
				currentImageIndex={currentImageIndex}
				currentImageSet={currentImageSet}
				zoomLevel={zoomLevel}
				onClose={closeImageModal}
				onPrevImage={prevImage}
				onNextImage={nextImage}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onResetZoom={resetZoom}
				userId={userId}
				onCommentAdded={handleCommentAdded}
			/>

			{/* Reaction Details Modal */}
			{isModalOpen && modalPostId && (
				<ReactionDetailsModal
					postId={modalPostId}
					isOpen={isModalOpen}
					onClose={handleModalClose}
				/>
			)}

			{/* Share Details Modal */}
			{isShareModalOpen && shareModalPostId && (
				<ShareDetailsModal
					postId={shareModalPostId}
					isOpen={isShareModalOpen}
					onClose={handleShareModalClose}
				/>
			)}

			{/* Share Post Modal */}
			{showShareModal && selectedPostForShare && (
				<SharePostModal
					isOpen={showShareModal}
					post={selectedPostForShare}
					onClose={() => setShowShareModal(false)}
					userId={userId}
					onShareComplete={handleShareCompleted}
				/>
			)}
		</>
	);
}
