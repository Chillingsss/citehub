import React, { useState, useEffect } from "react";
import axios from "axios";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import { formatTimeAgo } from "../utils/student";

const ShareDetailsModal = ({
	postId,
	isOpen,
	onClose,
	triggerRef,
	postType = "regular",
}) => {
	const [shareDetails, setShareDetails] = useState(null);
	const [loading, setLoading] = useState(true);

	console.log("ShareDetailsModal props:", {
		postId,
		isOpen,
		onClose,
		postType,
	});

	const getShareDetails = async (postId, postType) => {
		if (!postId) return;

		try {
			const apiUrl = getDecryptedApiUrl();
			const formData = new FormData();

			if (postType === "shared") {
				formData.append("operation", "getSharedPostShareDetails");
				formData.append("json", JSON.stringify({ postId: postId }));
			} else {
				formData.append("operation", "getShareDetails");
				formData.append("json", JSON.stringify({ postId: postId }));
			}

			const response = await axios.post(`${apiUrl}/faculty.php`, formData);
			return response.data;
		} catch (error) {
			console.error("Error fetching share details:", error);
			return null;
		}
	};

	useEffect(() => {
		const fetchShareDetails = async () => {
			setLoading(true);
			const details = await getShareDetails(postId, postType);
			console.log("Raw share details response:", details);
			console.log("Type of details:", typeof details);

			// Parse if it's a string
			let parsedDetails = details;
			if (typeof details === "string") {
				try {
					parsedDetails = JSON.parse(details);
					console.log("Parsed share details:", parsedDetails);
				} catch (e) {
					console.error("Failed to parse share details:", e);
					parsedDetails = [];
				}
			}

			setShareDetails(parsedDetails);
			setLoading(false);
		};

		if (postId && isOpen) {
			fetchShareDetails();
		}
	}, [postId, isOpen, postType]);

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

		if (
			!shareDetails ||
			!Array.isArray(shareDetails) ||
			shareDetails.length === 0
		) {
			return (
				<div className="p-2 text-sm text-gray-500 dark:text-gray-400">
					No shares yet
				</div>
			);
		}

		const displayShares = shareDetails.slice(0, 10);
		const remainingCount = shareDetails.length - 10;

		return (
			<div className="space-y-2">
				<div className="flex gap-2 items-center mb-2">
					<svg
						className="w-4 h-4 text-blue-500"
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
					<span className="font-medium text-gray-700 dark:text-gray-300">
						Shares ({shareDetails.length})
					</span>
				</div>
				<div className="space-y-1">
					{displayShares.map((share, index) => (
						<div key={index} className="flex gap-2 items-center">
							<div className="flex justify-center items-center w-6 h-6 text-xs font-semibold text-black bg-gray-400/50 rounded-full sm:w-6 sm:h-6 sm:text-sm">
								{`${share?.name?.charAt(0) || ""}`}
							</div>
							<span className="text-sm text-gray-600 dark:text-gray-400">
								{share.name}
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
						<div className="flex gap-2 items-center">
							<svg
								className="w-5 h-5 text-blue-500"
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
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Shares
							</h3>
						</div>
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
						) : !shareDetails ||
						  !Array.isArray(shareDetails) ||
						  shareDetails.length === 0 ? (
							<div className="p-8 text-center text-gray-500 dark:text-gray-400">
								<div className="mb-2 text-4xl">📤</div>
								<p>No shares yet</p>
							</div>
						) : (
							<div className="space-y-3">
								<div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
									{shareDetails.length}{" "}
									{shareDetails.length === 1 ? "person has" : "people have"}{" "}
									shared this post
								</div>
								{shareDetails.map((share, index) => (
									<div
										key={index}
										className="flex gap-3 items-start p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<div className="flex justify-center items-center w-10 h-10 text-sm font-semibold text-black bg-gray-400/50 rounded-full">
											{`${share?.name?.charAt(0) || ""}`}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{share.name}
												</span>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													{formatTimeAgo(share.createdAt)}
												</span>
											</div>
											{share.caption && (
												<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
													"{share.caption}"
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default ShareDetailsModal;
