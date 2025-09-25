import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";
import { uploadWithAutoAuth } from "./googleDriveAuth";

export async function getProfile(userId) {
	if (!userId) throw new Error("No user_id provided");

	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "getProfile");
	formData.append("json", JSON.stringify({ user_id: userId }));

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data && Array.isArray(response.data)
		? response.data[0]
		: response.data;
}

export async function getPosts(userId = null) {
	const apiUrl = getDecryptedApiUrl();

	try {
		const regularPostsFormData = new FormData();
		regularPostsFormData.append("operation", "getPosts");
		if (userId) {
			regularPostsFormData.append("json", JSON.stringify({ user_id: userId }));
		}

		const regularPostsResponse = await axios.post(
			`${apiUrl}/faculty.php`,
			regularPostsFormData
		);

		const regularPosts =
			regularPostsResponse.data && Array.isArray(regularPostsResponse.data)
				? regularPostsResponse.data
				: [];

		return regularPosts;
	} catch (error) {
		console.error("Error in getPosts:", error);
		// Fallback to just regular posts if shared posts fetch fails
		const regularPostsFormData = new FormData();
		regularPostsFormData.append("operation", "getPosts");
		if (userId) {
			regularPostsFormData.append("json", JSON.stringify({ user_id: userId }));
		}
		const regularPostsResponse = await axios.post(
			`${apiUrl}/faculty.php`,
			regularPostsFormData
		);
		return regularPostsResponse.data && Array.isArray(regularPostsResponse.data)
			? regularPostsResponse.data
			: [];
	}
}

export async function getAllPosts(userId) {
	try {
		// Use the updated getPosts function which now includes both regular and shared posts with user reactions
		const allPosts = await getPosts(userId);

		// The getPosts function now handles user reactions for both regular and shared posts
		// so we don't need the additional logic here anymore
		return allPosts;
	} catch (error) {
		console.error("Error in getAllPosts:", error);
		// Fallback to getPosts if getAllPosts fails
		return await getPosts(userId);
	}
}

export async function getPostsWithUserReactions(userId) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "getPostsWithUserReactions");
	formData.append("json", JSON.stringify({ user_id: userId }));

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);

	const posts =
		response.data && Array.isArray(response.data) ? response.data : [];

	return posts;
}

export async function addReaction(userId, postId, reactionType) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "addReaction");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postId: postId,
			reactionType: reactionType,
		})
	);

	try {
		const response = await axios.post(`${apiUrl}/faculty.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding reaction:", error);
		return { success: false, error: error.message };
	}
}

export async function addSharedPostReaction(userId, postSId, reactionType) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "addSharedPostReaction");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postSId: postSId,
			reactionType: reactionType,
		})
	);

	try {
		const response = await axios.post(`${apiUrl}/faculty.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding shared post reaction:", error);
		return { success: false, error: error.message };
	}
}

export async function createPost(userId, caption, imageFiles, userLevel = "") {
	const apiUrl = getDecryptedApiUrl();

	// Upload images first
	const uploadedImages = [];
	if (imageFiles && imageFiles.length > 0) {
		for (let i = 0; i < imageFiles.length; i++) {
			try {
				console.log(
					`Uploading image ${i + 1}/${imageFiles.length}: ${imageFiles[i].name}`
				);

				const uploadResponse = await uploadWithAutoAuth(imageFiles[i]);

				if (uploadResponse.success) {
					// Store Drive fileId for future-proofing but backend expects fileName in DB
					const imageId = uploadResponse.fileId || uploadResponse.fileName;
					uploadedImages.push({
						fileName: imageId,
					});

					// Log compression info
					if (uploadResponse.compressed) {
						const originalSizeKB = Math.round(
							uploadResponse.originalFileSize / 1024
						);
						const compressedSizeKB = Math.round(uploadResponse.fileSize / 1024);
						console.log(
							`Image ${
								i + 1
							} compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB`
						);
					}

					console.log(`Image ${i + 1} uploaded successfully`);
				} else {
					console.error(
						`Upload failed for image ${i + 1}:`,
						uploadResponse.error
					);
					throw new Error(
						`Upload failed for image ${i + 1}: ${uploadResponse.error}`
					);
				}
			} catch (error) {
				console.error(`Error uploading image ${i + 1}:`, error);
				throw error; // Re-throw to stop the process
			}
		}
	} else {
		console.log("No images to upload");
	}

	const postFormData = new FormData();
	postFormData.append("operation", "createPost");
	postFormData.append(
		"json",
		JSON.stringify({
			userId: userId,
			caption: caption,
			images: uploadedImages,
			userLevel: userLevel,
		})
	);

	try {
		const response = await axios.post(`${apiUrl}/faculty.php`, postFormData);
		return response.data;
	} catch (error) {
		console.error("Error creating post:", error);
		console.error("Post creation error details:", {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		});
		throw error;
	}
}

