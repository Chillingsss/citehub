import React, { useEffect, useState } from "react";
import {
	getUserPostsByStatus,
	restorePost,
	deletePost,
} from "../utils/faculty";
import { getDecryptedApiUrl } from "../utils/apiConfig";
import ConfirmationDialog from "./ui/ConfirmationDialog";

export default function ArchiveTrashModal({
	isOpen,
	onClose,
	userId,
	initialTab = "archive",
	onRestored,
}) {
	const [activeTab, setActiveTab] = useState(initialTab); // 'archive' | 'trash'
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setActiveTab(initialTab);
		}
	}, [isOpen, initialTab]);

	useEffect(() => {
		if (!isOpen || !userId) return;
		setLoading(true);
		getUserPostsByStatus(userId, activeTab)
			.then((data) => setItems(data))
			.finally(() => setLoading(false));
	}, [isOpen, userId, activeTab]);

	const handleRestore = async (item) => {
		const postType = item.post_type === "shared" ? "shared" : "regular";
		const postId = postType === "shared" ? item.postS_id : item.post_id;
		const result = await restorePost(userId, postId, postType, activeTab);
		if (result?.success) {
			// remove from list
			setItems((prev) =>
				prev.filter((p) =>
					postType === "shared" ? p.postS_id !== postId : p.post_id !== postId
				)
			);
			if (onRestored) onRestored();
		}
	};

	const handleDelete = (item) => {
		setItemToDelete(item);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (!itemToDelete || isDeleting) return;

		setIsDeleting(true);

		try {
			const postType =
				itemToDelete.post_type === "shared" ? "shared" : "regular";
			const postId =
				postType === "shared" ? itemToDelete.postS_id : itemToDelete.post_id;
			const result = await deletePost(userId, postId, postType);

			if (result?.success) {
				// remove from list
				setItems((prev) =>
					prev.filter((p) =>
						postType === "shared" ? p.postS_id !== postId : p.post_id !== postId
					)
				);
				if (onRestored) onRestored(); // refresh parent component
			} else {
				alert(result?.message || "Failed to delete post");
			}
		} catch (error) {
			console.error("Error deleting post:", error);
			alert("An error occurred while deleting the post. Please try again.");
		} finally {
			setIsDeleting(false);
			// Close dialog and reset state
			setShowDeleteDialog(false);
			setItemToDelete(null);
		}
	};

	const cancelDelete = () => {
		if (isDeleting) return; // Prevent closing while deleting
		setShowDeleteDialog(false);
		setItemToDelete(null);
	};

	const renderImages = (imageFiles, item) => {
		if (!imageFiles) return null;
		const images = imageFiles.split(",");
		const first = (images[0] || "").trim();
		const uploadTypes = item.image_upload_types
			? item.image_upload_types.split(",")
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
				return url3;
			}

			// Fallback to filename pattern detection for backward compatibility
			// If this looks like a Google Drive fileId (contains underscore and timestamp pattern)
			if (trimmed && trimmed.includes("_") && trimmed.length >= 15) {
				return `https://drive.google.com/uc?id=${trimmed}`;
			}
			// If this looks like a Google Drive fileId (no dot extension, 25+ chars typical)
			if (trimmed && trimmed.indexOf(".") === -1 && trimmed.length >= 20) {
				return `https://drive.google.com/uc?id=${trimmed}`;
			}
			// Else assume legacy local upload filename
			return `${getDecryptedApiUrl()}/uploads/${trimmed}`;
		};

		const url = toUrl(first, 0);

		return (
			<img
				src={url}
				alt="thumb"
				className="w-16 h-16 object-cover rounded-md border"
				onError={(e) => {
					console.error("Image failed to load:", url, e);
					// Try fallback URL if the first one fails
					if (uploadTypes[0] === "google_drive") {
						e.target.src = `https://drive.google.com/uc?id=${first}`;
					}
				}}
			/>
		);
	};

	return (
		<div
			className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
			aria-hidden={!isOpen}
		>
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-black transition-opacity ${
					isOpen ? "bg-opacity-30" : "bg-opacity-0"
				}`}
				onClick={onClose}
			/>

			{/* Left Drawer */}
			<div
				className={`absolute left-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#1f1f1f] shadow-xl transform transition-transform ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
					<div className="flex items-center gap-3">
						<button
							className={`px-3 py-1 rounded-md text-sm ${
								activeTab === "archive"
									? "bg-blue-600 text-white"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
							}`}
							onClick={() => setActiveTab("archive")}
						>
							Archive
						</button>
						<button
							className={`px-3 py-1 rounded-md text-sm ${
								activeTab === "trash"
									? "bg-blue-600 text-white"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
							}`}
							onClick={() => setActiveTab("trash")}
						>
							Trash
						</button>
					</div>
					<button
						className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
						onClick={onClose}
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
				</div>

				<div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
					{loading ? (
						<div className="text-center text-gray-500 dark:text-gray-400">
							Loading...
						</div>
					) : items.length === 0 ? (
						<div className="text-center text-gray-500 dark:text-gray-400">
							No items found.
						</div>
					) : (
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={
										item.post_type === "shared"
											? `s-${item.postS_id}`
											: `r-${item.post_id}`
									}
									className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border dark:border-gray-700"
								>
									{renderImages(item.image_files, item)}
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
											{item.post_caption || "(no caption)"}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{new Date(item.post_createdAt).toLocaleString("en-PH", {
												timeZone: "Asia/Manila",
												year: "numeric",
												month: "short",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
												hour12: true,
											})}
											<span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
												{item.post_type}
											</span>
										</div>
									</div>
									{activeTab === "archive" && (
										<button
											onClick={() => handleRestore(item)}
											className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
										>
											Restore
										</button>
									)}
									{activeTab === "trash" && (
										<div className="flex gap-2">
											<button
												onClick={() => handleRestore(item)}
												className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
											>
												Restore
											</button>
											<button
												onClick={() => handleDelete(item)}
												className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
											>
												Delete
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={showDeleteDialog}
				onClose={cancelDelete}
				onConfirm={confirmDelete}
				title="Delete Post"
				message="Are you sure you want to permanently delete this post? This action cannot be undone and will remove all associated images from Google Drive."
				confirmText="Delete"
				cancelText="Cancel"
				type="danger"
				isLoading={isDeleting}
				loadingText="Deleting..."
			/>
		</div>
	);
}
