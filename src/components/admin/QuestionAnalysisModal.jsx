import React, { useState, useEffect } from "react";
import { X, BarChart3, MessageSquare, Search, Users } from "lucide-react";
import {
	getEvaluationQuestionAnalysis,
	getEvaluationChoiceResponses,
} from "../../utils/admin";
import toast from "react-hot-toast";

const QuestionAnalysisModal = ({ isOpen, onClose, questionId }) => {
	const [analysis, setAnalysis] = useState(null);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [studentModal, setStudentModal] = useState({
		isOpen: false,
		choice: null,
		students: [],
		loading: false,
	});

	useEffect(() => {
		if (isOpen && questionId) {
			fetchAnalysis();
		}
	}, [isOpen, questionId]);

	const fetchAnalysis = async () => {
		setLoading(true);
		try {
			const response = await getEvaluationQuestionAnalysis(questionId);
			if (response.success) {
				setAnalysis(response);
			} else {
				toast.error(response.message || "Failed to load analysis");
			}
		} catch (error) {
			console.error("Error fetching analysis:", error);
			toast.error("Failed to load analysis");
		} finally {
			setLoading(false);
		}
	};

	const fetchStudentResponses = async (choiceId, choiceText) => {
		setStudentModal((prev) => ({
			...prev,
			loading: true,
			isOpen: true,
			choice: { id: choiceId, text: choiceText },
		}));
		try {
			const response = await getEvaluationChoiceResponses(choiceId);
			if (response.success) {
				setStudentModal((prev) => ({
					...prev,
					students: response.students || [],
					loading: false,
				}));
			} else {
				toast.error(response.message || "Failed to load student responses");
				setStudentModal((prev) => ({ ...prev, loading: false }));
			}
		} catch (error) {
			console.error("Error fetching student responses:", error);
			toast.error("Failed to load student responses");
			setStudentModal((prev) => ({ ...prev, loading: false }));
		}
	};

	const closeStudentModal = () => {
		setStudentModal({
			isOpen: false,
			choice: null,
			students: [],
			loading: false,
		});
	};

	if (!isOpen || !analysis) return null;

	const isMultipleChoice = analysis.question?.evalQ_typeId === 1;
	const maxCount = isMultipleChoice
		? Math.max(
				...(analysis.analysis?.map((item) => item.response_count) || [0])
		  )
		: 0;

	// Filter comments based on search term
	const filteredComments =
		analysis.comments?.filter((comment) => {
			if (!searchTerm) return true;
			const searchLower = searchTerm.toLowerCase();
			return (
				comment.user_name?.toLowerCase().includes(searchLower) ||
				comment.evalA_comment?.toLowerCase().includes(searchLower)
			);
		}) || [];

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-5xl w-full max-h-[95vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
					<div className="flex items-center gap-3">
						{isMultipleChoice ? (
							<BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						) : (
							<MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
						)}
						<div>
							<h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
								Question Analysis
							</h2>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{analysis.question?.evalT_name}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : (
						<div className="space-y-6">
							{/* Question */}
							<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
									Question
								</h3>
								<p className="text-gray-700 dark:text-gray-300">
									{analysis.question?.evalQ_text}
								</p>
							</div>

							{/* Analysis Content */}
							{isMultipleChoice ? (
								<div>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
										Response Distribution
									</h3>
									<div className="space-y-4">
										{analysis.analysis?.map((item, index) => {
											const percentage =
												analysis.total_responses > 0
													? Math.round(
															(item.response_count / analysis.total_responses) *
																100
													  )
													: 0;

											return (
												<div
													key={item.evalC_id}
													className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
													onClick={() =>
														fetchStudentResponses(
															item.evalC_id,
															item.evalC_text
														)
													}
												>
													<div className="flex items-center justify-between">
														<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
															{item.evalC_text}
														</span>
														<div className="flex items-center gap-2">
															<span className="text-sm text-gray-500 dark:text-gray-400">
																{item.response_count} responses
															</span>
															<span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
																{percentage}%
															</span>
														</div>
													</div>
													<div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
														<div
															className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
															style={{ width: `${percentage}%` }}
														></div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							) : (
								<div>
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
											Comments & Feedback
										</h3>
										{analysis.comments?.length > 0 && (
											<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
												{filteredComments.length}{" "}
												{filteredComments.length === 1 ? "comment" : "comments"}
											</span>
										)}
									</div>

									{/* Search Bar */}
									{analysis.comments?.length > 0 && (
										<div className="relative mb-4">
											<div className="relative">
												<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
												<input
													type="text"
													placeholder="Search by name or comment..."
													value={searchTerm}
													onChange={(e) => setSearchTerm(e.target.value)}
													className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>
											{searchTerm && (
												<button
													onClick={() => setSearchTerm("")}
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
												>
													<X className="w-4 h-4" />
												</button>
											)}
										</div>
									)}
									{filteredComments.length > 0 ? (
										<div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
											{filteredComments.map((comment, index) => (
												<div
													key={index}
													className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
												>
													<div className="flex items-start gap-3">
														<div className="flex-shrink-0">
															{comment.user_avatar ? (
																<img
																	src={comment.user_avatar}
																	alt={comment.user_name}
																	className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
																/>
															) : (
																<div className="w-10 h-10 bg-gray-400/50   rounded-full flex items-center justify-center ">
																	<span className="text-black text-sm font-semibold">
																		{comment.user_name
																			?.charAt(0)
																			?.toUpperCase()}
																	</span>
																</div>
															)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
																<span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
																	{comment.user_name}
																</span>
																<span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
																	{new Date(
																		comment.evalA_createdAt
																	).toLocaleDateString("en-US", {
																		month: "short",
																		day: "numeric",
																		year: "numeric",
																		hour: "2-digit",
																		minute: "2-digit",
																	})}
																</span>
															</div>
															<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
																<p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
																	{comment.evalA_comment}
																</p>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-8 text-gray-500 dark:text-gray-400">
											<MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
											<p>
												{searchTerm
													? "No comments match your search"
													: "No comments yet"}
											</p>
											{searchTerm && (
												<button
													onClick={() => setSearchTerm("")}
													className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
												>
													Clear search
												</button>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Student Responses Modal */}
			{studentModal.isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-2 sm:p-4 backdrop-blur-sm">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
							<div className="flex items-center gap-3">
								<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
								<div>
									<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
										Student Responses
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
										{studentModal.choice?.text}
									</p>
								</div>
							</div>
							<button
								onClick={closeStudentModal}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
							</button>
						</div>

						{/* Content */}
						<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
							{studentModal.loading ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							) : studentModal.students.length > 0 ? (
								<div className="space-y-2">
									<div className="flex items-center justify-between mb-4">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											{studentModal.students.length} student
											{studentModal.students.length !== 1 ? "s" : ""}
										</span>
									</div>
									{studentModal.students.map((student, index) => (
										<div
											key={index}
											className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
										>
											<div className="flex-shrink-0">
												{student.user_avatar ? (
													<img
														src={student.user_avatar}
														alt={student.user_name}
														className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
													/>
												) : (
													<div className="w-8 h-8 bg-gray-400/50 rounded-full flex items-center justify-center">
														<span className="text-black text-xs font-semibold">
															{student.user_name?.charAt(0)?.toUpperCase()}
														</span>
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
													{student.user_name}
												</p>
												{student.user_level && (
													<p className="text-xs text-gray-500 dark:text-gray-400">
														{student.user_level}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500 dark:text-gray-400">
									<Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
									<p>No students found for this choice</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default QuestionAnalysisModal;
