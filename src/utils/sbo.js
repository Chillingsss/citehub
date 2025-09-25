import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

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

	const response = await axios.post(`${apiUrl}/sbo.php`, formData);
	return response.data;
}

export async function createPost(userId, caption, imageFiles) {
	const apiUrl = getDecryptedApiUrl();

	console.log("SBO createPost called with:", {
		userId,
		caption,
		imageFilesCount: imageFiles ? imageFiles.length : 0,
		imageFiles: imageFiles,
	});

	// Upload images first
	const uploadedImages = [];
	if (imageFiles && imageFiles.length > 0) {
		console.log("Starting SBO image upload process...");
		for (let i = 0; i < imageFiles.length; i++) {
			console.log(`SBO uploading image ${i + 1}/${imageFiles.length}:`, {
				name: imageFiles[i].name,
				size: imageFiles[i].size,
				type: imageFiles[i].type,
			});

			const formData = new FormData();
			formData.append("file", imageFiles[i]);

			try {
				console.log(`SBO sending upload request for image ${i + 1}...`);
				const uploadResponse = await axios.post(
					`${apiUrl}/upload.php`,
					formData
				);

				console.log(
					`SBO upload response for image ${i + 1}:`,
					uploadResponse.data
				);

				if (uploadResponse.data.success) {
					const imageId =
						uploadResponse.data.fileId || uploadResponse.data.fileName;
					uploadedImages.push({
						fileName: imageId,
					});
					console.log(`SBO successfully uploaded image ${i + 1}, ID:`, imageId);
				} else if (
					uploadResponse.data.requiresAuth &&
					uploadResponse.data.authUrl
				) {
					console.warn(
						"Google Drive authorization required. Open this URL once and retry:",
						uploadResponse.data.authUrl
					);
					console.warn("SBO OAuth debug info:", uploadResponse.data.debug);
					throw new Error("Google Drive authorization required");
				} else {
					console.error(
						`SBO upload failed for image ${i + 1}:`,
						uploadResponse.data.error
					);
					console.error("SBO upload debug info:", uploadResponse.data.debug);
				}
			} catch (error) {
				console.error(`SBO error uploading image ${i + 1}:`, error);
				console.error("SBO error details:", {
					message: error.message,
					response: error.response?.data,
					status: error.response?.status,
				});
			}
		}
		console.log(
			"SBO image upload process completed. Uploaded images:",
			uploadedImages
		);
	} else {
		console.log("SBO: No images to upload");
	}

	// Create post with uploaded images
	console.log("SBO creating post with data:", {
		userId,
		caption,
		images: uploadedImages,
	});

	const postFormData = new FormData();
	postFormData.append("operation", "createPost");
	postFormData.append(
		"json",
		JSON.stringify({
			userId: userId,
			caption: caption,
			images: uploadedImages,
		})
	);

	try {
		const response = await axios.post(`${apiUrl}/sbo.php`, postFormData);
		console.log("SBO post creation response:", response.data);
		return response.data;
	} catch (error) {
		console.error("SBO error creating post:", error);
		console.error("SBO post creation error details:", {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		});
		throw error;
	}
}

export async function updatePost(userId, postId, caption) {
	const apiUrl = getDecryptedApiUrl();

	const formData = new FormData();
	formData.append("operation", "updatePost");
	formData.append(
		"json",
		JSON.stringify({
			userId: userId,
			postId: postId,
			caption: caption,
		})
	);

	const response = await axios.post(`${apiUrl}/sbo.php`, formData);
	return response.data;
}

// SBO Attendance API Functions
export async function getAllTribes() {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getAllTribes");

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				tribes: response.data,
			};
		}

		return {
			success: false,
			tribes: [],
		};
	} catch (error) {
		console.error("Error fetching tribes:", error);
		return {
			success: false,
			tribes: [],
		};
	}
}

export async function getStudentsInTribe(tribeId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentsInTribe");
		formData.append("json", JSON.stringify({ tribeId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

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

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

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

export async function getTodayAttendance(sboId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getTodayAttendance");
		formData.append("json", JSON.stringify({ sboId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		console.log("response", response.data);

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
		console.error("Error fetching attendance records:", error);
		return {
			success: false,
			records: [],
		};
	}
}

export async function processAttendance(sboId, studentId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "processAttendance");
		formData.append(
			"json",
			JSON.stringify({
				sboId,
				studentId,
			})
		);

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error processing attendance:", error);
		return {
			success: false,
			message: "Failed to process attendance",
		};
	}
}

// SBO Tally/Scoring Functions
export async function getSboActivities(sboId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getSboActivities");
		formData.append("json", JSON.stringify({ sboId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

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
		console.error("Error fetching SBO activities:", error);
		return {
			success: false,
			activities: [],
		};
	}
}

export async function getActivityPointRules(activityId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActivityPointRules");
		formData.append("json", JSON.stringify({ activityId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				pointRules: response.data,
			};
		}

		return {
			success: false,
			pointRules: [],
		};
	} catch (error) {
		console.error("Error fetching activity point rules:", error);
		return {
			success: false,
			pointRules: [],
		};
	}
}

export async function getActivityScores(activityId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActivityScores");
		formData.append("json", JSON.stringify({ activityId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

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
		console.error("Error fetching activity scores:", error);
		return {
			success: false,
			scores: [],
		};
	}
}

export async function addScore(
	sboId,
	activityId,
	tribeId,
	pointRuleId,
	isParticipation = false
) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addScore");
		formData.append(
			"json",
			JSON.stringify({
				sboId,
				activityId,
				tribeId,
				pointRuleId,
				isParticipation,
			})
		);

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding score:", error);
		return {
			success: false,
			message: "Failed to add score",
		};
	}
}

export async function removeScore(sboId, scoreId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "removeScore");
		formData.append(
			"json",
			JSON.stringify({
				sboId,
				scoreId,
			})
		);

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error removing score:", error);
		return {
			success: false,
			message: "Failed to remove score",
		};
	}
}

// Student Participation Management Functions
export async function getActivityParticipants(activityId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActivityParticipants");
		formData.append("json", JSON.stringify({ activityId }));

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);

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

export async function updateStudentParticipation(
	sboId,
	activityId,
	studentId,
	status
) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "updateStudentParticipation");
		formData.append(
			"json",
			JSON.stringify({
				sboId,
				activityId,
				studentId,
				status,
			})
		);

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error updating student participation:", error);
		return {
			success: false,
			message: "Failed to update participation status",
		};
	}
}

export async function addStudentToActivity(sboId, activityId, studentId) {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addStudentToActivity");
		formData.append(
			"json",
			JSON.stringify({
				sboId,
				activityId,
				studentId,
			})
		);

		const response = await axios.post(`${apiUrl}/sbo.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding student to activity:", error);
		return {
			success: false,
			message: "Failed to add student to activity",
		};
	}
}
