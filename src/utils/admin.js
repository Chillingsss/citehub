import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export async function getUserLevel() {
	const formData = new FormData();
	formData.append("operation", "getUserLevel");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addUser(userData) {
	const formData = new FormData();
	formData.append("operation", "addUser");
	formData.append("json", JSON.stringify(userData));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getUsers() {
	const formData = new FormData();
	formData.append("operation", "getUsers");

	const apiUrl = getDecryptedApiUrl();
	console.log("apiUrl", apiUrl);

	try {
		// const response = await axios.post(`${apiUrl}/admin.php`, formData, {
		// 	headers: { "Content-Type": "multipart/form-data" },
		// });
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		console.log("response", response);
		return response.data;
	} catch (error) {
		console.log("Error:", error);
		throw error;
	}
}

export async function verifyPin(userId, pin) {
	const formData = new FormData();
	formData.append("operation", "verifyPin");
	formData.append("json", JSON.stringify({ userId, pin }));

	// Get the encrypted API URL from session storage
	const apiUrl = getDecryptedApiUrl();
	console.log("apiUrl", apiUrl);

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		console.log("Error:", error);
		throw error;
	}
}

export async function getGradeLevel() {
	const formData = new FormData();
	formData.append("operation", "getGradelevel");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRequestStats() {
	const formData = new FormData();
	formData.append("operation", "getRequestStats");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getCompletedRequests() {
	const formData = new FormData();
	formData.append("operation", "getCompletedRequests");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getRecentActivity() {
	const formData = new FormData();
	formData.append("operation", "getRecentActivity");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getTotalUsers() {
	const formData = new FormData();
	formData.append("operation", "getTotalUsers");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// User Management
export async function updateUser(userData) {
	const formData = new FormData();
	formData.append("operation", "updateUser");
	formData.append("json", JSON.stringify(userData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// New functions for attendance session management
export async function getAttendanceSessions() {
	const formData = new FormData();
	formData.append("operation", "getAttendanceSessions");

	const apiUrl = getDecryptedApiUrl();
	console.log("Making attendance sessions request to:", apiUrl);

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("Attendance sessions response:", response.data);
		return response.data;
	} catch (error) {
		console.error("Attendance sessions error details:", {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		});
		throw error;
	}
}

export async function updateAttendanceSessionStatus(sessionData) {
	const formData = new FormData();
	formData.append("operation", "updateAttendanceSessionStatus");
	formData.append("json", JSON.stringify(sessionData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Event Management Functions
export async function getEvents() {
	const formData = new FormData();
	formData.append("operation", "getEvents");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addEvent(eventData) {
	const formData = new FormData();
	formData.append("operation", "addEvent");
	formData.append("json", JSON.stringify(eventData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getActivities(eventId) {
	const formData = new FormData();
	formData.append("operation", "getActivities");
	formData.append("json", JSON.stringify({ eventId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addActivity(activityData) {
	const formData = new FormData();
	formData.append("operation", "addActivity");
	formData.append("json", JSON.stringify(activityData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getPointRules(activityId) {
	const formData = new FormData();
	formData.append("operation", "getPointRules");
	formData.append("json", JSON.stringify({ activityId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addPointRule(pointRuleData) {
	const formData = new FormData();
	formData.append("operation", "addPointRule");
	formData.append("json", JSON.stringify(pointRuleData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getScorekeepers() {
	const formData = new FormData();
	formData.append("operation", "getScorekeepers");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Update Functions
export async function updateEvent(eventData) {
	const formData = new FormData();
	formData.append("operation", "updateEvent");
	formData.append("json", JSON.stringify(eventData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function updateActivity(activityData) {
	const formData = new FormData();
	formData.append("operation", "updateActivity");
	formData.append("json", JSON.stringify(activityData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function updatePointRule(pointRuleData) {
	const formData = new FormData();
	formData.append("operation", "updatePointRule");
	formData.append("json", JSON.stringify(pointRuleData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Year Level Management
export async function getYearLevels() {
	const formData = new FormData();
	formData.append("operation", "getYearLevels");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// User Level Management
export async function getUserLevels() {
	const formData = new FormData();
	formData.append("operation", "getUserLevels");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addUserLevel(userLevelData) {
	const formData = new FormData();
	formData.append("operation", "addUserLevel");
	formData.append("json", JSON.stringify(userLevelData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function updateUserLevel(userLevelData) {
	const formData = new FormData();
	formData.append("operation", "updateUserLevel");
	formData.append("json", JSON.stringify(userLevelData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function deleteUserLevel(userLevelId) {
	const formData = new FormData();
	formData.append("operation", "deleteUserLevel");
	formData.append("json", JSON.stringify({ userLevelId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Tribe Management
export async function getTribes() {
	const formData = new FormData();
	formData.append("operation", "getTribes");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Excel Import Management
export async function importUsersFromExcel(importData) {
	const formData = new FormData();
	formData.append("operation", "importUsersFromExcel");
	formData.append("json", JSON.stringify(importData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// User Tribe Management
export async function updateUserTribe(userId, tribeId) {
	const formData = new FormData();
	formData.append("operation", "updateUser");
	formData.append(
		"json",
		JSON.stringify({ currentUserId: userId, tribeId: tribeId })
	);

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Tribe Rankings
export async function getTribeActivities(tribeId) {
	const formData = new FormData();
	formData.append("operation", "getTribeActivities");
	formData.append("json", JSON.stringify({ tribeId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getAllTribesRanking(eventTitle = null) {
	const formData = new FormData();
	formData.append("operation", "getAllTribesRanking");

	if (eventTitle) {
		formData.append("json", JSON.stringify({ eventTitle }));
	}

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Post Sharing Functions
export async function sharePost(postId, userId, caption) {
	const formData = new FormData();
	formData.append("operation", "sharePost");
	formData.append("json", JSON.stringify({ postId, userId, caption }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function getSharedPosts() {
	const formData = new FormData();
	formData.append("operation", "getSharedPosts");

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function addTribe(tribeData) {
	const formData = new FormData();
	formData.append("operation", "addTribe");
	formData.append("json", JSON.stringify(tribeData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function updateTribe(tribeData) {
	const formData = new FormData();
	formData.append("operation", "updateTribe");
	formData.append("json", JSON.stringify(tribeData));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function deleteTribe(tribeId) {
	const formData = new FormData();
	formData.append("operation", "deleteTribe");
	formData.append("json", JSON.stringify({ tribeId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function deleteActivity(activityId) {
	const formData = new FormData();
	formData.append("operation", "deleteActivity");
	formData.append("json", JSON.stringify({ activityId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function deletePointRule(pointRuleId) {
	const formData = new FormData();
	formData.append("operation", "deletePointRule");
	formData.append("json", JSON.stringify({ pointRuleId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

export async function deleteEvent(eventId) {
	const formData = new FormData();
	formData.append("operation", "deleteEvent");
	formData.append("json", JSON.stringify({ eventId }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Attendance Reports Function
export async function getAttendanceReports(filters) {
	const formData = new FormData();
	formData.append("operation", "getAttendanceReports");
	formData.append("json", JSON.stringify(filters));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		console.log("response", response);
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Reset Tribe Function
export async function resetUsersTribe(userLevel) {
	const formData = new FormData();
	formData.append("operation", "resetUsersTribe");
	formData.append("json", JSON.stringify({ userLevel }));

	const apiUrl = getDecryptedApiUrl();

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

// Post Approval Functions
export async function getPendingPosts() {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getPendingPosts");

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data && Array.isArray(response.data) ? response.data : [];
	} catch (error) {
		console.error("Error fetching pending posts:", error);
		return [];
	}
}

export async function approvePost(postId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "approvePost");
	formData.append("json", JSON.stringify({ postId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error approving post:", error);
		return { success: false, error: error.message };
	}
}

export async function rejectPost(postId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "rejectPost");
	formData.append("json", JSON.stringify({ postId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		const data = response.data;

		// Log Google Drive deletion results if available
		if (data.googleDriveResults) {
			console.log("Google Drive deletion results:", data.googleDriveResults);
		}

		return data;
	} catch (error) {
		console.error("Error rejecting post:", error);
		return { success: false, error: error.message };
	}
}

// Get Pending Posts Count Function
export async function getPendingPostsCount() {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getPendingPostsCount");

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching pending posts count:", error);
		return { success: false, error: error.message };
	}
}

// Evaluation Management Functions
export async function getEvaluations() {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluations");

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluations:", error);
		return { success: false, error: error.message };
	}
}

export async function addEvaluation(evaluationData) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "addEvaluation");
	formData.append("json", JSON.stringify(evaluationData));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error adding evaluation:", error);
		return { success: false, error: error.message };
	}
}

export async function updateEvaluation(evaluationData) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "updateEvaluation");
	formData.append("json", JSON.stringify(evaluationData));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error updating evaluation:", error);
		return { success: false, error: error.message };
	}
}

export async function deleteEvaluation(evalId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "deleteEvaluation");
	formData.append("json", JSON.stringify({ evalId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error deleting evaluation:", error);
		return { success: false, error: error.message };
	}
}

export async function getEvaluationQuestionTypes() {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluationQuestionTypes");

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluation question types:", error);
		return { success: false, error: error.message };
	}
}

export async function getEvaluationQuestions(evalId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluationQuestions");
	formData.append("json", JSON.stringify({ evalId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluation questions:", error);
		return { success: false, error: error.message };
	}
}

export async function addEvaluationQuestion(questionData) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "addEvaluationQuestion");
	formData.append("json", JSON.stringify(questionData));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		console.log("response", response.data);
		return response.data;
	} catch (error) {
		console.error("Error adding evaluation question:", error);
		return { success: false, error: error.message };
	}
}

export async function updateEvaluationQuestion(questionData) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "updateEvaluationQuestion");
	formData.append("json", JSON.stringify(questionData));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error updating evaluation question:", error);
		return { success: false, error: error.message };
	}
}

export async function deleteEvaluationQuestion(questionId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "deleteEvaluationQuestion");
	formData.append("json", JSON.stringify({ questionId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error deleting evaluation question:", error);
		return { success: false, error: error.message };
	}
}

export async function getEvaluationChoices(questionId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluationChoices");
	formData.append("json", JSON.stringify({ questionId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluation choices:", error);
		return { success: false, error: error.message };
	}
}

export async function getEvaluationQuestionAnalysis(questionId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluationQuestionAnalysis");
	formData.append("json", JSON.stringify({ questionId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluation question analysis:", error);
		return { success: false, error: error.message };
	}
}

export async function getEvaluationChoiceResponses(choiceId) {
	const apiUrl = getDecryptedApiUrl();
	const formData = new FormData();
	formData.append("operation", "getEvaluationChoiceResponses");
	formData.append("json", JSON.stringify({ choiceId }));

	try {
		const response = await axios.post(`${apiUrl}/admin.php`, formData);
		return response.data;
	} catch (error) {
		console.error("Error fetching evaluation choice responses:", error);
		return { success: false, error: error.message };
	}
}
