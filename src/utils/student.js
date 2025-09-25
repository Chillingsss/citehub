import axios from "axios";
import { getDecryptedApiUrl } from "./apiConfig";

export const getPendingPosts = async (userId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getPendingPosts");
		formData.append("json", JSON.stringify({ user_id: userId }));

		const response = await axios.post(`${apiUrl}/faculty.php`, formData);

		if (response.data) {
			return {
				success: true,
				posts: response.data,
			};
		}

		return {
			success: false,
			posts: [],
		};
	} catch (error) {
		console.error("Error fetching pending posts:", error);
		return {
			success: false,
			posts: [],
		};
	}
};

export const getComments = async (postId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getComment");
		formData.append("json", JSON.stringify({ post_id: postId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return {
				success: true,
				comments: response.data,
			};
		}

		return {
			success: false,
			comments: [],
		};
	} catch (error) {
		console.error("Error fetching comments:", error);
		return {
			success: false,
			comments: [],
		};
	}
};

export const addComment = async (userId, postId, commentMessage) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addComment");
		formData.append(
			"json",
			JSON.stringify({
				comment_userId: userId,
				comment_postId: postId,
				comment_message: commentMessage,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to add comment",
		};
	} catch (error) {
		console.error("Error adding comment:", error);
		return {
			success: false,
			message: "Failed to add comment",
		};
	}
};

export const getSharedPostComments = async (postSId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getSharedPostComments");
		formData.append("json", JSON.stringify({ postS_id: postSId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return {
				success: true,
				comments: response.data,
			};
		}

		return {
			success: false,
			comments: [],
		};
	} catch (error) {
		console.error("Error fetching shared post comments:", error);
		return {
			success: false,
			comments: [],
		};
	}
};

export const addSharedPostComment = async (userId, postSId, commentMessage) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "addSharedPostComment");
		formData.append(
			"json",
			JSON.stringify({
				commentS_userId: userId,
				commentS_postSId: postSId,
				commentS_message: commentMessage,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to add shared post comment",
		};
	} catch (error) {
		console.error("Error adding shared post comment:", error);
		return {
			success: false,
			message: "Failed to add shared post comment",
		};
	}
};

export const editComment = async (commentId, newMessage) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "editComment");
		formData.append(
			"json",
			JSON.stringify({
				comment_id: commentId,
				comment_message: newMessage,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to edit comment",
		};
	} catch (error) {
		console.error("Error editing comment:", error);
		return {
			success: false,
			message: "Failed to edit comment",
		};
	}
};

export const deleteComment = async (commentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "deleteComment");
		formData.append(
			"json",
			JSON.stringify({
				comment_id: commentId,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to delete comment",
		};
	} catch (error) {
		console.error("Error deleting comment:", error);
		return {
			success: false,
			message: "Failed to delete comment",
		};
	}
};

export const editSharedPostComment = async (commentSId, newMessage) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "editSharedPostComment");
		formData.append(
			"json",
			JSON.stringify({
				commentS_id: commentSId,
				commentS_message: newMessage,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to edit shared post comment",
		};
	} catch (error) {
		console.error("Error editing shared post comment:", error);
		return {
			success: false,
			message: "Failed to edit shared post comment",
		};
	}
};

export const deleteSharedPostComment = async (commentSId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "deleteSharedPostComment");
		formData.append(
			"json",
			JSON.stringify({
				commentS_id: commentSId,
			})
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to delete shared post comment",
		};
	} catch (error) {
		console.error("Error deleting shared post comment:", error);
		return {
			success: false,
			message: "Failed to delete shared post comment",
		};
	}
};

export const formatTimeAgo = (dateString) => {
	// Parse the database timestamp
	const date = new Date(dateString);
	const now = new Date();

	// Calculate the difference in milliseconds
	const diffInMs = now.getTime() - date.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);

	// Handle negative differences (future dates) or very recent as "Just now"

	// Handle negative differences (future dates) or very recent as "Just now"
	if (diffInSeconds <= 5) {
		return "Just now";
	}

	if (diffInSeconds < 90) {
		return diffInSeconds === 1
			? "1 second ago"
			: `${diffInSeconds} seconds ago`;
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return diffInMinutes === 1
			? "1 minute ago"
			: `${diffInMinutes} minutes ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
	}

	const diffInYears = Math.floor(diffInDays / 365);
	return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
};

export const getStudentAttendanceRecords = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentAttendanceRecords");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);
		// console.log(response.data);

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
		console.error("Error fetching student attendance records:", error);
		return {
			success: false,
			records: [],
		};
	}
};

export const getStudentActivities = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentActivities");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

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
		console.error("Error fetching student activities:", error);
		return {
			success: false,
			activities: [],
		};
	}
};

export const getStudentTribeScores = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentTribeScores");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

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
		console.error("Error fetching student tribe scores:", error);
		return {
			success: false,
			scores: [],
		};
	}
};

export const getStudentTribeInfo = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentTribeInfo");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

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
		console.error("Error fetching student tribe info:", error);
		return {
			success: false,
			tribeInfo: null,
		};
	}
};

export const getStudentTeamActivities = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getStudentTeamActivities");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);

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
		console.error("Error fetching student team activities:", error);
		return {
			success: false,
			activities: [],
		};
	}
};

export const getActiveEvaluations = async (studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getActiveEvaluations");
		formData.append("json", JSON.stringify({ studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);
		console.log("response", response.data);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				evaluations: response.data,
			};
		}

		return {
			success: false,
			evaluations: [],
		};
	} catch (error) {
		console.error("Error fetching active evaluations:", error);
		return {
			success: false,
			evaluations: [],
		};
	}
};

export const getEvaluationQuestions = async (evaluationId, studentId) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "getEvaluationQuestions");
		formData.append("json", JSON.stringify({ evaluationId, studentId }));

		const response = await axios.post(`${apiUrl}/student.php`, formData);
		console.log("response", response.data);

		if (Array.isArray(response.data)) {
			return {
				success: true,
				questions: response.data,
			};
		}

		return {
			success: false,
			questions: [],
		};
	} catch (error) {
		console.error("Error fetching evaluation questions:", error);
		return {
			success: false,
			questions: [],
		};
	}
};

export const submitEvaluationAnswers = async (
	studentId,
	evaluationId,
	answers
) => {
	try {
		const apiUrl = getDecryptedApiUrl();
		const formData = new FormData();
		formData.append("operation", "submitEvaluationAnswers");
		formData.append(
			"json",
			JSON.stringify({ studentId, evaluationId, answers })
		);

		const response = await axios.post(`${apiUrl}/student.php`, formData);

		if (response.data) {
			return response.data;
		}

		return {
			success: false,
			message: "Failed to submit evaluation answers",
		};
	} catch (error) {
		console.error("Error submitting evaluation answers:", error);
		return {
			success: false,
			message: "Failed to submit evaluation answers",
		};
	}
};
