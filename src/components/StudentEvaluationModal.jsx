import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import {
	getActiveEvaluations,
	getEvaluationQuestions,
	submitEvaluationAnswers,
} from "../utils/student";
import { toast } from "react-hot-toast";

export default function StudentEvaluationModal({ isOpen, onClose, studentId }) {
	const [evaluations, setEvaluations] = useState([]);
	const [selectedEvaluation, setSelectedEvaluation] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [answers, setAnswers] = useState({});
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState("loading"); // 'loading', 'questions', 'submitted', 'empty', 'alreadyAnswered'

	useEffect(() => {
		if (isOpen) {
			fetchActiveEvaluations();
			setSelectedEvaluation(null);
			setQuestions([]);
			setAnswers({});
		}
	}, [isOpen, studentId]);

	const fetchActiveEvaluations = async () => {
		setLoading(true);
		setCurrentStep("loading");
		try {
			const response = await getActiveEvaluations(studentId);
			if (response.success) {
				setEvaluations(response.evaluations);

				if (response.evaluations.length === 0) {
					setCurrentStep("empty");
				} else {
					// Check if the first evaluation is already answered
					const firstEvaluation = response.evaluations[0];
					if (firstEvaluation.already_answered) {
						setCurrentStep("alreadyAnswered");
						setSelectedEvaluation(firstEvaluation);
					} else {
						// Load the first active evaluation directly
						await loadEvaluationQuestions(firstEvaluation);
					}
				}
			} else {
				toast.error("Failed to load evaluations");
				setCurrentStep("empty");
			}
		} catch (error) {
			console.error("Error fetching evaluations:", error);
			toast.error("Failed to load evaluations");
			setCurrentStep("empty");
		} finally {
			setLoading(false);
		}
	};

	const loadEvaluationQuestions = async (evaluation) => {
		setSelectedEvaluation(evaluation);
		setCurrentStep("loading");

		try {
			const response = await getEvaluationQuestions(
				evaluation.eval_id,
				studentId
			);
			if (response.success) {
				setQuestions(response.questions);
				// Initialize answers object
				const initialAnswers = {};
				response.questions.forEach((question) => {
					initialAnswers[question.evalQ_id] = {
						questionId: question.evalQ_id,
						answer: "",
						choiceId: null,
					};
				});
				setAnswers(initialAnswers);
				setCurrentStep("questions");
			} else {
				toast.error("Failed to load questions");
				setCurrentStep("empty");
			}
		} catch (error) {
			console.error("Error fetching questions:", error);
			toast.error("Failed to load questions");
			setCurrentStep("empty");
		}
	};

	const handleAnswerChange = (questionId, value, choiceId = null) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: {
				questionId,
				answer: choiceId ? "" : value, // Clear text answer if choice is selected
				choiceId: choiceId,
			},
		}));
	};

	// Check if all questions are answered
	const isAllQuestionsAnswered = () => {
		return questions.every((question) => {
			const answer = answers[question.evalQ_id];
			if (question.evalQ_typeId === 1) {
				// Multiple choice
				return answer?.choiceId;
			} else {
				// Comment
				return answer?.answer?.trim();
			}
		});
	};

	const handleSubmitAnswers = async () => {
		// Validate that all questions are answered
		const unansweredQuestions = questions.filter((question) => {
			const answer = answers[question.evalQ_id];
			if (question.evalQ_typeId === 1) {
				// Multiple choice
				return !answer?.choiceId;
			} else {
				// Comment
				return !answer?.answer?.trim();
			}
		});

		if (unansweredQuestions.length > 0) {
			toast.error("Please answer all questions before submitting");
			return;
		}

		setSubmitting(true);
		try {
			const answersArray = Object.values(answers);
			const response = await submitEvaluationAnswers(
				studentId,
				selectedEvaluation.eval_id,
				answersArray
			);

			if (response.success) {
				toast.success("Evaluation submitted successfully!");
				setCurrentStep("submitted");
			} else {
				toast.error(response.message || "Failed to submit evaluation");
			}
		} catch (error) {
			console.error("Error submitting answers:", error);
			toast.error("Failed to submit evaluation");
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setSelectedEvaluation(null);
		setQuestions([]);
		setAnswers({});
		onClose();
	};

	const handleClearAnswers = () => {
		// Clear all answers but keep the questions loaded
		const clearedAnswers = {};
		questions.forEach((question) => {
			clearedAnswers[question.evalQ_id] = {
				questionId: question.evalQ_id,
				answer: "",
				choiceId: null,
			};
		});
		setAnswers(clearedAnswers);
		toast.success("Answers cleared successfully");
	};

	const handleRefresh = async () => {
		await fetchActiveEvaluations();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
			<div className="bg-white dark:bg-gray-800 w-full h-full sm:rounded-2xl sm:shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent">
					<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
						<div className="p-2 sm:p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg flex-shrink-0">
							<CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
								{currentStep === "loading" && "Loading Evaluation..."}
								{currentStep === "questions" && selectedEvaluation?.eval_name}
								{currentStep === "submitted" && "Evaluation Submitted"}
								{currentStep === "empty" && "No Active Evaluations"}
								{currentStep === "alreadyAnswered" &&
									"Evaluation Already Completed"}
							</h2>
							<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
								{currentStep === "loading" &&
									"Please wait while we load your evaluation"}
								{currentStep === "questions" &&
									`Event: ${selectedEvaluation?.event_title}`}
								{currentStep === "submitted" && "Thank you for your feedback!"}
								{currentStep === "empty" &&
									"There are currently no active evaluations"}
								{currentStep === "alreadyAnswered" &&
									`Event: ${selectedEvaluation?.event_title}`}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<button
							onClick={handleRefresh}
							disabled={loading || submitting}
							className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
							title="Refresh evaluation data"
						>
							<RefreshCw
								className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 ${
									loading ? "animate-spin" : ""
								}`}
							/>
						</button>
						<button
							onClick={handleClose}
							className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group flex-shrink-0 touch-manipulation"
						>
							<X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6 overflow-y-auto flex-1">
					{/* Loading State */}
					{currentStep === "loading" && (
						<div className="flex items-center justify-center py-12 h-full">
							<div className="text-center">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
								<p className="text-gray-600 dark:text-gray-400">
									Loading evaluation...
								</p>
							</div>
						</div>
					)}

					{/* Empty State */}
					{currentStep === "empty" && (
						<div className="flex items-center justify-center h-full">
							<div className="text-center py-16">
								<div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
									<AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
								</div>
								<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
									No Active Evaluations
								</h3>
								<p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
									There are currently no active evaluations available. Check
									back later for new evaluation forms.
								</p>
							</div>
						</div>
					)}

					{/* Already Answered State */}
					{currentStep === "alreadyAnswered" && (
						<div className="flex items-center justify-center h-full">
							<div className="text-center py-16">
								<div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
									<CheckCircle className="w-12 h-12 text-white" />
								</div>
								<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
									Evaluation Already Completed
								</h3>
								<p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
									You have already submitted your response for this evaluation.
									Thank you for your valuable feedback!
								</p>
								<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 max-w-md mx-auto">
									<div className="flex items-center gap-2 text-green-700 dark:text-green-300">
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
										<span className="text-sm font-medium">
											Response Recorded Successfully
										</span>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Questions */}
					{currentStep === "questions" && (
						<div className="max-w-4xl mx-auto">
							<div className="space-y-4 sm:space-y-8">
								{questions.map((question, index) => (
									<div
										key={question.evalQ_id}
										className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
									>
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0">
												<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg">
													{index + 1}
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<div className="mb-3 sm:mb-4">
													<h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-relaxed">
														{question.evalQ_text}
													</h4>
													<div className="flex items-center gap-2">
														<span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
															{question.evalQT_name}
														</span>
													</div>
												</div>

												{/* Multiple Choice */}
												{question.evalQ_typeId === 1 && question.choices && (
													<div className="space-y-2 sm:space-y-3">
														{question.choices.map((choice, choiceIndex) => (
															<label
																key={choice.evalC_id}
																className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation min-h-[48px] ${
																	answers[question.evalQ_id]?.choiceId ===
																	choice.evalC_id
																		? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
																		: "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
																}`}
															>
																<div className="flex-shrink-0">
																	<div
																		className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
																			answers[question.evalQ_id]?.choiceId ===
																			choice.evalC_id
																				? "border-green-500 bg-green-500"
																				: "border-gray-300 dark:border-gray-500 group-hover:border-green-400"
																		}`}
																	>
																		{answers[question.evalQ_id]?.choiceId ===
																			choice.evalC_id && (
																			<div className="w-2 h-2 bg-white rounded-full"></div>
																		)}
																	</div>
																</div>
																<input
																	type="radio"
																	name={`question-${question.evalQ_id}`}
																	value={choice.evalC_id}
																	checked={
																		answers[question.evalQ_id]?.choiceId ===
																		choice.evalC_id
																	}
																	onChange={() =>
																		handleAnswerChange(
																			question.evalQ_id,
																			"",
																			choice.evalC_id
																		)
																	}
																	className="sr-only"
																/>
																<div className="flex-1 min-w-0">
																	<span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
																		{choice.evalC_text}
																	</span>
																</div>
																{answers[question.evalQ_id]?.choiceId ===
																	choice.evalC_id && (
																	<div className="flex-shrink-0">
																		<svg
																			className="w-5 h-5 text-green-600 dark:text-green-400"
																			fill="currentColor"
																			viewBox="0 0 20 20"
																		>
																			<path
																				fillRule="evenodd"
																				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																				clipRule="evenodd"
																			/>
																		</svg>
																	</div>
																)}
															</label>
														))}
													</div>
												)}

												{/* Comment */}
												{question.evalQ_typeId === 2 && (
													<div className="space-y-2 sm:space-y-3">
														<textarea
															value={answers[question.evalQ_id]?.answer || ""}
															onChange={(e) =>
																handleAnswerChange(
																	question.evalQ_id,
																	e.target.value
																)
															}
															placeholder="Share your thoughts and feedback here..."
															className="w-full p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
															rows={4}
														/>
														<div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
															<span>Your response will be recorded</span>
															<span>
																{answers[question.evalQ_id]?.answer?.length ||
																	0}{" "}
																characters
															</span>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Submission Success */}
					{currentStep === "submitted" && (
						<div className="flex items-center justify-center h-full">
							<div className="text-center py-16">
								<div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
									<CheckCircle className="w-12 h-12 text-white" />
								</div>
								<h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
									Evaluation Completed!
								</h3>
								<p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
									Thank you for taking the time to provide your feedback. Your
									responses have been recorded successfully and will help
									improve future events.
								</p>
								<div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/>
									</svg>
									<span>Your responses are secure and confidential</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{(currentStep === "questions" ||
					currentStep === "empty" ||
					currentStep === "alreadyAnswered") && (
					<div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
						<div className="flex items-center gap-2 sm:gap-3">
							{currentStep === "questions" && (
								<button
									onClick={handleClearAnswers}
									className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium touch-manipulation"
									disabled={submitting}
								>
									Clear
								</button>
							)}
							{currentStep === "questions" && (
								<button
									onClick={handleSubmitAnswers}
									disabled={submitting || !isAllQuestionsAnswered()}
									className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none touch-manipulation"
								>
									{submitting ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
											Submitting...
										</>
									) : (
										<>
											<svg
												className="w-4 h-4 mr-2 inline"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											Submit Evaluation
										</>
									)}
								</button>
							)}
						</div>
					</div>
				)}

				{/* Close button for submitted state */}
				{currentStep === "submitted" && (
					<div className="flex items-center justify-center p-4 sm:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
						<button
							onClick={handleClose}
							className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl touch-manipulation"
						>
							<svg
								className="w-5 h-5 mr-2 inline"
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
							Close
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
