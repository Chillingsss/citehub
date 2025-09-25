import React, { useState, useEffect } from "react";
import axios from "axios";
import { getDecryptedApiUrl } from "../utils/apiConfig";

const ReactionDetailsModal = ({
	postId,
	isOpen,
	onClose,
	triggerRef,
	postType = "regular",
}) => {
	const [reactionDetails, setReactionDetails] = useState(null);
	const [loading, setLoading] = useState(true);

	console.log("ReactionDetailsModal props:", {
		postId,
		isOpen,
		onClose,
		postType,
	});

	const getReactionDetails = async (postId, postType) => {
		if (!postId) return;

		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();

			if (postType === "shared") {
				formData.append("operation", "getSharedPostReactionDetails");
				formData.append("json", JSON.stringify({ postId: postId }));
			} else {
				formData.append("operation", "getReactionDetails");
				formData.append("json", JSON.stringify({ postId: postId }));
			}

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);
			return response.data;
		} catch (error) {
			console.error("Error fetching reaction details:", error);
			return null;
		}
	};

	useEffect(() => {
		const fetchReactionDetails = async () => {
			setLoading(true);
			const details = await getReactionDetails(postId, postType);
			console.log("Raw reaction details response:", details);
			console.log("Type of details:", typeof details);

			// Parse if it's a string
			let parsedDetails = details;
			if (typeof details === "string") {
				try {
					parsedDetails = JSON.parse(details);
					console.log("Parsed reaction details:", parsedDetails);
				} catch (e) {
					console.error("Failed to parse reaction details:", e);
					parsedDetails = {};
				}
			}

			setReactionDetails(parsedDetails);
			setLoading(false);
		};

		if (postId && isOpen) {
			fetchReactionDetails();
		}
	}, [postId, isOpen, postType]);

	const getReactionEmoji = (type) => {
		switch (type) {
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

	const getReactionColor = (type) => {
		switch (type) {
			case "like":
				return "text-blue-500";
			case "love":
				return "text-red-500";
			case "haha":
				return "text-yellow-500";
			case "sad":
				return "text-blue-400";
			case "angry":
				return "text-red-600";
			case "wow":
				return "text-purple-500";
			default:
				return "text-gray-500";
		}
	};

	// If not open, don't render anything
	if (!isOpen) return null;

	// Check if this is a hover display (no backdrop) or modal display
	const isHoverDisplay = !onClose;

	// Hover display (inline content)
	if (isHoverDisplay) {
		if (loading) {
			return (
				<div className="flex justify-center items-center p-4">
					<div className="w-6 h-6 rounded-full border-b-2 border-blue-500 animate-spin"></div>
				</div>
			);
		}

		if (!reactionDetails || Object.keys(reactionDetails).length === 0) {
			return (
				<div className="p-2 text-sm text-gray-500 dark:text-gray-400">
					No reactions yet
				</div>
			);
		}

		return (
			<div className="space-y-3">
				{Object.entries(reactionDetails).map(([reactionType, users]) => {
					const displayUsers = Array.isArray(users) ? users.slice(0, 10) : [];
					const remainingCount = Array.isArray(users) ? users.length - 10 : 0;

					return (
						<div key={reactionType} className="space-y-2">
							<div className="flex gap-2 items-center">
								<span className="text-lg">
									{getReactionEmoji(reactionType)}
								</span>
								<span className="font-medium text-gray-700 capitalize dark:text-gray-300">
									{reactionType}
								</span>
							</div>
							<div className="ml-6 space-y-1">
								{displayUsers.map((user, index) => (
									<div key={index} className="flex gap-2 items-center">
										<div className="flex justify-center items-center w-6 h-6 text-xs font-semibold text-black bg-gray-400/50 rounded-full sm:w-6 sm:h-6 sm:text-sm">
											{`${user?.name?.charAt(0) || ""}`}
										</div>
										<span className="text-sm text-gray-600 dark:text-gray-400">
											{user.name}
										</span>
									</div>
								))}
								{remainingCount > 0 && (
									<div className="flex gap-2 items-center">
										<div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
											<span className="text-xs text-gray-600 dark:text-gray-300">
												+
											</span>
										</div>
										<span className="text-sm text-gray-500 dark:text-gray-400">
											+{remainingCount} more
										</span>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		);
	}

	// Modal display (full screen)
	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black bg-opacity-50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="flex fixed inset-0 z-50 justify-center items-center p-4">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden">
					{/* Header */}
					<div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Reactions
						</h3>
						<button
							onClick={onClose}
							className="p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
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

					{/* Content */}
					<div className="p-4 overflow-y-auto max-h-[70vh]">
						{loading ? (
							<div className="flex justify-center items-center p-8">
								<div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin"></div>
							</div>
						) : !reactionDetails ||
						  Object.keys(reactionDetails).length === 0 ? (
							<div className="p-8 text-center text-gray-500 dark:text-gray-400">
								<div className="mb-2 text-4xl">😢</div>
								<p>No reactions yet</p>
							</div>
						) : (
							<div className="space-y-4">
								{Object.entries(reactionDetails).map(
									([reactionType, users]) => (
										<div key={reactionType} className="space-y-3">
											<div className="flex gap-3 items-center">
												<span className="text-2xl">
													{getReactionEmoji(reactionType)}
												</span>
												<span
													className={`font-semibold capitalize ${getReactionColor(
														reactionType
													)}`}
												>
													{reactionType}
												</span>
												<span className="text-sm text-gray-500 dark:text-gray-400">
													({Array.isArray(users) ? users.length : 0}{" "}
													{Array.isArray(users) && users.length === 1
														? "person"
														: "people"}
													)
												</span>
											</div>
											<div className="ml-8 space-y-2">
												{Array.isArray(users) &&
													users.map((user, index) => (
														<div
															key={index}
															className="flex gap-3 items-center p-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
														>
															<div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-black bg-gray-400/50 rounded-full sm:w-8 sm:h-8 sm:text-sm">
																{`${user?.name?.charAt(0) || ""}`}
															</div>
															<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																{user.name}
															</span>
														</div>
													))}
											</div>
										</div>
									)
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default ReactionDetailsModal;
