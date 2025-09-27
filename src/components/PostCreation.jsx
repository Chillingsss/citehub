import React, { useState } from "react";
import { createPost } from "../utils/faculty";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { COOKIE_KEY, COOKIE_SECRET_KEY } from "../utils/apiConfig";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

export default function PostCreation({ userId, onPostCreated, profile }) {
	const [caption, setCaption] = useState("");
	const [selectedImages, setSelectedImages] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);
	const [isPosting, setIsPosting] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const navigate = useNavigate();

	// Extract userLevel from cookies
	const getUserLevel = () => {
		try {
			const encrypted = Cookies.get(COOKIE_KEY);
			if (encrypted) {
				const bytes = CryptoJS.AES.decrypt(encrypted, COOKIE_SECRET_KEY);
				const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
				return user?.userLevel || "";
			}
		} catch (error) {
			console.error("Error extracting userLevel from cookies:", error);
		}
		return "";
	};

	// Image compression utility
	const compressImage = (file, maxSizeKB = 500, quality = 0.8) => {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				// Calculate new dimensions to maintain aspect ratio
				let { width, height } = img;
				const maxDimension = 1920; // Max width/height

				if (width > height && width > maxDimension) {
					height = (height * maxDimension) / width;
					width = maxDimension;
				} else if (height > maxDimension) {
					width = (width * maxDimension) / height;
					height = maxDimension;
				}

				canvas.width = width;
				canvas.height = height;

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);

				// Try different quality levels until we get under maxSizeKB
				let currentQuality = quality;
				const tryCompress = () => {
					canvas.toBlob(
						(blob) => {
							if (blob.size <= maxSizeKB * 1024 || currentQuality <= 0.1) {
								// Create a new File object with the compressed blob
								const compressedFile = new File([blob], file.name, {
									type: file.type,
									lastModified: Date.now(),
								});
								resolve(compressedFile);
							} else {
								currentQuality -= 0.1;
								tryCompress();
							}
						},
						file.type,
						currentQuality
					);
				};

				tryCompress();
			};

			img.src = URL.createObjectURL(file);
		});
	};

	const handleImageChange = async (e) => {
		console.log("Image change event triggered:", e.target.files);
		if (e.target.files && e.target.files.length > 0) {
			const newFiles = Array.from(e.target.files);
			console.log(
				"New files selected:",
				newFiles.map((f) => ({
					name: f.name,
					size: f.size,
					type: f.type,
				}))
			);

			// Compress images if they're over 500KB
			const compressedFiles = await Promise.all(
				newFiles.map(async (file) => {
					if (file.size > 500 * 1024) {
						// If file is over 500KB
						console.log(
							`Compressing ${file.name} from ${(file.size / 1024).toFixed(2)}KB`
						);
						const compressed = await compressImage(file, 500);
						console.log(
							`Compressed ${file.name} to ${(compressed.size / 1024).toFixed(
								2
							)}KB`
						);
						return compressed;
					}
					return file;
				})
			);

			const newPreviews = compressedFiles.map((file) =>
				URL.createObjectURL(file)
			);
			console.log("Generated preview URLs:", newPreviews);

			setSelectedImages([...selectedImages, ...compressedFiles]);
			setImagePreviews([...imagePreviews, ...newPreviews]);
			setIsExpanded(true);

			console.log("Updated state - selectedImages:", [
				...selectedImages,
				...compressedFiles,
			]);
			console.log("Updated state - imagePreviews:", [
				...imagePreviews,
				...newPreviews,
			]);
		}
	};

	const removeImage = (index) => {
		const newSelectedImages = selectedImages.filter((_, i) => i !== index);
		const newImagePreviews = imagePreviews.filter((_, i) => i !== index);

		setSelectedImages(newSelectedImages);
		setImagePreviews(newImagePreviews);

		// Clean up the object URL to prevent memory leaks
		URL.revokeObjectURL(imagePreviews[index]);
	};

	const handlePost = async (e) => {
		e.preventDefault();
		console.log("Handle post called with:", {
			caption: caption.trim(),
			selectedImagesCount: selectedImages.length,
			selectedImages: selectedImages,
		});

		if (!caption.trim() && !selectedImages.length) {
			console.log("No caption or images, returning early");
			return;
		}

		setIsPosting(true);
		try {
			const userLevel = getUserLevel();
			console.log("Calling createPost with:", {
				userId,
				caption,
				selectedImages,
				userLevel,
			});

			const result = await createPost(
				userId,
				caption,
				selectedImages,
				userLevel
			);
			console.log("New post created:", result);
			console.log("User level:", userLevel);

			// Show success toast based on user level
			if (userLevel === "Student") {
				toast.success("Post successful but needs approval", {
					duration: 3000,
				});
			} else {
				toast.success("Post successful", {
					duration: 2000,
				});
			}

			// Reset form
			setCaption("");
			setSelectedImages([]);
			setImagePreviews([]);
			setIsExpanded(false);

			// Clean up object URLs
			imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));

			if (onPostCreated) {
				onPostCreated();
			}
		} catch (error) {
			console.error("Error creating post:", error);
			toast.error("Failed to create post. Please try again.", {
				duration: 3000,
			});
		} finally {
			setIsPosting(false);
		}
	};

	const handleTextareaClick = () => {
		setIsExpanded(true);
	};

	const handleCancel = () => {
		setCaption("");
		setSelectedImages([]);
		imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
		setImagePreviews([]);
		setIsExpanded(false);
	};

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

	return (
		<>
			<Toaster position="top-right" />
			<div className="p-2 lg:p-4 bg-gray-50 rounded-2xl shadow-sm dark:bg-[#282828]">
				<form onSubmit={handlePost}>
					{/* Header with Avatar */}
					<div className="flex items-center mb-3 lg:mb-4">
						<div
							className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-black dark:text-gray-200 bg-gray-400/50 rounded-full sm:w-10 sm:h-10 sm:text-sm cursor-pointer"
							onClick={(e) => handleProfileClick(userId, e)}
						>
							{`${profile?.user_name?.charAt(0) || ""}`}
						</div>
						<div className="flex-1">
							<textarea
								className={`w-full p-2 lg:p-3 text-gray-900 bg-gray-50 rounded-2xl border-0 resize-none placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 dark:bg-[#282828] dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-700/50 dark:focus:ring-blue-400 ${
									isExpanded ? "min-h-[100px]" : "min-h-[50px]"
								}`}
								placeholder={`What's new?`}
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
								onClick={handleTextareaClick}
								rows={isExpanded ? 4 : 2}
							/>
						</div>
					</div>

					{/* Image Previews */}
					{imagePreviews.length > 0 && (
						<div className="mb-3 lg:mb-4">
							<div className="grid grid-cols-2 gap-2 lg:gap-3 p-2 lg:p-4 bg-gray-50 rounded-xl sm:grid-cols-3 md:grid-cols-4 dark:bg-gray-700">
								{imagePreviews.map((preview, index) => (
									<div key={index} className="relative group">
										<img
											src={preview}
											alt={`Preview ${index + 1}`}
											className="object-cover w-full h-24 rounded-lg border border-gray-200 dark:border-gray-600"
										/>
										<button
											type="button"
											onClick={() => removeImage(index)}
											className="flex absolute -top-2 -right-2 justify-center items-center w-6 h-6 text-sm font-bold text-white bg-red-500 rounded-full shadow-lg transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-600"
											title="Remove image"
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div
						className={`transition-all duration-300 ${
							isExpanded
								? "max-h-20 opacity-100"
								: "overflow-hidden max-h-0 opacity-0"
						}`}
					>
						<div className="flex justify-between items-center pt-2 lg:pt-3 border-t border-gray-100 dark:border-gray-600">
							<div className="flex items-center space-x-3 lg:space-x-4">
								{/* Photo Upload */}
								<label className="flex items-center px-3 lg:px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
									<svg
										className="w-5 h-5 text-green-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span className="text-sm font-medium">Photo</span>
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
										className="hidden"
										onChange={handleImageChange}
										multiple
									/>
								</label>

								{/* Video Upload (placeholder for future) */}
								{/* <button
								type="button"
								className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								disabled
							>
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
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Video</span>
							</button> */}

								{/* Feeling/Activity (placeholder for future) */}
								{/* <button
								type="button"
								className="flex items-center px-4 py-2 space-x-2 text-gray-600 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								disabled
							>
								<svg
									className="w-5 h-5 text-yellow-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Feeling</span>
							</button> */}
							</div>

							{/* Post Actions */}
							<div className="flex items-center space-x-3">
								{isExpanded && (
									<button
										type="button"
										onClick={handleCancel}
										className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
									>
										Cancel
									</button>
								)}
								<button
									type="submit"
									disabled={
										isPosting || (!caption.trim() && !selectedImages.length)
									}
									className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
										isPosting || (!caption.trim() && !selectedImages.length)
											? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
											: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 dark:bg-blue-500 dark:hover:bg-blue-600"
									}`}
								>
									{isPosting ? (
										<div className="flex items-center space-x-2">
											<svg
												className="w-4 h-4 animate-spin"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											<span>Posting...</span>
										</div>
									) : (
										"Post"
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Simple action bar when not expanded */}
					{!isExpanded && (
						<div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-600">
							<div className="flex items-center space-x-6">
								<label className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 cursor-pointer hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400">
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
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span className="text-sm font-medium">Photo</span>
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
										className="hidden"
										onChange={handleImageChange}
										multiple
									/>
								</label>
								{/* <button
								type="button"
								className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
								disabled
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
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Video</span>
							</button>
							<button
								type="button"
								className="flex items-center space-x-2 text-gray-500 transition-colors duration-200 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
								disabled
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
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span className="text-sm font-medium opacity-50">Feeling</span>
							</button> */}
							</div>
						</div>
					)}
				</form>
			</div>
		</>
	);
}
