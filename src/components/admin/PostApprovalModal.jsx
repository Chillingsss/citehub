import React, { useState, useEffect, useRef } from "react";
import { getDecryptedApiUrl } from "../../utils/apiConfig";
import {
	X,
	ChevronLeft,
	ChevronRight,
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Check,
	XCircle,
	Search,
} from "lucide-react";
import { getPostsWithUserReactions } from "../../utils/faculty";

export default function PostApprovalModal({
	isOpen,
	onClose,
	userId,
	onPostApproved,
	onPostAction,
}) {
	const [pendingPosts, setPendingPosts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImageSet, setCurrentImageSet] = useState([]);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [selectedPost, setSelectedPost] = useState(null);
	const [processing, setProcessing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch pending posts when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchPendingPosts();
		} else {
			// Clear search when modal closes
			setSearchQuery("");
		}
	}, [isOpen]);

	const fetchPendingPosts = async () => {
		setLoading(true);
		try {
			const apiUrl = getDecryptedApiUrl();
			const response = await fetch(`${apiUrl}/admin.php`, {
				method: "POST",
				body: new URLSearchParams({
					operation: "getPendingPosts",
				}),
			});

			const data = await response.json();
			if (Array.isArray(data)) {
				setPendingPosts(data);
			}
		} catch (error) {
			console.error("Error fetching pending posts:", error);
		} finally {
			setLoading(false);
		}
	};

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
		setZoomLevel(1);
	};

	const closeImageModal = () => {
		setSelectedImage(null);
		setCurrentImageIndex(0);
		setCurrentImageSet([]);
		setSelectedPost(null);
		setZoomLevel(1);
	};

	const nextImage = () => {
		if (currentImageSet.length > 0) {
			const nextIndex = (currentImageIndex + 1) % currentImageSet.length;
			setCurrentImageIndex(nextIndex);
			setSelectedImage(currentImageSet[nextIndex]);
			setZoomLevel(1);
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
			setZoomLevel(1);
		}
	};

	const zoomIn = () => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3));
	};

	const zoomOut = () => {
		setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
	};

	const resetZoom = () => {
		setZoomLevel(1);
	};

	const renderImages = (imageFiles, post) => {
		if (!imageFiles) {
			return null;
		}

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
			return `${getDecryptedApiUrl()}/uploads/${trimmed}`;
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
						/>
					))}
				</div>
			);
		}

		if (imageCount === 3) {
			return (
				<div className="grid grid-cols-2 gap-2">
					<img
						src={imageUrls[0]}
						alt="Post 1"
						className="object-cover w-full h-40 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
						onClick={() => handleImageClick(imageUrls[0], imageUrls, 0, post)}
					/>
					<div className="grid grid-rows-2 gap-2">
						<img
							src={imageUrls[1]}
							alt="Post 2"
							className="object-cover w-full h-19 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() => handleImageClick(imageUrls[1], imageUrls, 1, post)}
						/>
						<div className="relative">
							<img
								src={imageUrls[2]}
								alt="Post 3"
								className="object-cover w-full h-19 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
								onClick={() =>
									handleImageClick(imageUrls[2], imageUrls, 2, post)
								}
							/>
							<div
								className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg cursor-pointer"
								onClick={() =>
									handleImageClick(imageUrls[2], imageUrls, 2, post)
								}
							>
								<span className="text-white text-xl font-bold">+1</span>
							</div>
						</div>
					</div>
				</div>
			);
		}

		if (imageCount >= 4) {
			return (
				<div className="grid grid-cols-2 gap-2">
					<img
						src={imageUrls[0]}
						alt="Post 1"
						className="object-cover w-full h-40 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
						onClick={() => handleImageClick(imageUrls[0], imageUrls, 0, post)}
					/>
					<div className="relative">
						<img
							src={imageUrls[1]}
							alt="Post 2"
							className="object-cover w-full h-40 rounded-lg border transition-opacity cursor-pointer hover:opacity-90"
							onClick={() => handleImageClick(imageUrls[1], imageUrls, 1, post)}
						/>
						<div
							className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg cursor-pointer"
							onClick={() => handleImageClick(imageUrls[1], imageUrls, 1, post)}
						>
							<span className="text-white text-2xl font-bold">
								+{imageCount - 2}
							</span>
						</div>
					</div>
				</div>
			);
		}

		return null;
	};

	const handleApprovePost = async (postId) => {
		setProcessing(true);
		try {
			const apiUrl = getDecryptedApiUrl();
			const response = await fetch(`${apiUrl}/admin.php`, {
				method: "POST",
				body: new URLSearchParams({
					operation: "approvePost",
					json: JSON.stringify({ postId: postId, userId: userId }),
				}),
			});

			const data = await response.json();
			if (data.success) {
				// Remove the approved post from the list
				setPendingPosts((prev) =>
					prev.filter((post) => post.post_id !== postId)
				);
				// Trigger feed refresh to show the newly approved post
				if (onPostApproved) {
					onPostApproved();
				}
				// Trigger count refresh
				if (onPostAction) {
					onPostAction();
				}
			}
		} catch (error) {
			console.error("Error approving post:", error);
		} finally {
			setProcessing(false);
		}
	};

	const handleRejectPost = async (postId) => {
		setProcessing(true);
		try {
			const apiUrl = getDecryptedApiUrl();
			const response = await fetch(`${apiUrl}/admin.php`, {
				method: "POST",
				body: new URLSearchParams({
					operation: "rejectPost",
					json: JSON.stringify({ postId: postId }),
				}),
			});

			const data = await response.json();
			if (data.success) {
				// Remove the rejected post from the list
				setPendingPosts((prev) =>
					prev.filter((post) => post.post_id !== postId)
				);
				getPostsWithUserReactions(userId);
				// Trigger count refresh
				if (onPostAction) {
					onPostAction();
				}

				// Log Google Drive deletion results if available
				if (data.googleDriveResults) {
					console.log("Google Drive files deleted:", data.googleDriveResults);
				}
			} else {
				console.error("Failed to reject post:", data.error);
			}
		} catch (error) {
			console.error("Error rejecting post:", error);
		} finally {
			setProcessing(false);
		}
	};

	// Filter posts based on search query
	const filteredPosts = pendingPosts.filter((post) => {
		if (!searchQuery.trim()) return true;

		const query = searchQuery.toLowerCase().trim();
		const userName = (post.user_name || "").toLowerCase();
		const caption = (post.post_caption || "").toLowerCase();

		return userName.includes(query) || caption.includes(query);
	});

	return (
		<div
			className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
				isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
		>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				onClick={onClose}
			/>

			{/* Modal content - Right side slider */}
			<div
				className={`fixed inset-y-0 right-0 flex flex-col w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-300 ease-out ${
					isOpen
						? "translate-x-0 scale-100 opacity-100"
						: "translate-x-full scale-95 opacity-0"
				}`}
				onClick={(e) => e.stopPropagation()}
				style={{
					transformOrigin: "right center",
				}}
			>
				{/* Header */}
				<div
					className={`flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10 transition-all duration-300 delay-100 ease-out ${
						isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
					}`}
				>
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<div
							className={`p-1.5 sm:p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 flex-shrink-0 transition-all duration-300 delay-150 ease-out ${
								isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
							}`}
						>
							<Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div
							className={`min-w-0 flex-1 transition-all duration-300 delay-200 ease-out ${
								isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
							}`}
						>
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
								Post Approval
							</h2>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
								{searchQuery.trim()
									? `${filteredPosts.length} of ${pendingPosts.length} posts`
									: `${pendingPosts.length} pending posts`}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className={`p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 touch-manipulation transition-all duration-300 delay-100 ease-out ${
							isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
						}`}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Search Bar */}
				<div
					className={`px-4 sm:px-6 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-all duration-300 delay-150 ease-out ${
						isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
					}`}
				>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
						</div>
						<input
							type="text"
							placeholder="Search by name or caption..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
				</div>

				{/* Content */}
				<div
					className={`flex-1 overflow-y-auto transition-all duration-300 delay-250 ease-out ${
						isOpen ? "opacity-100" : "opacity-0"
					}`}
				>
					{loading ? (
						<div
							className={`flex items-center justify-center py-12 transition-all duration-300 delay-300 ease-out ${
								isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
							}`}
						>
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
						</div>
					) : pendingPosts.length === 0 ? (
						<div
							className={`flex flex-col items-center justify-center py-12 px-6 transition-all duration-500 delay-300 ease-out ${
								isOpen
									? "opacity-100 translate-y-0 scale-100"
									: "opacity-0 translate-y-8 scale-95"
							}`}
						>
							<div
								className={`p-4 bg-green-100 rounded-full dark:bg-green-900/30 mb-4 transition-all duration-300 delay-400 ease-out ${
									isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
								}`}
							>
								<Check className="w-12 h-12 text-green-600 dark:text-green-400" />
							</div>
							<h3
								className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-all duration-300 delay-450 ease-out ${
									isOpen
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-4"
								}`}
							>
								No Pending Posts
							</h3>
							<p
								className={`text-gray-500 dark:text-gray-400 text-center transition-all duration-300 delay-500 ease-out ${
									isOpen
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-4"
								}`}
							>
								All posts have been reviewed and approved.
							</p>
						</div>
					) : filteredPosts.length === 0 ? (
						<div
							className={`flex flex-col items-center justify-center py-12 px-6 transition-all duration-500 delay-300 ease-out ${
								isOpen
									? "opacity-100 translate-y-0 scale-100"
									: "opacity-0 translate-y-8 scale-95"
							}`}
						>
							<div
								className={`p-4 bg-gray-100 rounded-full dark:bg-gray-800 mb-4 transition-all duration-300 delay-400 ease-out ${
									isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
								}`}
							>
								<Search className="w-12 h-12 text-gray-600 dark:text-gray-400" />
							</div>
							<h3
								className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-all duration-300 delay-450 ease-out ${
									isOpen
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-4"
								}`}
							>
								No Results Found
							</h3>
							<p
								className={`text-gray-500 dark:text-gray-400 text-center transition-all duration-300 delay-500 ease-out ${
									isOpen
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-4"
								}`}
							>
								No posts match your search criteria. Try a different search
								term.
							</p>
						</div>
					) : (
						<div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
							{filteredPosts.map((post, index) => (
								<div
									key={post.post_id}
									className={`bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-500 ease-out ${
										isOpen
											? "opacity-100 translate-y-0 scale-100"
											: "opacity-0 translate-y-8 scale-95"
									}`}
									style={{
										transitionDelay: `${300 + index * 100}ms`,
									}}
								>
									{/* Post Header */}
									<div className="flex items-start gap-2 sm:gap-3 mb-3">
										{post.user_avatar ? (
											<img
												src={post.user_avatar}
												alt={post.user_name}
												className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
											/>
										) : (
											<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
												<span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
													{post.user_name?.charAt(0) || "U"}
												</span>
											</div>
										)}
										<div className="flex-1 min-w-0">
											<h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
												{post.user_name}
											</h4>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
												{new Date(post.post_createdAt).toLocaleString("en-PH", {
													timeZone: "Asia/Manila",
													year: "numeric",
													month: "short",
													day: "numeric",
													hour: "numeric",
													minute: "2-digit",
													hour12: true,
												})}
											</p>
										</div>
										<div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex-shrink-0">
											<Check className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
											<span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">
												Pending
											</span>
										</div>
									</div>

									{/* Post Content */}
									{post.post_caption && (
										<div className="mb-3">
											<p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
												{post.post_caption}
											</p>
										</div>
									)}

									{/* Images */}
									{post.image_files && (
										<div className="mb-4">
											{renderImages(post.image_files, post)}
										</div>
									)}

									{/* Action Buttons */}
									<div className="flex items-center justify-end gap-2 sm:gap-3 pt-2">
										<button
											onClick={() => handleRejectPost(post.post_id)}
											disabled={processing}
											className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base text-red-600 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 touch-manipulation min-w-[80px] sm:min-w-[100px] transition-all duration-200 ease-out hover:scale-105 active:scale-95"
										>
											<XCircle className="w-4 h-4 mr-1 sm:mr-2" />
											<span>Reject</span>
										</button>
										<button
											onClick={() => handleApprovePost(post.post_id)}
											disabled={processing}
											className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base text-green-600 bg-green-100 rounded-lg hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50 touch-manipulation min-w-[80px] sm:min-w-[100px] transition-all duration-200 ease-out hover:scale-105 active:scale-95"
										>
											<Check className="w-4 h-4 mr-1 sm:mr-2" />
											<span>Approve</span>
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			{/* Image Modal */}
			{selectedImage && selectedPost && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 animate-in fade-in duration-300">
					<div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
						{/* Close Button */}
						<button
							onClick={closeImageModal}
							className="absolute top-4 right-4 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
						>
							<X className="w-6 h-6" />
						</button>

						{/* Image */}
						<img
							src={selectedImage}
							alt="Full size"
							className="object-contain w-full h-full max-w-full max-h-full transition-transform duration-200"
							style={{ transform: `scale(${zoomLevel})` }}
						/>

						{/* Zoom Controls */}
						<div className="absolute top-4 left-4 z-10 flex space-x-2">
							<button
								onClick={zoomIn}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom In"
							>
								<ZoomIn className="w-5 h-5" />
							</button>
							<button
								onClick={zoomOut}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom Out"
							>
								<ZoomOut className="w-5 h-5" />
							</button>
							<button
								onClick={resetZoom}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Reset Zoom"
							>
								<RotateCcw className="w-5 h-5" />
							</button>
						</div>

						{/* Navigation Arrows */}
						{currentImageSet.length > 1 && (
							<>
								<button
									onClick={prevImage}
									className="absolute left-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
								>
									<ChevronLeft className="w-6 h-6" />
								</button>
								<button
									onClick={nextImage}
									className="absolute right-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
								>
									<ChevronRight className="w-6 h-6" />
								</button>
							</>
						)}

						{/* Image Counter */}
						{currentImageSet.length > 1 && (
							<div className="absolute bottom-4 left-1/2 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full transform -translate-x-1/2">
								{currentImageIndex + 1} / {currentImageSet.length}
							</div>
						)}

						{/* Zoom Level Indicator */}
						{zoomLevel !== 1 && (
							<div className="absolute right-4 bottom-4 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full">
								{Math.round(zoomLevel * 100)}%
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
