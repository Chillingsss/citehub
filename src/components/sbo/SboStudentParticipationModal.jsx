import React, { useState, useEffect } from "react";
import {
	X,
	Users,
	CheckCircle,
	XCircle,
	RefreshCw,
	Search,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import {
	updateStudentParticipation,
	getActivityParticipants,
} from "../../utils/sbo";

const SboStudentParticipationModal = ({ isOpen, onClose, activity, sboId }) => {
	const [tribes, setTribes] = useState([]);
	const [studentsByTribe, setStudentsByTribe] = useState({});
	const [participationData, setParticipationData] = useState({});
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTribe, setSelectedTribe] = useState(null);
	const [expandedTribes, setExpandedTribes] = useState(new Set());

	useEffect(() => {
		if (isOpen && activity) {
			// Fetch participation data which now includes tribes and students
			fetchParticipationData();
		}
	}, [isOpen, activity]);

	useEffect(() => {
		if (selectedTribe && !studentsByTribe[selectedTribe]) {
			fetchStudentsInTribe(selectedTribe);
		}
	}, [selectedTribe, studentsByTribe, tribes]);

	const fetchParticipationData = async () => {
		try {
			const result = await getActivityParticipants(activity.activity_id);
			if (result.success) {
				// Group students by tribe from the participation data
				const tribesMap = {};
				const participationMap = {};

				result.participants.forEach((participant) => {
					const tribeId = participant.user_tribeId;
					const tribeName = participant.tribe_name;

					// Store participation data
					participationMap[participant.activityP_studentId] = {
						status: participant.activityP_status,
						tribeId: participant.user_tribeId,
						user_name: participant.user_name,
						yearL_name: participant.yearL_name,
					};

					// Group by tribe
					if (!tribesMap[tribeId]) {
						tribesMap[tribeId] = {
							tribe_id: tribeId,
							tribe_name: tribeName,
							students: [],
						};
					}

					tribesMap[tribeId].students.push({
						user_id: participant.activityP_studentId,
						user_name: participant.user_name,
						yearL_name: participant.yearL_name,
						activityP_status: participant.activityP_status,
					});
				});

				setParticipationData(participationMap);
				setTribes(Object.values(tribesMap));

				// Auto-expand first tribe if available
				if (Object.values(tribesMap).length > 0) {
					const firstTribe = Object.values(tribesMap)[0];
					setSelectedTribe(firstTribe.tribe_id);
					setExpandedTribes(new Set([firstTribe.tribe_id]));

					// Set students for the first tribe
					setStudentsByTribe((prev) => ({
						...prev,
						[firstTribe.tribe_id]: firstTribe.students,
					}));
				}
			}
		} catch (error) {
			console.error("Error fetching participation data:", error);
		}
	};

	const fetchStudentsInTribe = async (tribeId) => {
		try {
			// Get students for this tribe from the tribes data
			const tribe = tribes.find((t) => t.tribe_id === tribeId);
			if (tribe) {
				setStudentsByTribe((prev) => ({
					...prev,
					[tribeId]: tribe.students,
				}));
			}
		} catch (error) {
			console.error("Error fetching students in tribe:", error);
		}
	};

	const handleParticipationToggle = async (studentId, currentStatus) => {
		try {
			const newStatus = currentStatus === 1 ? 0 : 1;
			const result = await updateStudentParticipation(
				sboId,
				activity.activity_id,
				studentId,
				newStatus
			);

			if (result.success) {
				// Update local state
				setParticipationData((prev) => ({
					...prev,
					[studentId]: {
						...prev[studentId],
						status: newStatus,
					},
				}));
			}
		} catch (error) {
			console.error("Error updating participation:", error);
		}
	};

	const toggleTribeExpansion = (tribeId) => {
		setExpandedTribes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tribeId)) {
				newSet.delete(tribeId);
			} else {
				newSet.add(tribeId);
			}
			return newSet;
		});

		// Auto-select tribe when expanding
		if (!expandedTribes.has(tribeId)) {
			setSelectedTribe(tribeId);
		}
	};

	const getParticipationStatus = (studentId) => {
		// Default to 1 (participating) if no record exists
		return participationData[studentId]?.status !== undefined
			? participationData[studentId].status
			: 1;
	};

	const filteredTribes = tribes.filter((tribe) =>
		tribe.tribe_name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (!isOpen || !activity) return null;

	return (
		<>
			<style>
				{`
					.line-clamp-2 {
						display: -webkit-box;
						-webkit-line-clamp: 2;
						-webkit-box-orient: vertical;
						overflow: hidden;
					}
				`}
			</style>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-end sm:items-center bg-black bg-opacity-50 backdrop-blur-sm">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-t-xl sm:rounded-lg w-full max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col overflow-hidden sm:my-4">
					{/* Header */}
					<div className="sticky top-0 z-20 flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700 bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur">
						<div className="flex gap-3 items-center">
							<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
								<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
									Manage Student Participation
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{activity.activity_name} • {activity.event_title}
								</p>
							</div>
						</div>
						<div className="flex gap-2 items-center">
							<button
								onClick={() => {
									fetchParticipationData();
								}}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh data"
							>
								<RefreshCw className="w-4 h-4" />
								<span className="hidden sm:inline">Refresh</span>
							</button>
							<button
								onClick={onClose}
								className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
					</div>

					{/* Search Bar */}
					<div className="sticky top-14 sm:top-16 z-10 flex-shrink-0 p-3 sm:p-4 border-b dark:border-gray-700 bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search tribes..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
							/>
						</div>
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1">
						<div className="p-4 space-y-4 sm:p-6">
							{loading ? (
								<div className="flex justify-center items-center py-12">
									<div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
								</div>
							) : filteredTribes.length === 0 ? (
								<div className="py-8 text-center">
									<Users className="mx-auto mb-2 w-8 h-8 text-gray-400" />
									<p className="text-gray-600 dark:text-gray-400">
										{searchTerm
											? "No tribes found matching your search."
											: "No tribes found."}
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{filteredTribes.map((tribe) => (
										<div
											key={tribe.tribe_id}
											className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
										>
											{/* Tribe Header */}
											<button
												onClick={() => toggleTribeExpansion(tribe.tribe_id)}
												className="w-full flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
											>
												<div className="flex gap-3 items-center">
													<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
														<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
													</div>
													<div className="text-left">
														<h3 className="font-semibold text-gray-800 dark:text-gray-200">
															{tribe.tribe_name}
														</h3>
														<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
															Click to{" "}
															{expandedTribes.has(tribe.tribe_id)
																? "collapse"
																: "expand"}
														</p>
													</div>
												</div>
												<div className="flex gap-2 items-center">
													{expandedTribes.has(tribe.tribe_id) && (
														<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
															{
																Object.values(participationData).filter(
																	(participant) =>
																		participant.tribeId === tribe.tribe_id
																).length
															}{" "}
															students assigned
														</span>
													)}
													<div
														className={`w-5 h-5 transform transition-transform ${
															expandedTribes.has(tribe.tribe_id)
																? "rotate-180"
																: ""
														}`}
													>
														<svg
															className="w-5 h-5 text-gray-400"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M19 9l-7 7-7-7"
															/>
														</svg>
													</div>
												</div>
											</button>

											{/* Tribe Students */}
											{expandedTribes.has(tribe.tribe_id) && (
												<div className="border-t border-gray-200 dark:border-gray-600">
													{!studentsByTribe[tribe.tribe_id] ? (
														<div className="p-4 text-center">
															<div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin mx-auto mb-2"></div>
															<p className="text-sm text-gray-500 dark:text-gray-400">
																Loading students...
															</p>
														</div>
													) : studentsByTribe[tribe.tribe_id].length === 0 ? (
														<div className="p-4 text-center">
															<p className="text-sm text-gray-500 dark:text-gray-400">
																No students in this tribe
															</p>
														</div>
													) : (
														<div className="p-4 space-y-3">
															{studentsByTribe[tribe.tribe_id].map(
																(student) => {
																	const participationStatus =
																		getParticipationStatus(student.user_id);
																	return (
																		<div
																			key={student.user_id}
																			className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-600 rounded-lg"
																		>
																			<div className="flex gap-3 items-center">
																				<div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
																					<span className="text-sm font-medium text-blue-600 dark:text-blue-400">
																						{student.user_name?.[0]}
																					</span>
																				</div>
																				<div>
																					<p className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
																						{student.user_name}
																					</p>
																					<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
																						{student.yearL_name ||
																							"No year level"}
																					</p>
																				</div>
																			</div>
																			<div className="flex gap-2 items-center">
																				<button
																					onClick={() =>
																						handleParticipationToggle(
																							student.user_id,
																							participationStatus
																						)
																					}
																					className={`flex gap-2 items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
																						participationStatus === 1
																							? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
																							: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
																					}`}
																				>
																					{participationStatus === 1 ? (
																						<>
																							<CheckCircle className="w-4 h-4" />
																							Participating
																						</>
																					) : (
																						<>
																							<XCircle className="w-4 h-4" />
																							Not Participating
																						</>
																					)}
																				</button>
																			</div>
																		</div>
																	);
																}
															)}
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
		</>
	);
};

export default SboStudentParticipationModal;