export async function updatePost(
	userId,
	postId,
	caption,
	postType = "regular"
) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "updatePost");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postId: postId,
			caption: caption,
			postType: postType,
		})
	);

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}

export async function updatePostStatus(
	userId,
	postId,
	action,
	postType = "regular"
) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "updatePostStatus");
	formData.append(
		"json",
		JSON.stringify({
			userId,
			postId,
			action, // 'archive' or 'trash'
			postType,
		})
	);

	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}

// Faculty Attendance API Functions
export async function getStudentsInTribe(facultyId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentsInTribe");
		formData.append("json", JSON.stringify({ facultyId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				students: response.data,
			};
		}

		return {
			success: false,
			students: [],
		};
	} catch (error) {
		console.error("Error fetching students in tribe:", error);
		return {
			success: false,
			students: [],
		};
	}
}

export async function getAttendanceSessions() {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getAttendanceSessions");

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				sessions: response.data,
			};
		}

		return {
			success: false,
			sessions: [],
		};
	} catch (error) {
		console.error("Error fetching attendance sessions:", error);
		return {
			success: false,
			sessions: [],
		};
	}
}

export async function getTodayAttendance(facultyId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getTodayAttendance");
		formData.append("json", JSON.stringify({ facultyId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				records: response.data,
			};
		}

		return {
			success: false,
			records: [],
		};
	} catch (error) {
		console.error("Error fetching today's attendance:", error);
		return {
			success: false,
			records: [],
		};
	}
}

export async function processAttendance(facultyId, studentId, sessionId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "processAttendance");
		formData.append(
			"json",
			JSON.stringify({
				facultyId,
				studentId,
				sessionId,
			})
		);

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error processing attendance:", error);
		return {
			success: false,
			message: "Failed to process attendance",
		};
	}
}

// Tally Management Functions
export async function getActivities() {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActivities");

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				activities: response.data,
			};
		}

		return {
			success: false,
			activities: [],
		};
	} catch (error) {
		console.error("Error fetching activities:", error);
		return {
			success: false,
			activities: [],
		};
	}
}

export async function getActivityParticipants(activityId, facultyId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActivityParticipants");
		formData.append("json", JSON.stringify({ activityId, facultyId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				participants: response.data,
			};
		}

		return {
			success: false,
			participants: [],
		};
	} catch (error) {
		console.error("Error fetching activity participants:", error);
		return {
			success: false,
			participants: [],
		};
	}
}

export async function addActivityParticipant(facultyId, studentId, activityId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addActivityParticipant");
		formData.append(
			"json",
			JSON.stringify({
				facultyId,
				studentId,
				activityId,
			})
		);

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding activity participant:", error);
		return {
			success: false,
			message: "Failed to add participant",
		};
	}
}

export async function removeActivityParticipant(
	facultyId,
	studentId,
	activityId
) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "removeActivityParticipant");
		formData.append(
			"json",
			JSON.stringify({
				facultyId,
				studentId,
				activityId,
			})
		);

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error removing activity participant:", error);
		return {
			success: false,
			message: "Failed to remove participant",
		};
	}
}

// Faculty Scoring Functions
export async function getFacultyTribeScores(facultyId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getFacultyTribeScores");
		formData.append("json", JSON.stringify({ facultyId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				scores: response.data,
			};
		}

		return {
			success: false,
			scores: [],
		};
	} catch (error) {
		console.error("Error fetching faculty tribe scores:", error);
		return {
			success: false,
			scores: [],
		};
	}
}

export async function getFacultyTribeInfo(facultyId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getFacultyTribeInfo");
		formData.append("json", JSON.stringify({ facultyId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (response.data) {
			return {
				success: true,
				tribeInfo: response.data,
			};
		}

		return {
			success: false,
			tribeInfo: null,
		};
	} catch (error) {
		console.error("Error fetching faculty tribe info:", error);
		return {
			success: false,
			tribeInfo: null,
		};
	}
}

// Archive/Trash utilities
export async function getUserPostsByStatus(userId, status) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getUserPostsByStatus");
	formData.append("json", JSON.stringify({ user_id: userId, status }));
	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return Array.isArray(response.data) ? response.data : [];
}

export async function restorePost(
	userId,
	postId,
	postType = "regular",
	target = "archive"
) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "restorePost");
	formData.append("json", JSON.stringify({ userId, postId, postType, target }));
	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}

export async function deletePost(userId, postId, postType = "regular") {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "deletePost");
	formData.append("json", JSON.stringify({ userId, postId, postType }));
	const response = await axios.post(`${apiUrl}/faculty.php`, formData);
	return response.data;
}
