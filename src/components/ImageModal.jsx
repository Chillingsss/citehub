import React, { useRef, useState, useEffect } from "react";
import {
	getComments,
	addComment,
	getSharedPostComments,
	addSharedPostComment,
	editComment,
	deleteComment,
	editSharedPostComment,
	deleteSharedPostComment,
	formatTimeAgo,
} from "../utils/student";
import CommentActionsMenu from "./ui/CommentActionsMenu";

export default function ImageModal({
	selectedImage,
	selectedPost,
	currentImageIndex,
	currentImageSet,
	zoomLevel,
	onClose,
	onPrevImage,
	onNextImage,
	onZoomIn,
	onZoomOut,
	onResetZoom,
	userId, // Add userId prop
	onCommentAdded, // Add callback for when comment is added
}) {
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const commentsEndRef = useRef(null);
	const commentsContainerRef = useRef(null);
	const [isMobile, setIsMobile] = useState(false);
	const [showCommentsMobile, setShowCommentsMobile] = useState(false);
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editingCommentText, setEditingCommentText] = useState("");
	const [showCommentMenu, setShowCommentMenu] = useState(null);

	// Function to scroll to bottom
	const scrollToBottom = () => {
		if (commentsEndRef.current) {
			commentsEndRef.current.scrollIntoView({
				behavior: "smooth",
				block: "end",
			});
		}
	};

	// Detect mobile viewport
	useEffect(() => {
		const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);
		return () => window.removeEventListener("resize", updateIsMobile);
	}, []);

	// Scroll to bottom when comments change (new comment added)
	useEffect(() => {
		if (comments.length > 0) {
			// Small delay to ensure DOM is updated
			setTimeout(scrollToBottom, 100);
		}
	}, [comments.length]);

	// Fetch comments when selectedPost changes
	useEffect(() => {
		if (selectedPost && (selectedPost.post_id || selectedPost.postS_id)) {
			const fetchComments = async () => {
				setLoading(true);
				try {
					let result;
					// Check if it's a shared post
					if (selectedPost.postS_id || selectedPost.post_type === "shared") {
						const postSId = selectedPost.postS_id || selectedPost.post_id;
						result = await getSharedPostComments(postSId);
					} else {
						result = await getComments(selectedPost.post_id);
					}

					if (result.success) {
						setComments(result.comments);
						// Scroll to bottom after comments are loaded
						if (result.comments.length > 0) {
							setTimeout(scrollToBottom, 200);
						}
					}
				} catch (error) {
					console.error("Error fetching comments:", error);
				} finally {
					setLoading(false);
				}
			};
			fetchComments();

			// On mobile, start with comments hidden when viewing an image
			if (window.innerWidth < 768 && selectedImage) {
				setShowCommentsMobile(false);
			}
		}
	}, [selectedPost]);

	const handleSubmitComment = async (e) => {
		e.preventDefault();

		if (!commentText.trim() || !userId || !selectedPost) {
			return;
		}

		setSubmitting(true);

		try {
			let result;
			// Check if it's a shared post
			if (selectedPost.postS_id || selectedPost.post_type === "shared") {
				const postSId = selectedPost.postS_id || selectedPost.post_id;
				result = await addSharedPostComment(
					userId,
					postSId,
					commentText.trim()
				);
			} else {
				result = await addComment(
					userId,
					selectedPost.post_id,
					commentText.trim()
				);
			}

			if (result.success) {
				// Clear the input
				setCommentText("");

				// Refresh comments
				let updatedComments;
				if (selectedPost.postS_id || selectedPost.post_type === "shared") {
					const postSId = selectedPost.postS_id || selectedPost.post_id;
					updatedComments = await getSharedPostComments(postSId);
				} else {
					updatedComments = await getComments(selectedPost.post_id);
				}

				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				// Notify parent component if callback provided
				if (onCommentAdded) {
					const postId = selectedPost.postS_id || selectedPost.post_id;
					onCommentAdded(postId);
				}
			} else {
				console.error("Failed to add comment:", result.message);
				// You could add a toast notification here
			}
		} catch (error) {
			console.error("Error submitting comment:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleEditComment = (comment) => {
		const commentId = comment.comment_id || comment.commentS_id;
		const commentText = comment.comment_message || comment.commentS_message;
		setEditingCommentId(commentId);
		setEditingCommentText(commentText);
		setShowCommentMenu(null);
	};

	const handleCancelEdit = () => {
		setEditingCommentId(null);
		setEditingCommentText("");
	};

	const handleSaveEdit = async (comment) => {
		if (!editingCommentText.trim()) return;

		try {
			let result;
			const isSharedPostComment = !!comment.commentS_id;

			if (isSharedPostComment) {
				result = await editSharedPostComment(
					comment.commentS_id,
					editingCommentText.trim()
				);
			} else {
				result = await editComment(
					comment.comment_id,
					editingCommentText.trim()
				);
			}

			if (result.success) {
				// Refresh comments
				let updatedComments;
				if (selectedPost.postS_id || selectedPost.post_type === "shared") {
					const postSId = selectedPost.postS_id || selectedPost.post_id;
					updatedComments = await getSharedPostComments(postSId);
				} else {
					updatedComments = await getComments(selectedPost.post_id);
				}

				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				setEditingCommentId(null);
				setEditingCommentText("");

				// Notify parent component after a short delay to avoid race conditions
				if (onCommentAdded) {
					const postId = selectedPost.postS_id || selectedPost.post_id;
					setTimeout(() => onCommentAdded(postId), 100);
				}
			}
		} catch (error) {
			console.error("Error editing comment:", error);
		}
	};

	const handleDeleteComment = async (comment) => {
		try {
			let result;
			const isSharedPostComment = !!comment.commentS_id;

			if (isSharedPostComment) {
				result = await deleteSharedPostComment(comment.commentS_id);
			} else {
				result = await deleteComment(comment.comment_id);
			}

			if (result.success) {
				// Refresh comments
				let updatedComments;
				if (selectedPost.postS_id || selectedPost.post_type === "shared") {
					const postSId = selectedPost.postS_id || selectedPost.post_id;
					updatedComments = await getSharedPostComments(postSId);
				} else {
					updatedComments = await getComments(selectedPost.post_id);
				}

				if (updatedComments.success) {
					setComments(updatedComments.comments);
				}

				// Notify parent component if callback provided
				if (onCommentAdded) {
					const postId = selectedPost.postS_id || selectedPost.post_id;
					onCommentAdded(postId);
				}
			}
		} catch (error) {
			console.error("Error deleting comment:", error);
		} finally {
			setShowCommentMenu(null);
		}
	};

	if (!selectedPost) return null;

	return (
		<div
			className="flex fixed inset-0 z-[9999] justify-center items-center p-0 md:p-4 bg-black bg-opacity-75"
			style={{ zIndex: 9999 }}
		>
			<div
				className={`flex overflow-hidden flex-col bg-white rounded-none md:rounded-lg dark:bg-[#282828] ${
					selectedImage
						? "w-screen h-[100dvh] md:w-auto md:h-auto md:max-w-7xl md:max-h-[95vh] md:flex-row"
						: "w-full max-w-md mx-auto h-auto"
				}`}
				style={{ position: "relative", zIndex: 10000 }}
			>
				{/* Close button - only show one based on context */}
				{selectedImage && (
					<button
						onClick={onClose}
						className="absolute top-3 right-3 z-[10002] p-2 text-gray-600 bg-white/80 rounded-full shadow hover:bg-white dark:hover:bg-gray-700 dark:text-gray-300 dark:bg-[#3a3a3a]/80"
						aria-label="Close"
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
				)}
				{/* Image section - Only show if there's an image */}
				{selectedImage && (
					<div className="flex relative flex-1 justify-center items-start min-h-0 h-full md:max-h-full overflow-y-auto">
						<img
							src={selectedImage}
							alt="Full size"
							className="object-contain w-full h-full max-w-full transition-transform duration-200"
							style={{ transform: `scale(${zoomLevel})` }}
						/>

						{/* Zoom controls */}
						<div className="flex absolute top-4 left-4 z-10 gap-2">
							<button
								onClick={onZoomIn}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom In"
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
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
									/>
								</svg>
							</button>
							<button
								onClick={onZoomOut}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Zoom Out"
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
										d="M5 12h14"
									/>
								</svg>
							</button>
							<button
								onClick={onResetZoom}
								className="p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
								title="Reset Zoom"
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
							</button>
						</div>

						{/* Navigation arrows - only show if multiple images */}
						{currentImageSet.length > 1 && (
							<>
								<button
									onClick={onPrevImage}
									className="absolute left-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
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
											d="M15 19l-7-7 7-7"
										/>
									</svg>
								</button>
								<button
									onClick={onNextImage}
									className="absolute right-4 top-1/2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full transform -translate-y-1/2 hover:bg-opacity-75"
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
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							</>
						)}

						{/* Image counter */}
						{currentImageSet.length > 1 && (
							<div className="absolute bottom-4 left-1/2 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full transform -translate-x-1/2">
								{currentImageIndex + 1} / {currentImageSet.length}
							</div>
						)}

						{/* Zoom level indicator */}
						{zoomLevel !== 1 && (
							<div className="absolute right-4 bottom-4 z-10 px-3 py-1 text-white bg-black bg-opacity-50 rounded-full">
								{Math.round(zoomLevel * 100)}%
							</div>
						)}
					</div>
				)}

				{/* Post details section - Desktop sidebar or full width when no image */}
				{!(isMobile && selectedImage) && (
					<div
						className={`flex flex-col ${
							selectedImage ? "w-full md:w-96" : "w-full max-w-2xl"
						} border-t md:border-l border-gray-200 dark:border-gray-700 min-h-[50vh] md:max-h-full`}
					>
						{/* Close button for comments-only modal */}
						{!selectedImage && (
							<button
								onClick={onClose}
								className="absolute top-4 right-4 z-10 p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
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
						)}

						{/* Header */}
						<div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex justify-between items-center">
								<div className="flex items-center">
									<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm mr-3">
										{`${selectedPost?.user_name?.charAt(0) || ""}`}
									</div>
									<div>
										<span className="font-semibold text-gray-800 dark:text-gray-100">
											{selectedPost.user_name}
										</span>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											{new Date(selectedPost.post_createdAt).toLocaleString(
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

								{/* Close button next to user info */}
								<button
									onClick={onClose}
									className="hidden p-2 text-gray-600 rounded-full transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
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

							{/* Caption */}
							{selectedPost.post_caption && (
								<div className="mt-3">
									<p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
										{selectedPost.post_caption}
									</p>
								</div>
							)}
						</div>

						{/* Comments Section */}
						<div
							ref={commentsContainerRef}
							className="overflow-y-auto flex-1 min-h-0"
						>
							<div className="p-4">
								<h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
									Comments ({comments.length})
								</h3>

								{loading ? (
									<div className="flex justify-center items-center py-8">
										<div className="w-6 h-6 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
									</div>
								) : comments.length > 0 ? (
									<div className="pb-4 space-y-4">
										{comments.map((comment) => {
											const commentId =
												comment.comment_id || comment.commentS_id;
											const isEditing = editingCommentId === commentId;
											const canEdit =
												comment.comment_userId === userId ||
												comment.commentS_userId === userId;

											return (
												<div
													key={commentId}
													className="flex items-start space-x-3"
												>
													<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm">
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
																		onDelete={() =>
																			handleDeleteComment(comment)
																		}
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
																	{comment.comment_message ||
																		comment.commentS_message}
																</p>
																<span className="text-xs text-gray-400 dark:text-gray-500 opacity-70">
																	{formatTimeAgo(
																		comment.comment_createdAt ||
																			comment.commentS_createdAt
																	)}
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
							<form
								onSubmit={handleSubmitComment}
								className="flex items-center"
							>
								<input
									type="text"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment..."
									className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#282828] dark:border-gray-600 dark:text-white"
									disabled={submitting}
								/>
								<button
									type="submit"
									className="p-2 ml-2 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
									disabled={submitting || !commentText.trim()}
								>
									{submitting ? (
										<div className="w-5 h-5 rounded-full border-2 border-green-500 animate-spin border-t-transparent"></div>
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
				)}

				{/* Mobile: poster info bar to utilize white space under contained image */}
				{isMobile && selectedImage && !showCommentsMobile && (
					<div className="fixed inset-x-0 bottom-0 z-[10000] p-3 bg-white border-t dark:bg-[#1f1f1f] dark:border-gray-700">
						<div className="flex items-start justify-between">
							<div className="flex items-start">
								<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm mr-3">
									{`${selectedPost?.user_name?.charAt(0) || ""}`}
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
										{selectedPost.user_name}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
										{selectedPost.post_createdAt &&
											new Date(selectedPost.post_createdAt).toLocaleString(
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
									{/* Post caption */}
									{selectedPost.post_caption && (
										<div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
											{selectedPost.post_caption}
										</div>
									)}
								</div>
							</div>

							{/* Comments button on the right side */}
							<button
								onClick={() => setShowCommentsMobile(true)}
								className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
								aria-label="View comments"
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
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							</button>
						</div>
					</div>
				)}

				{/* Mobile: bottom sheet comments */}
				{isMobile && selectedImage && showCommentsMobile && (
					<div className="fixed inset-x-0 bottom-0 z-[10001] h-[65dvh] bg-white rounded-t-2xl shadow-2xl dark:bg-[#1f1f1f]">
						<div className="sticky top-0 flex items-center justify-between p-4 border-b rounded-t-2xl bg-white dark:bg-[#1f1f1f] dark:border-gray-700">
							<div className="mx-auto h-1.5 w-12 bg-gray-300 rounded-full" />
							<button
								onClick={() => setShowCommentsMobile(false)}
								className="p-2 -mr-2 text-gray-600 rounded-full hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
								aria-label="Close comments"
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

						<div className="overflow-y-auto h-[calc(65dvh-4rem-68px)]">
							<div className="p-4">
								<h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
									Comments ({comments.length})
								</h3>
								{loading ? (
									<div className="flex justify-center items-center py-8">
										<div className="w-6 h-6 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
									</div>
								) : comments.length > 0 ? (
									<div className="pb-4 space-y-4">
										{comments.map((comment) => {
											const commentId =
												comment.comment_id || comment.commentS_id;
											const isEditing = editingCommentId === commentId;
											const canEdit =
												comment.comment_userId === userId ||
												comment.commentS_userId === userId;

											return (
												<div
													key={commentId}
													className="flex items-start space-x-3"
												>
													<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm">
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
																		onDelete={() =>
																			handleDeleteComment(comment)
																		}
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
																	{comment.comment_message ||
																		comment.commentS_message}
																</p>
																<span className="text-xs text-gray-400 dark:text-gray-500 opacity-70">
																	{formatTimeAgo(
																		comment.comment_createdAt ||
																			comment.commentS_createdAt
																	)}
																</span>
															</>
														)}
													</div>
												</div>
											);
										})}
										<div ref={commentsEndRef} />
									</div>
								) : (
									<div className="py-8 text-center text-gray-500 dark:text-gray-400">
										<p>No comments yet</p>
										<p className="mt-1 text-xs">Be the first to comment!</p>
									</div>
								)}
							</div>
						</div>

						{/* Bottom sheet footer input */}
						<div className="fixed inset-x-0 bottom-0 z-[10002] p-4 bg-white border-t dark:bg-[#1f1f1f] dark:border-gray-700">
							<form
								onSubmit={handleSubmitComment}
								className="flex items-center"
							>
								<input
									type="text"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment..."
									className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#282828] dark:border-gray-600 dark:text-white"
									disabled={submitting}
								/>
								<button
									type="submit"
									className="p-2 ml-2 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
									disabled={submitting || !commentText.trim()}
								>
									{submitting ? (
										<div className="w-5 h-5 rounded-full border-2 border-green-500 animate-spin border-t-transparent"></div>
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
				)}
			</div>
		</div>
	);
}
