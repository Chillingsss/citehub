import React, { useState, useEffect } from "react";
import { sharePost } from "../utils/admin";
import { getDecryptedApiUrl } from "../utils/apiConfig";

export default function SharePostModal({
	isOpen,
	onClose,
	post,
	userId,
	onShareComplete,
}) {
	const [caption, setCaption] = useState("");
	const [isSharing, setIsSharing] = useState(false);
	const [error, setError] = useState("");

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setCaption("");
			setError("");
		}
	}, [isOpen]);

	if (!isOpen || !post) return null;

	const handleShare = async () => {
		if (!userId) {
			setError("You must be logged in to share posts");
			return;
		}

		setIsSharing(true);
		setError("");

		try {
			const result = await sharePost(post.post_id, userId, caption);

			if (result.success) {
				// Close modal and reset form
				setCaption("");
				setError("");
				onClose();

				// Call the onShareComplete callback if provided
				if (onShareComplete) {
					onShareComplete(result);
				}
			} else {
				setError(result.message || "Failed to share post");
			}
		} catch (error) {
			console.error("Error sharing post:", error);
			setError("An error occurred while sharing the post");
		} finally {
			setIsSharing(false);
		}
	};

	const handleClose = () => {
		setCaption("");
		setError("");
		onClose();
	};

	const renderImages = (imageFiles, post) => {
		if (!imageFiles) return null;

		// Handle case where imageFiles might be an empty string or null
		if (typeof imageFiles !== "string" || imageFiles.trim() === "") {
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
				// Try different Google Drive URL formats
				const url1 = `https://drive.google.com/uc?id=${trimmed}`;
				const url2 = `https://drive.google.com/file/d/${trimmed}/view?usp=sharing`;
				const url3 = `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1000`;

				// Try the thumbnail format first as it's more likely to work
				// If that doesn't work, we can try the direct file access format
				return url3;
			}

			// Fallback to filename pattern detection for backward compatibility
			// If this looks like a Google Drive fileId (contains underscore and timestamp pattern)
			if (trimmed && trimmed.includes("_") && trimmed.length >= 15) {
				const url = `https://drive.google.com/uc?id=${trimmed}`;
				return url;
			}
			// If this looks like a Google Drive fileId (no dot extension, 25+ chars typical)
			if (trimmed && trimmed.indexOf(".") === -1 && trimmed.length >= 20) {
				const url = `https://drive.google.com/uc?id=${trimmed}`;
				return url;
			}
			// Else assume legacy local upload filename
			const url = `${getDecryptedApiUrl()}/uploads/${trimmed}`;
			return url;
		};
		const imageUrls = images.map((img, index) => toUrl(img, index));

		if (imageCount === 1) {
			return (
				<img
					src={imageUrls[0]}
					alt="Post"
					className="object-cover w-full max-h-48 rounded-lg border"
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
							className="object-cover w-full h-24 rounded-lg border"
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
							className="object-cover w-full h-20 rounded-lg border"
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
							className="object-cover w-full h-20 rounded-lg border"
						/>
					))}
				</div>
			);
		}

		// 5 or more images - show first 4 with overlay
		return (
			<div className="grid grid-cols-2 gap-2">
				{images.slice(0, 4).map((image, index) => (
					<img
						key={index}
						src={imageUrls[index]}
						alt={`Post ${index + 1}`}
						className="object-cover w-full h-20 rounded-lg border"
					/>
				))}
				{imageCount > 4 && (
					<div className="relative">
						<img
							src={imageUrls[4]}
							alt="Post 5"
							className="object-cover w-full h-20 rounded-lg border"
						/>
						<div className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-lg">
							<span className="text-sm font-bold text-white">
								+{imageCount - 4}
							</span>
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
			<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Share Post
					</h3>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<svg
							className="w-6 h-6"
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

				{/* Content */}
				<div className="p-4">
					{/* Original Post Preview */}
					<div className="p-3 mb-4 bg-gray-50 rounded-lg dark:bg-gray-700">
						<div className="flex items-center mb-2">
							<div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full mr-2">
								{`${post?.user_name?.charAt(0) || ""}`}
							</div>
							<div>
								<span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
									{post.user_name}
								</span>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									{new Date(post.post_createdAt).toLocaleString("en-PH", {
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

						{post.post_caption && (
							<p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
								{post.post_caption}
							</p>
						)}

						{post.image_files && renderImages(post.image_files, post)}
					</div>

					{/* Caption Input */}
					<div className="mb-4">
						<label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
							Add a caption (optional)
						</label>
						<textarea
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							placeholder="What's on your mind?"
							className="p-3 w-full rounded-lg border border-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:focus:ring-blue-400"
							rows="3"
							maxLength="250"
						/>
						<div className="flex justify-between items-center mt-1">
							<span className="text-xs text-gray-500 dark:text-gray-400">
								{caption.length}/250 characters
							</span>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg border border-red-400 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
							{error}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex gap-3 justify-end p-4 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={handleClose}
						disabled={isSharing}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
					>
						Cancel
					</button>
					<button
						onClick={handleShare}
						disabled={isSharing}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
					>
						{isSharing ? "Sharing..." : "Share Post"}
					</button>
				</div>
			</div>
		</div>
	);
}
