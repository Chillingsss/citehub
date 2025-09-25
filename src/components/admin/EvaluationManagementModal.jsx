import React, { useState, useEffect } from "react";
import {
	X,
	ClipboardCheck,
	Plus,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	Edit,
	Trash2,
	FileText,
	List,
	MessageSquare,
	Power,
	BarChart3,
} from "lucide-react";
import {
	getEvaluations,
	addEvaluation,
	updateEvaluation,
	deleteEvaluation,
	getEvents,
	getEvaluationQuestionTypes,
	getEvaluationQuestions,
	addEvaluationQuestion,
	updateEvaluationQuestion,
	deleteEvaluationQuestion,
	getEvaluationChoices,
} from "../../utils/admin";
import QuestionAnalysisModal from "./QuestionAnalysisModal";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { COOKIE_KEY, COOKIE_SECRET_KEY } from "../../utils/apiConfig";

const EvaluationManagementModal = ({ isOpen, onClose }) => {
	const [evaluations, setEvaluations] = useState([]);
	const [events, setEvents] = useState([]);
	const [questionTypes, setQuestionTypes] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedEvaluation, setSelectedEvaluation] = useState(null);
	const [expandedEvaluations, setExpandedEvaluations] = useState(new Set());

	// Form states
	const [showAddEvaluationForm, setShowAddEvaluationForm] = useState(false);
	const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);

	// Edit states
	const [editingEvaluation, setEditingEvaluation] = useState(null);
	const [editingQuestion, setEditingQuestion] = useState(null);

	// Delete confirmation states
	const [showDeleteEvaluationDialog, setShowDeleteEvaluationDialog] =
		useState(false);
	const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] =
		useState(false);
	const [evaluationToDelete, setEvaluationToDelete] = useState(null);
	const [questionToDelete, setQuestionToDelete] = useState(null);

	// Analysis modal state
	const [showAnalysisModal, setShowAnalysisModal] = useState(false);
	const [selectedQuestionForAnalysis, setSelectedQuestionForAnalysis] =
		useState(null);

	const [evaluationForm, setEvaluationForm] = useState({
		name: "",
		eventId: "",
		adminId: "",
		isActive: true, // Default to active
	});

	const [questionForm, setQuestionForm] = useState({
		evalId: "",
		question: "",
		typeId: "",
		choices: [""],
	});

	const [editingChoices, setEditingChoices] = useState([]);

	useEffect(() => {
		if (isOpen) {
			fetchEvaluations();
			fetchEvents();
			fetchQuestionTypes();
		}
	}, [isOpen]);

	const fetchEvaluations = async () => {
		try {
			setLoading(true);
			const res = await getEvaluations();
			if (res?.success) {
				setEvaluations(res.evaluations || []);
			}
		} catch (error) {
			console.error("Error fetching evaluations:", error);
			toast.error("Failed to fetch evaluations");
		} finally {
			setLoading(false);
		}
	};

	const fetchEvents = async () => {
		try {
			const res = await getEvents();
			if (res?.success) {
				setEvents(res.events || []);
			}
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	const fetchQuestionTypes = async () => {
		try {
			const res = await getEvaluationQuestionTypes();
			if (res?.success) {
				setQuestionTypes(res.questionTypes || []);
			}
		} catch (error) {
			console.error("Error fetching question types:", error);
		}
	};

	const fetchEvaluationQuestions = async (evalId) => {
		try {
			const res = await getEvaluationQuestions(evalId);
			if (res?.success) {
				setQuestions(res.questions || []);
			}
		} catch (error) {
			console.error("Error fetching evaluation questions:", error);
			toast.error("Failed to fetch questions");
		}
	};

	const handleAddEvaluation = async () => {
		if (!evaluationForm.name.trim() || !evaluationForm.eventId) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Get current user ID from cookies
		let currentUserId = "";
		const encrypted = Cookies.get(COOKIE_KEY);
		if (encrypted) {
			try {
				const bytes = CryptoJS.AES.decrypt(encrypted, COOKIE_SECRET_KEY);
				const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
				currentUserId = user?.user_id || "";
			} catch (error) {
				console.error("Error decrypting cookie:", error);
			}
		}

		try {
			const res = await addEvaluation({
				name: evaluationForm.name.trim(),
				eventId: evaluationForm.eventId,
				adminId: currentUserId,
				isActive: evaluationForm.isActive ? 1 : 0,
			});

			if (res?.success) {
				if (evaluationForm.isActive) {
					// Find the event name for the message
					const eventName =
						events.find((event) => event.event_id === evaluationForm.eventId)
							?.event_title || "this event";
					toast.success(`Evaluation created and activated successfully.`, {
						duration: 4000,
					});
				} else {
					toast.success("Evaluation created successfully");
				}
				setEvaluationForm({
					name: "",
					eventId: "",
					adminId: "",
					isActive: true,
				});
				setShowAddEvaluationForm(false);
				fetchEvaluations();
			} else {
				toast.error(res?.message || "Failed to create evaluation");
			}
		} catch (error) {
			console.error("Error creating evaluation:", error);
			toast.error("Failed to create evaluation");
		}
	};

	const handleUpdateEvaluation = async () => {
		if (!editingEvaluation?.eval_name?.trim()) {
			toast.error("Evaluation name is required");
			return;
		}

		try {
			const res = await updateEvaluation({
				evalId: editingEvaluation.eval_id,
				name: editingEvaluation.eval_name.trim(),
				eventId: editingEvaluation.eval_eventId,
				isActive: editingEvaluation.eval_isActive,
			});

			if (res?.success) {
				// Store the original evaluation to compare status changes
				const originalEvaluation = evaluations.find(
					(evaluation) => evaluation.eval_id === editingEvaluation.eval_id
				);
				const wasOriginallyActive = originalEvaluation?.eval_isActive || false;
				const willBeActive = editingEvaluation.eval_isActive;

				// Check if we're updating the evaluation to active status (was inactive, now active)
				if (!wasOriginallyActive && willBeActive) {
					// Find the event name for the message
					const eventName =
						events.find(
							(event) => event.event_id === editingEvaluation.eval_eventId
						)?.event_title || "this event";
					toast.success(`Evaluation updated and activated successfully.`, {
						duration: 4000,
					});
				} else {
					toast.success("Evaluation updated successfully");
				}
				setEditingEvaluation(null);
				fetchEvaluations();
			} else {
				toast.error(res?.message || "Failed to update evaluation");
			}
		} catch (error) {
			console.error("Error updating evaluation:", error);
			toast.error("Failed to update evaluation");
		}
	};

	const handleDeleteEvaluation = async () => {
		if (!evaluationToDelete) return;

		try {
			const res = await deleteEvaluation(evaluationToDelete.eval_id);

			if (res?.success) {
				toast.success("Evaluation deleted successfully");
				setShowDeleteEvaluationDialog(false);
				setEvaluationToDelete(null);
				fetchEvaluations();
				// Close expanded evaluation if it was deleted
				if (selectedEvaluation?.eval_id === evaluationToDelete.eval_id) {
					setSelectedEvaluation(null);
					setExpandedEvaluations(new Set());
				}
			} else {
				toast.error(res?.message || "Failed to delete evaluation");
			}
		} catch (error) {
			console.error("Error deleting evaluation:", error);
			toast.error("Failed to delete evaluation");
		}
	};

	const handleAddQuestion = async () => {
		if (!questionForm.question.trim() || !questionForm.typeId) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Filter out empty choices
		const filteredChoices = questionForm.choices.filter(
			(choice) => choice.trim() !== ""
		);

		// Validate choices for multiple choice questions
		if (questionForm.typeId === 1 && filteredChoices.length < 2) {
			toast.error("Multiple choice questions must have at least 2 choices");
			return;
		}

		try {
			const res = await addEvaluationQuestion({
				evalId: selectedEvaluation.eval_id,
				question: questionForm.question.trim(),
				typeId: questionForm.typeId,
				choices: filteredChoices,
			});

			if (res?.success) {
				toast.success("Question added successfully");
				setQuestionForm({
					evalId: "",
					question: "",
					typeId: "",
					choices: [""],
				});
				setShowAddQuestionForm(false);
				fetchEvaluationQuestions(selectedEvaluation.eval_id);
			} else {
				toast.error(res?.message || "Failed to add question");
			}
		} catch (error) {
			console.error("Error adding question:", error);
			toast.error("Failed to add question");
		}
	};

	const handleUpdateQuestion = async () => {
		if (!editingQuestion?.evalQ_text?.trim()) {
			toast.error("Question text is required");
			return;
		}

		// Get current choices for multiple choice questions
		let choices = [];
		if (editingQuestion.evalQ_typeId === 1) {
			// Filter out empty choices
			choices = editingChoices.filter((choice) => choice.trim() !== "");
			if (choices.length < 2) {
				toast.error("Multiple choice questions must have at least 2 choices");
				return;
			}
		}

		try {
			const res = await updateEvaluationQuestion({
				questionId: editingQuestion.evalQ_id,
				question: editingQuestion.evalQ_text.trim(),
				choices: choices,
			});

			if (res?.success) {
				toast.success("Question updated successfully");
				setEditingQuestion(null);
				setEditingChoices([]);
				fetchEvaluationQuestions(selectedEvaluation.eval_id);
			} else {
				toast.error(res?.message || "Failed to update question");
			}
		} catch (error) {
			console.error("Error updating question:", error);
			toast.error("Failed to update question");
		}
	};

	const handleDeleteQuestion = async () => {
		if (!questionToDelete) return;

		try {
			const res = await deleteEvaluationQuestion(questionToDelete.evalQ_id);

			if (res?.success) {
				toast.success("Question deleted successfully");
				setShowDeleteQuestionDialog(false);
				setQuestionToDelete(null);
				fetchEvaluationQuestions(selectedEvaluation.eval_id);
			} else {
				toast.error(res?.message || "Failed to delete question");
			}
		} catch (error) {
			console.error("Error deleting question:", error);
			toast.error("Failed to delete question");
		}
	};

	const handleToggleEvaluationStatus = async (evaluation) => {
		try {
			const newStatus = evaluation.eval_isActive ? 0 : 1;

			// Show confirmation message when activating an evaluation
			if (newStatus === 1) {
				toast.success(`Evaluation activated successfully.`, {
					duration: 4000,
				});
			}

			const res = await updateEvaluation({
				evalId: evaluation.eval_id,
				isActive: newStatus,
			});

			if (res?.success) {
				if (newStatus === 0) {
					toast.success("Evaluation deactivated successfully");
				}
				fetchEvaluations();
			} else {
				toast.error(res?.message || "Failed to update evaluation status");
			}
		} catch (error) {
			console.error("Error updating evaluation status:", error);
			toast.error("Failed to update evaluation status");
		}
	};

	const toggleEvaluationExpansion = async (evaluation) => {
		const newExpanded = new Set(expandedEvaluations);
		if (newExpanded.has(evaluation.eval_id)) {
			newExpanded.delete(evaluation.eval_id);
			setSelectedEvaluation(null);
			setEditingChoices([]); // Clear editing choices when closing
		} else {
			newExpanded.clear();
			newExpanded.add(evaluation.eval_id);
			setSelectedEvaluation(evaluation);
			await fetchEvaluationQuestions(evaluation.eval_id);
		}
		setExpandedEvaluations(newExpanded);
	};

	const addChoice = () => {
		setQuestionForm((prev) => ({
			...prev,
			choices: [...prev.choices, ""],
		}));
	};

	const removeChoice = (index) => {
		setQuestionForm((prev) => ({
			...prev,
			choices: prev.choices.filter((_, i) => i !== index),
		}));
	};

	const updateChoice = (index, value) => {
		setQuestionForm((prev) => ({
			...prev,
			choices: prev.choices.map((choice, i) => (i === index ? value : choice)),
		}));
	};

	const addEditingChoice = () => {
		setEditingChoices((prev) => [...prev, ""]);
	};

	const removeEditingChoice = (index) => {
		setEditingChoices((prev) => prev.filter((_, i) => i !== index));
	};

	const updateEditingChoice = (index, value) => {
		setEditingChoices((prev) =>
			prev.map((choice, i) => (i === index ? value : choice))
		);
	};

	const handleViewAnalysis = (question) => {
		setSelectedQuestionForAnalysis(question);
		setShowAnalysisModal(true);
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
				<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl max-w-[95vw] sm:max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
						<div className="flex items-center gap-2 sm:gap-3">
							<ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
							<h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
								Evaluation Management
							</h2>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={fetchEvaluations}
								disabled={loading}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
								title="Refresh evaluations"
							>
								<RefreshCw
									className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 ${
										loading ? "animate-spin" : ""
									}`}
								/>
							</button>
							<button
								onClick={onClose}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="flex flex-col h-[calc(95vh-80px)] sm:h-[calc(90vh-80px)]">
						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 gap-3 sm:gap-0">
							<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
								<button
									onClick={() => setShowAddEvaluationForm(true)}
									className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
								>
									<Plus className="w-4 h-4" />
									<span className="whitespace-nowrap">Create Evaluation</span>
								</button>
							</div>
						</div>

						{/* Evaluations List */}
						<div className="flex-1 overflow-y-auto">
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
								</div>
							) : evaluations.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
									<ClipboardCheck className="w-12 h-12 mb-4 opacity-50" />
									<p className="text-lg font-medium">No evaluations found</p>
									<p className="text-sm">
										Create your first evaluation to get started
									</p>
								</div>
							) : (
								<div className="divide-y dark:divide-gray-700">
									{evaluations.map((evaluation) => (
										<div
											key={evaluation.eval_id}
											className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
											onClick={(e) => {
												// Prevent row click when clicking on action buttons or their containers
												if (
													e.target.closest(".action-button") ||
													e.target.closest(".status-toggle") ||
													e.target.closest("input") ||
													e.target.closest("select") ||
													e.target.closest("textarea") ||
													e.target.closest("button")
												) {
													return;
												}
												toggleEvaluationExpansion(evaluation);
											}}
										>
											<div className="flex items-center justify-between gap-3">
												{/* Left side - Title and info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
															{evaluation.eval_name}
														</h3>
														<span
															className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
																evaluation.eval_isActive
																	? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																	: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
															}`}
														>
															{evaluation.eval_isActive ? "Active" : "Inactive"}
														</span>
														<Power
															className={`w-3 h-3 flex-shrink-0 ${
																evaluation.eval_isActive
																	? "text-green-600 dark:text-green-400"
																	: "text-gray-400 dark:text-gray-500"
															}`}
														/>
													</div>
													<div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
														<span className="truncate max-w-[120px] sm:max-w-none">
															Event: {evaluation.event_title}
														</span>
														<span className="whitespace-nowrap">
															Q: {evaluation.question_count}
														</span>
														<span className="whitespace-nowrap">
															{new Date(
																evaluation.eval_createdAt
															).toLocaleDateString()}
														</span>
													</div>
												</div>

												{/* Right side - Actions */}
												<div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
													{/* Status Toggle Switch */}
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleToggleEvaluationStatus(evaluation);
														}}
														className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
															evaluation.eval_isActive
																? "bg-green-600"
																: "bg-gray-200 dark:bg-gray-600"
														}`}
														title={
															evaluation.eval_isActive
																? "Deactivate evaluation"
																: "Activate evaluation"
														}
													>
														<span
															className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
																evaluation.eval_isActive
																	? "translate-x-5 sm:translate-x-6"
																	: "translate-x-1"
															}`}
														/>
													</button>

													{/* Action Buttons */}
													<button
														onClick={(e) => {
															e.stopPropagation();
															toggleEvaluationExpansion(evaluation);
														}}
														className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors action-button"
														title={
															expandedEvaluations.has(evaluation.eval_id)
																? "Hide questions"
																: "Show questions"
														}
													>
														{expandedEvaluations.has(evaluation.eval_id) ? (
															<ChevronUp className="w-4 h-4" />
														) : (
															<ChevronDown className="w-4 h-4" />
														)}
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEditingEvaluation(evaluation);
														}}
														className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors action-button"
														title="Edit evaluation"
													>
														<Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEvaluationToDelete(evaluation);
															setShowDeleteEvaluationDialog(true);
														}}
														className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors action-button"
														title="Delete evaluation"
													>
														<Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
													</button>
												</div>
											</div>

											{/* Expanded Questions */}
											{expandedEvaluations.has(evaluation.eval_id) && (
												<div className="mt-4 sm:mt-6 pl-4 sm:pl-6 border-l-2 border-gray-200 dark:border-gray-600">
													<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
														<h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-gray-100">
															Questions ({questions.length})
														</h4>
														<button
															onClick={() => {
																setQuestionForm((prev) => ({
																	...prev,
																	evalId: evaluation.eval_id,
																}));
																setShowAddQuestionForm(true);
															}}
															className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
														>
															<Plus className="w-4 h-4" />
															<span className="whitespace-nowrap">
																Add Question
															</span>
														</button>
													</div>

													{questions.length === 0 ? (
														<div className="text-center py-8 text-gray-500 dark:text-gray-400">
															<FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
															<p>No questions added yet</p>
														</div>
													) : (
														<div className="space-y-3">
															{questions.map((question) => (
																<div
																	key={question.evalQ_id}
																	className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3 sm:gap-0"
																>
																	<div className="flex-1 w-full sm:w-auto">
																		<div className="flex items-center gap-2 mb-2">
																			{question.evalQ_typeId === 1 ? (
																				<List className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
																			) : (
																				<MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
																			)}
																			<span className="text-sm font-medium text-gray-600 dark:text-gray-300">
																				{question.question_type}
																			</span>
																		</div>
																		<p className="text-gray-900 dark:text-gray-100 break-words pr-2">
																			{question.evalQ_text}
																		</p>
																		{question.evalQ_typeId === 1 && (
																			<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
																				{question.choice_count} choices
																			</p>
																		)}
																	</div>
																	<div className="flex items-center gap-2 ml-0 sm:ml-4 w-full sm:w-auto justify-end">
																		<button
																			onClick={() =>
																				handleViewAnalysis(question)
																			}
																			className="flex-1 sm:flex-none p-3 sm:p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
																			title="View analysis"
																		>
																			{question.evalQ_typeId === 1 ? (
																				<BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
																			) : (
																				<MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
																			)}
																			<span className="text-sm sm:hidden">
																				Analysis
																			</span>
																		</button>
																		<button
																			onClick={async () => {
																				setEditingQuestion(question);

																				// Fetch choices if this is a multiple choice question
																				if (question.evalQ_typeId === 1) {
																					try {
																						const choicesRes =
																							await getEvaluationChoices(
																								question.evalQ_id
																							);
																						if (choicesRes?.success) {
																							setEditingChoices(
																								choicesRes.choices.map(
																									(choice) => choice.evalC_text
																								)
																							);
																						}
																					} catch (error) {
																						console.error(
																							"Error fetching choices for editing:",
																							error
																						);
																						setEditingChoices([""]);
																					}
																				}
																			}}
																			className="flex-1 sm:flex-none p-3 sm:p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
																			title="Edit question"
																		>
																			<Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
																			<span className="text-sm sm:hidden">
																				Edit
																			</span>
																		</button>
																		<button
																			onClick={() => {
																				setQuestionToDelete(question);
																				setShowDeleteQuestionDialog(true);
																			}}
																			className="flex-1 sm:flex-none p-3 sm:p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
																			title="Delete question"
																		>
																			<Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
																			<span className="text-sm sm:hidden">
																				Delete
																			</span>
																		</button>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Add Evaluation Form Modal */}
			{showAddEvaluationForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
						<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
								Create New Evaluation
							</h3>
							<button
								onClick={() => setShowAddEvaluationForm(false)}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>

						<div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Evaluation Name *
								</label>
								<input
									type="text"
									value={evaluationForm.name}
									onChange={(e) =>
										setEvaluationForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
									placeholder="Enter evaluation name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Event *
								</label>
								<select
									value={evaluationForm.eventId}
									onChange={(e) =>
										setEvaluationForm((prev) => ({
											...prev,
											eventId: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
								>
									<option value="">Select an event</option>
									{events.map((event) => (
										<option key={event.event_id} value={event.event_id}>
											{event.event_title}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Status
								</label>
								<div className="flex items-center gap-3">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{evaluationForm.isActive ? "Active" : "Inactive"}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setEvaluationForm((prev) => ({
												...prev,
												isActive: !prev.isActive,
											}));
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
											evaluationForm.isActive
												? "bg-green-600"
												: "bg-gray-200 dark:bg-gray-600"
										}`}
										title={
											evaluationForm.isActive
												? "Set as inactive"
												: "Set as active"
										}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
												evaluationForm.isActive
													? "translate-x-6"
													: "translate-x-1"
											}`}
										/>
									</button>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t dark:border-gray-700">
							<button
								onClick={() => setShowAddEvaluationForm(false)}
								className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-1"
							>
								Cancel
							</button>
							<button
								onClick={handleAddEvaluation}
								disabled={
									!evaluationForm.name.trim() || !evaluationForm.eventId
								}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
							>
								Create Evaluation
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Evaluation Form Modal */}
			{editingEvaluation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
						<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
								Edit Evaluation
							</h3>
							<button
								onClick={() => setEditingEvaluation(null)}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>

						<div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Evaluation Name *
								</label>
								<input
									type="text"
									value={editingEvaluation.eval_name}
									onChange={(e) =>
										setEditingEvaluation((prev) => ({
											...prev,
											eval_name: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
									placeholder="Enter evaluation name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Event *
								</label>
								<select
									value={editingEvaluation.eval_eventId}
									onChange={(e) =>
										setEditingEvaluation((prev) => ({
											...prev,
											eval_eventId: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
								>
									<option value="">Select an event</option>
									{events.map((event) => (
										<option key={event.event_id} value={event.event_id}>
											{event.event_title}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Status
								</label>
								<div className="flex items-center gap-3">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{editingEvaluation.eval_isActive ? "Active" : "Inactive"}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setEditingEvaluation((prev) => ({
												...prev,
												eval_isActive: prev.eval_isActive ? 0 : 1,
											}));
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
											editingEvaluation.eval_isActive
												? "bg-green-600"
												: "bg-gray-200 dark:bg-gray-600"
										}`}
										title={
											editingEvaluation.eval_isActive
												? "Deactivate evaluation"
												: "Activate evaluation"
										}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
												editingEvaluation.eval_isActive
													? "translate-x-6"
													: "translate-x-1"
											}`}
										/>
									</button>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t dark:border-gray-700">
							<button
								onClick={() => setEditingEvaluation(null)}
								className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-1"
							>
								Cancel
							</button>
							<button
								onClick={handleUpdateEvaluation}
								disabled={
									!editingEvaluation?.eval_name?.trim() ||
									!editingEvaluation?.eval_eventId
								}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
							>
								Update Evaluation
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Question Form Modal */}
			{showAddQuestionForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
						{/* Fixed Header */}
						<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 flex-shrink-0">
							<h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
								Add Question to {selectedEvaluation?.eval_name}
							</h3>
							<button
								onClick={() => setShowAddQuestionForm(false)}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="flex-1 overflow-y-auto">
							<div className="p-4 sm:p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Question Type *
									</label>
									<select
										value={questionForm.typeId}
										onChange={(e) =>
											setQuestionForm((prev) => ({
												...prev,
												typeId: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
									>
										<option value="">Select question type</option>
										{questionTypes.map((type) => (
											<option key={type.evalT_id} value={type.evalT_id}>
												{type.evalT_name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Question *
									</label>
									<textarea
										value={questionForm.question}
										onChange={(e) =>
											setQuestionForm((prev) => ({
												...prev,
												question: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
										rows={3}
										placeholder="Enter your question"
									/>
								</div>

								{questionForm.typeId === "1" && (
									<div>
										<div className="flex items-center justify-between mb-2">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
												<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Choices *
												</label>
												<button
													onClick={addChoice}
													className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors w-full sm:w-auto"
												>
													<Plus className="w-3 h-3" />
													<span className="whitespace-nowrap">Add Choice</span>
												</button>
											</div>
										</div>
										<div className="space-y-2">
											{questionForm.choices.map((choice, index) => (
												<div key={index} className="flex items-center gap-2">
													<input
														type="text"
														value={choice}
														onChange={(e) =>
															updateChoice(index, e.target.value)
														}
														className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
														placeholder={`Choice ${index + 1}`}
													/>
													{questionForm.choices.length > 1 && (
														<button
															onClick={() => removeChoice(index)}
															className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
															title="Remove choice"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Fixed Footer */}
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t dark:border-gray-700 flex-shrink-0">
							<button
								onClick={() => setShowAddQuestionForm(false)}
								className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-1"
							>
								Cancel
							</button>
							<button
								onClick={handleAddQuestion}
								disabled={!questionForm.typeId || !questionForm.question.trim()}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
							>
								Add Question
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Question Form Modal */}
			{editingQuestion && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[95vw] sm:max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
						{/* Fixed Header */}
						<div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 flex-shrink-0">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
								Edit Question
							</h3>
							<button
								onClick={() => {
									setEditingQuestion(null);
									setEditingChoices([]);
								}}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="flex-1 overflow-y-auto">
							<div className="p-4 sm:p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Question *
									</label>
									<textarea
										value={editingQuestion.evalQ_text}
										onChange={(e) =>
											setEditingQuestion((prev) => ({
												...prev,
												evalQ_text: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
										rows={3}
										placeholder="Enter your question"
									/>
								</div>

								{editingQuestion.evalQ_typeId === 1 && (
									<div>
										<div className="flex items-center justify-between mb-2">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
												<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Choices *
												</label>
												<button
													onClick={addEditingChoice}
													className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors w-full sm:w-auto"
												>
													<Plus className="w-3 h-3" />
													<span className="whitespace-nowrap">Add Choice</span>
												</button>
											</div>
										</div>
										<div className="space-y-2">
											{editingChoices.map((choice, index) => (
												<div key={index} className="flex items-center gap-2">
													<input
														type="text"
														value={choice}
														onChange={(e) =>
															updateEditingChoice(index, e.target.value)
														}
														className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
														placeholder={`Choice ${index + 1}`}
													/>
													{editingChoices.length > 1 && (
														<button
															onClick={() => removeEditingChoice(index)}
															className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
															title="Remove choice"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Fixed Footer */}
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t dark:border-gray-700 flex-shrink-0">
							<button
								onClick={() => {
									setEditingQuestion(null);
									setEditingChoices([]);
								}}
								className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-1"
							>
								Cancel
							</button>
							<button
								onClick={handleUpdateQuestion}
								disabled={!editingQuestion?.evalQ_text?.trim()}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
							>
								Update Question
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Evaluation Confirmation */}
			<ConfirmDialog
				isOpen={showDeleteEvaluationDialog}
				onClose={() => setShowDeleteEvaluationDialog(false)}
				onConfirm={handleDeleteEvaluation}
				title="Delete Evaluation"
				message={`Are you sure you want to delete "${evaluationToDelete?.eval_name}"? This action cannot be undone and will also delete all associated questions and answers.`}
				confirmText="Delete Evaluation"
				cancelText="Cancel"
			/>

			{/* Delete Question Confirmation */}
			<ConfirmDialog
				isOpen={showDeleteQuestionDialog}
				onClose={() => setShowDeleteQuestionDialog(false)}
				onConfirm={handleDeleteQuestion}
				title="Delete Question"
				message={`Are you sure you want to delete this question? This action cannot be undone and will also delete all associated answers.`}
				confirmText="Delete Question"
				cancelText="Cancel"
			/>

			{/* Question Analysis Modal */}
			<QuestionAnalysisModal
				isOpen={showAnalysisModal}
				onClose={() => {
					setShowAnalysisModal(false);
					setSelectedQuestionForAnalysis(null);
				}}
				questionId={selectedQuestionForAnalysis?.evalQ_id}
			/>

			<Toaster position="top-right" />
		</>
	);
};

export default EvaluationManagementModal;
