import React, { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import RecentPostsList from "./admin/RecentPostsList";
import ImageModal from "./ImageModal";
import { getDecryptedApiUrl } from "../utils/apiConfig";

export default function RightSidebar({ posts, userId }) {
	const [selectedPost, setSelectedPost] = useState(null);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentImageSet, setCurrentImageSet] = useState([]);
	const [isExpanded, setIsExpanded] = useState(false);

	const handlePostClick = (post) => {
		// Split the image_files string into an array if it exists
		const images = post.image_files
			? post.image_files.split(",").map((img, index) => {
					const trimmed = (img || "").trim();
					const uploadTypes = post.image_upload_types
						? post.image_upload_types.split(",")
						: [];
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
			  })
			: [];

		setSelectedPost(post);
		setCurrentImageSet(images);
		setCurrentImageIndex(0);
		setSelectedImage(images.length > 0 ? images[0] : null);
		setIsImageModalOpen(true);
	};

	const handlePrevImage = () => {
		if (currentImageIndex > 0) {
			setCurrentImageIndex((prev) => prev - 1);
			setSelectedImage(currentImageSet[currentImageIndex - 1]);
		}
	};

	const handleNextImage = () => {
		if (currentImageIndex < currentImageSet.length - 1) {
			setCurrentImageIndex((prev) => prev + 1);
			setSelectedImage(currentImageSet[currentImageIndex + 1]);
		}
	};

	const handleZoomIn = () => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
	};

	const handleResetZoom = () => {
		setZoomLevel(1);
	};

	const handleCloseModal = () => {
		setIsImageModalOpen(false);
		setSelectedPost(null);
		setSelectedImage(null);
		setZoomLevel(1);
		setCurrentImageIndex(0);
		setCurrentImageSet([]);
	};

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	// Count posts for display (only Faculty and Admin posts)
	const postCount = posts
		? posts.filter(
				(post) => post.userL_name === "Faculty" || post.userL_name === "Admin"
		  ).length
		: 0;

	return (
		<>
			{/* Mobile Collapsible Header */}
			<div className="lg:hidden">
				<button
					onClick={toggleExpanded}
					className="flex justify-between items-center w-full p-3 bg-gray-50 rounded-xl dark:bg-[#282828] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
							<MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
						</div>
						<div className="text-left">
							<h3 className="font-medium text-gray-800 dark:text-gray-200">
								Community
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{postCount} recent posts
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
							{postCount}
						</span>
						{isExpanded ? (
							<ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						) : (
							<ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						)}
					</div>
				</button>

				{/* Collapsible Content */}
				{isExpanded && (
					<div className="mt-2 p-3 bg-gray-50 rounded-xl dark:bg-[#282828]">
						<div className="mb-3">
							<h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
								Recent Posts
							</h4>
							<div className="max-h-72 overflow-y-auto no-scrollbar">
								<RecentPostsList posts={posts} onPostClick={handlePostClick} />
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex flex-col p-6 mt-4 w-64 bg-gray-50 rounded-2xl shadow-sm dark:bg-[#282828] sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
				<div className="mb-6">
					<h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
						Community
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Connect with colleagues
					</p>
				</div>
				<div className="flex gap-3 items-center mb-3">
					<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
						<MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="font-medium text-gray-800 dark:text-gray-200">
						Recent Posts
					</h3>
				</div>
				<div className="max-h-96 overflow-y-auto no-scrollbar">
					<RecentPostsList posts={posts} onPostClick={handlePostClick} />
				</div>
			</aside>

			{selectedPost && (
				<ImageModal
					isOpen={isImageModalOpen}
					onClose={handleCloseModal}
					selectedPost={selectedPost}
					selectedImage={selectedImage}
					currentImageIndex={currentImageIndex}
					currentImageSet={currentImageSet}
					zoomLevel={zoomLevel}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					onResetZoom={handleResetZoom}
					onPrevImage={handlePrevImage}
					onNextImage={handleNextImage}
					userId={userId}
				/>
			)}
		</>
	);
}
