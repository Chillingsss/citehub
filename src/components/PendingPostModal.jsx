import React, { useState, useEffect } from "react";
import { X, Clock, AlertCircle } from "lucide-react";
import { getPendingPosts } from "../utils/student";

export default function PendingPostModal({ isOpen, onClose, userId }) {
	const [pendingPosts, setPendingPosts] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// Fetch pending posts when modal opens
	useEffect(() => {
		if (isOpen && userId) {
			fetchPendingPosts();
		}
	}, [isOpen, userId]);

	const fetchPendingPosts = async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await getPendingPosts(userId);
			if (response.success) {
				setPendingPosts(response.posts);
			} else {
				setError("Failed to fetch pending posts");
				setPendingPosts([]);
			}
		} catch (error) {
			console.error("Error fetching pending posts:", error);
			setError("An error occurred while fetching pending posts");
			setPendingPosts([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setPendingPosts([]);
		setError("");
		onClose();
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getImageUrl = (filename, uploadType) => {
		if (!filename) return null;

		const trimmed = filename.trim();

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

		// For local uploads - use dynamic API URL
		return `http://localhost/citehub/backend/uploads/${trimmed}`;
	};

	const renderPostImages = (post) => {
		if (!post.image_files) return null;

		const imageFiles = post.image_files.split(",");
		const uploadTypes = post.image_upload_types
			? post.image_upload_types.split(",")
			: [];
		const imageCount = imageFiles.length;

		if (imageCount === 1) {
			const imageUrl = getImageUrl(
				imageFiles[0].trim(),
				uploadTypes[0]?.trim()
			);
			return (
				<div className="mt-3">
					<img
						src={imageUrl}
						alt="Post content"
						className="w-full max-h-96 object-cover rounded-lg"
						loading="lazy"
					/>
				</div>
			);
		}

		if (imageCount === 2) {
			return (
				<div className="mt-3 grid grid-cols-2 gap-2">
					{imageFiles.map((filename, index) => {
						const imageUrl = getImageUrl(
							filename.trim(),
							uploadTypes[index]?.trim()
						);
						return (
							<img
								key={index}
								src={imageUrl}
								alt={`Post content ${index + 1}`}
								className="w-full h-32 object-cover rounded-lg"
								loading="lazy"
							/>
						);
					})}
				</div>
			);
		}

		if (imageCount === 3) {
			return (
				<div className="mt-3 grid grid-cols-2 gap-2">
					<img
						src={getImageUrl(imageFiles[0].trim(), uploadTypes[0]?.trim())}
						alt="Post content 1"
						className="w-full h-32 object-cover rounded-lg"
						loading="lazy"
					/>
					<div className="grid grid-rows-2 gap-2">
						<img
							src={getImageUrl(imageFiles[1].trim(), uploadTypes[1]?.trim())}
							alt="Post content 2"
							className="w-full h-15 object-cover rounded-lg"
							loading="lazy"
						/>
						<img
							src={getImageUrl(imageFiles[2].trim(), uploadTypes[2]?.trim())}
							alt="Post content 3"
							className="w-full h-15 object-cover rounded-lg"
							loading="lazy"
						/>
					</div>
				</div>
			);
		}

		// 4 or more images
		return (
			<div className="mt-3 grid grid-cols-2 gap-2">
				<img
					src={getImageUrl(imageFiles[0].trim(), uploadTypes[0]?.trim())}
					alt="Post content 1"
					className="w-full h-32 object-cover rounded-lg"
					loading="lazy"
				/>
				<div className="relative">
					<img
						src={getImageUrl(imageFiles[1].trim(), uploadTypes[1]?.trim())}
						alt="Post content 2"
						className="w-full h-32 object-cover rounded-lg"
						loading="lazy"
					/>
					<div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
						<span className="text-white text-xl font-bold">
							+{imageCount - 2}
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div
			className={`fixed inset-0 z-50 transition-opacity duration-300 ${
				isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
		>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={handleClose}
			/>

			{/* Modal content - Right side slider */}
			<div
				className={`fixed inset-y-0 right-0 flex flex-col w-full sm:max-w-md md:max-w-xl lg:max-w-2xl bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30 flex-shrink-0">
							<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
						</div>
						<div className="min-w-0 flex-1">
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
								Pending Posts
							</h2>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
								Posts awaiting approval
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 touch-manipulation"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
						</div>
					) : error ? (
						<div className="flex items-center justify-center py-12 px-6">
							<div className="text-center">
								<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
								<p className="text-gray-600 dark:text-gray-400">{error}</p>
								<button
									onClick={fetchPendingPosts}
									className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
								>
									Try Again
								</button>
							</div>
						</div>
					) : pendingPosts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-6">
							<div className="p-4 bg-green-100 rounded-full dark:bg-green-900/30 mb-4">
								<Clock className="w-12 h-12 text-green-600 dark:text-green-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
								No Pending Posts
							</h3>
							<p className="text-gray-500 dark:text-gray-400 text-center">
								All your posts have been approved or you haven't created any
								posts yet.
							</p>
						</div>
					) : (
						<div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
							{/* Info Banner */}
							<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
								<div className="flex items-start gap-2 sm:gap-3">
									<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
									<div>
										<h4 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100 mb-1">
											Awaiting Approval
										</h4>
										<p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
											Your posts are currently being reviewed by administrators,
											faculty members, or SBO officers. They will appear in the
											main feed once approved.
										</p>
									</div>
								</div>
							</div>

							{/* Pending Posts List */}
							{pendingPosts.map((post) => (
								<div
									key={post.post_id}
									className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
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
													{post.user_name?.[0] || "U"}
												</span>
											</div>
										)}
										<div className="flex-1 min-w-0">
											<h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
												{post.user_name}
											</h4>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
												{formatDate(post.post_createdAt)}
											</p>
										</div>
										<div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex-shrink-0">
											<Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
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

									{/* Post Images */}
									{renderPostImages(post)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
