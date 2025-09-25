import React, { useRef, useState, useEffect } from "react";
import {
	getSharedPostComments,
	addSharedPostComment,
	editSharedPostComment,
	deleteSharedPostComment,
	formatTimeAgo,
} from "../utils/student";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import ImageModal from "./ImageModal";
import CommentActionsMenu from "./ui/CommentActionsMenu";

export default function SharedPostModal({
	selectedPost,
	onClose,
	userId,
	onCommentAdded,
}) {
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const commentsEndRef = useRef(null);
	const commentsContainerRef = useRef(null);
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editingCommentText, setEditingCommentText] = useState("");
	const [showCommentMenu, setShowCommentMenu] = useState(null);

	// Image modal states for original post images
	const [selectedImage, setSelectedImage] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImageSet, setCurrentImageSet] = useState([]);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [originalPostForModal, setOriginalPostForModal] = useState(null);

	// Function to scroll to bottom
	const scrollToBottom = () => {
		if (commentsEndRef.current) {
			commentsEndRef.current.scrollIntoView({
				behavior: "smooth",
				block: "end",
			});
		}
	};

	// Scroll to bottom when comments change (new comment added)
	useEffect(() => {
		if (comments.length > 0) {
			// Small delay to ensure DOM is updated
			setTimeout(scrollToBottom, 100);
		}
	}, [comments.length]);

	// Fetch comments when selectedPost changes
	useEffect(() => {
		if (selectedPost && selectedPost.postS_id) {
			const fetchComments = async () => {
				setLoading(true);
				try {
					const result = await getSharedPostComments(selectedPost.postS_id);
					if (result.success) {
						setComments(result.comments);
						// Scroll to bottom after comments are loaded
						if (result.comments.length > 0) {
							setTimeout(scrollToBottom, 200);
						}
					}
				} catch (error) {
					console.error("Error fetching shared post comments:", error);
				} finally {
					setLoading(false);
				}
			};
			fetchComments();
		}
	}, [selectedPost]);

	// Image modal functions
	const handleImageClick = (imageUrl, imageSet = null, imageIndex = 0) => {
		if (imageSet) {
			setCurrentImageSet(imageSet);
			setCurrentImageIndex(imageIndex);
		}
		setSelectedImage(imageUrl);
		setZoomLevel(1); // Reset zoom when opening new image

		// Create original post object for the ImageModal
		setOriginalPostForModal({
			post_id: selectedPost.original_postId,
			user_name: selectedPost.original_name,
			user_avatar: selectedPost.original_avatar,
			post_caption: selectedPost.original_caption,
			post_createdAt: selectedPost.original_createdAt,
			image_files: selectedPost.original_images,
		});
	};

	const closeImageModal = () => {
		setSelectedImage(null);
		setCurrentImageIndex(0);
		setCurrentImageSet([]);
		setZoomLevel(1);
		setOriginalPostForModal(null);
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

	const handleSubmitComment = async (e) => {
		e.preventDefault();

		if (!commentText.trim() || !userId || !selectedPost) {
			return;
		}

		setSubmitting(true);

		try {
			const result = await addSharedPostComment(
				userId,
				selectedPost.postS_id,
				commentText.trim()
			);

			if (result.success) {
				// Clear the input
				setCommentText("");

				// Refresh comments
				const updatedComments = await getSharedPostComments(
					selectedPost.postS_id
				);
				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				// Notify parent component if callback provided
				if (onCommentAdded) {
					onCommentAdded(selectedPost.postS_id);
				}
			} else {
				console.error("Failed to add shared post comment:", result.message);
			}
		} catch (error) {
			console.error("Error submitting shared post comment:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleEditComment = (comment) => {
		setEditingCommentId(comment.commentS_id);
		setEditingCommentText(comment.commentS_message);
		setShowCommentMenu(null);
	};

	const handleCancelEdit = () => {
		setEditingCommentId(null);
		setEditingCommentText("");
	};

	const handleSaveEdit = async (comment) => {
		if (!editingCommentText.trim()) return;

		try {
			const result = await editSharedPostComment(
				comment.commentS_id,
				editingCommentText.trim()
			);

			if (result.success) {
				// Refresh comments
				const updatedComments = await getSharedPostComments(
					selectedPost.postS_id
				);
				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				setEditingCommentId(null);
				setEditingCommentText("");

				// Notify parent component if callback provided
				if (onCommentAdded) {
					onCommentAdded(selectedPost.postS_id);
				}
			}
		} catch (error) {
			console.error("Error editing shared post comment:", error);
		}
	};

	const handleDeleteComment = async (comment) => {
		try {
			const result = await deleteSharedPostComment(comment.commentS_id);

			if (result.success) {
				// Refresh comments
				const updatedComments = await getSharedPostComments(
					selectedPost.postS_id
				);
				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				// Notify parent component if callback provided
				if (onCommentAdded) {
					onCommentAdded(selectedPost.postS_id);
				}
			}
		} catch (error) {
			console.error("Error deleting shared post comment:", error);
		} finally {
			setShowCommentMenu(null);
		}
	};

	// Render original post images
	const renderOriginalImages = () => {
		if (!selectedPost.original_images) return null;

		const images = selectedPost.original_images.split(",");
		const uploadTypes = selectedPost.original_image_upload_types
			? selectedPost.original_image_upload_types.split(",")
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

		if (images.length === 1) {
			return (
				<img
					src={imageUrls[0]}
					alt="Original post"
					className="object-cover w-full max-h-80 rounded-lg border cursor-pointer transition-opacity hover:opacity-90"
					onClick={() => handleImageClick(imageUrls[0], imageUrls, 0)}
				/>
			);
		}

		// Multiple images - show in grid
		return (
			<div
				className={`grid gap-2 ${
					images.length === 2
						? "grid-cols-2"
						: images.length === 3
						? "grid-cols-3"
						: "grid-cols-2"
				}`}
			>
				{imageUrls.slice(0, 4).map((imageUrl, index) => (
					<div key={index} className="relative">
						<img
							src={imageUrl}
							alt={`Original post ${index + 1}`}
							className="object-cover w-full h-32 rounded-lg border cursor-pointer transition-opacity hover:opacity-90"
							onClick={() => handleImageClick(imageUrl, imageUrls, index)}
						/>
						{/* Show +X more overlay for 5+ images */}
						{index === 3 && images.length > 4 && (
							<div
								className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-lg cursor-pointer transition-opacity hover:bg-opacity-60"
								onClick={() => handleImageClick(imageUrl, imageUrls, index)}
							>
								<span className="text-lg font-bold text-white">
									+{images.length - 4}
								</span>
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	if (!selectedPost) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-75">
			<div className="flex overflow-hidden flex-col w-full max-w-6xl h-[90vh] bg-white rounded-lg md:flex-row dark:bg-[#282828]">
				{/* Shared Post Content - Left side on desktop, top on mobile */}
				<div className="flex relative flex-1 justify-center items-start min-h-0 max-h-[45vh] md:max-h-full overflow-y-auto">
					<div className="p-6 w-full">
						{/* Shared Post Header */}
						<div className="flex-shrink-0 mb-4">
							<div className="flex items-center mb-3">
								<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm mr-3">
									{`${selectedPost.user_name.charAt(0) || ""}`}
								</div>
								<div>
									<span className="font-semibold text-gray-800 dark:text-gray-100">
										{selectedPost.user_name}
									</span>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{new Date(selectedPost.postS_createdAt).toLocaleString(
											"en-PH",
											{
												timeZone: "Asia/Manila",
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
												hour12: true,
											}
										)}
									</div>
								</div>
							</div>

							{/* Shared Post Caption */}
							{selectedPost.postS_caption && (
								<p className="mb-4 text-gray-900 dark:text-gray-100">
									{selectedPost.postS_caption}
								</p>
							)}
						</div>

						{/* Original Post Content */}
						<div className="flex-1 p-4 bg-gray-50 rounded-lg border dark:bg-transparent dark:border-gray-600">
							{/* Original Post Header */}
							<div className="flex items-center mb-3">
								<div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full mr-3">
									{`${selectedPost.original_name?.charAt(0) || ""}`}
								</div>
								<div>
									<span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
										{selectedPost.original_name}
									</span>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{new Date(selectedPost.original_createdAt).toLocaleString(
											"en-PH",
											{
												timeZone: "Asia/Manila",
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
												hour12: true,
											}
										)}
									</div>
								</div>
							</div>

							{/* Original Post Caption */}
							{selectedPost.original_caption && (
								<p className="mb-3 text-sm text-gray-800 dark:text-gray-200">
									{selectedPost.original_caption}
								</p>
							)}

							{/* Original Post Images */}
							{renderOriginalImages()}
						</div>
					</div>
				</div>

				{/* Comments section - Right side on desktop, bottom on mobile */}
				<div className="flex flex-col w-full md:w-[400px] border-t md:border-l border-gray-200 dark:border-gray-700 max-h-[45vh] md:max-h-full">
					{/* Header */}
					<div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
								Comments ({comments.length})
							</h3>
							{/* Close button */}
							<button
								onClick={onClose}
								className="p-2 text-gray-600 bg-gray-100 rounded-full transition-colors hover:bg-gray-200 dark:text-gray-400 dark:bg-transparent dark:hover:bg-gray-600"
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Comments Section */}
					<div
						ref={commentsContainerRef}
						className="overflow-y-auto flex-1 min-h-0"
					>
						<div className="p-4">
							{loading ? (
								<div className="flex justify-center items-center py-8">
									<div className="w-6 h-6 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
								</div>
							) : comments.length > 0 ? (
								<div className="pb-4 space-y-4">
									{comments.map((comment) => {
										const commentId = comment.commentS_id;
										const isEditing = editingCommentId === commentId;
										const canEdit = comment.commentS_userId === userId;

										return (
											<div
												key={commentId}
												className="flex items-start space-x-3"
											>
												<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full flex-shrink-0">
													{`${comment?.user_name?.charAt(0) || ""}`}
												</div>
												<div className="flex-1 px-4 py-3 bg-gray-100 rounded-xl dark:bg-[#3f3f3f]">
													<div className="flex justify-between items-center mb-2">
														<span className="font-semibold text-gray-800 dark:text-gray-100">
															{comment.user_name}
														</span>
														{canEdit && (
															<div className="relative">
																<button
																	onClick={() =>
																		setShowCommentMenu(
																			showCommentMenu === commentId
																				? null
																				: commentId
																		)
																	}
																	className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
																>
																	<svg
																		className="w-4 h-4"
																		fill="currentColor"
																		viewBox="0 0 20 20"
																	>
																		<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
																	</svg>
																</button>
																<CommentActionsMenu
																	canEdit={true}
																	onEdit={() => handleEditComment(comment)}
																	onDelete={() => handleDeleteComment(comment)}
																	isOpen={showCommentMenu === commentId}
																	onClose={() => setShowCommentMenu(null)}
																/>
															</div>
														)}
													</div>
													{isEditing ? (
														<div className="space-y-2">
															<textarea
																value={editingCommentText}
																onChange={(e) =>
																	setEditingCommentText(e.target.value)
																}
																className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#282828] dark:border-gray-600 dark:text-white resize-none"
																rows={3}
															/>
															<div className="flex justify-end space-x-2">
																<button
																	onClick={() => handleCancelEdit()}
																	className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
																>
																	Cancel
																</button>
																<button
																	onClick={() => handleSaveEdit(comment)}
																	className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
																>
																	Save
																</button>
															</div>
														</div>
													) : (
														<>
															<p className="text-sm leading-relaxed text-gray-700 break-words dark:text-gray-300 mb-2">
																{comment.commentS_message}
															</p>
															<span className="text-xs text-gray-400 dark:text-gray-500 opacity-70">
																{formatTimeAgo(comment.commentS_createdAt)}
															</span>
														</>
													)}
												</div>
											</div>
										);
									})}
									{/* Invisible element to scroll to */}
									<div ref={commentsEndRef} />
								</div>
							) : (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<svg
										className="mx-auto mb-3 w-12 h-12 text-gray-400 dark:text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									<p>No comments yet</p>
									<p className="mt-1 text-xs">Be the first to comment!</p>
								</div>
							)}
						</div>
					</div>

					{/* Footer - Comment input */}
					<div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
						<form onSubmit={handleSubmitComment} className="flex items-center">
							<input
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="Add a comment..."
								className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:border-gray-600 dark:text-white"
								disabled={submitting}
							/>
							<button
								type="submit"
								className="p-2 ml-2 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
								disabled={submitting || !commentText.trim()}
							>
								{submitting ? (
									<div className="w-5 h-5 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
								) : (
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
											d="M14 5l7 7m0 0l-7 7m7-7H7"
										/>
									</svg>
								)}
							</button>
						</form>
					</div>
				</div>
			</div>

			{/* Image Modal for original post images */}
			{selectedImage && originalPostForModal && (
				<ImageModal
					selectedImage={selectedImage}
					selectedPost={originalPostForModal}
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
					onCommentAdded={() => {}} // Empty function since we don't need to refresh shared post comments
				/>
			)}
		</div>
	);
}
