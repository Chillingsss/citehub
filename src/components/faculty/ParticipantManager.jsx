import React, { useState } from "react";
import {
	Users,
	Search,
	AlertTriangle,
	Plus,
	Minus,
	ChevronDown,
	ChevronRight,
	GraduationCap,
	ChevronLeft,
} from "lucide-react";

const ParticipantManager = ({
	selectedActivity,
	students,
	participants,
	searchQuery,
	setSearchQuery,
	loading,
	handleAddParticipant,
	handleRemoveParticipant,
}) => {
	const [collapsedYearLevels, setCollapsedYearLevels] = useState(new Set());
	const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const STUDENTS_PER_PAGE = 10;

	const filterStudents = (students) => {
		let filtered = students;

		// Filter by search query
		if (searchQuery.trim()) {
			filtered = filtered.filter((student) => {
				const fullName = `${student.user_name}`.toLowerCase();
				const userId = student.user_id.toLowerCase();
				const query = searchQuery.toLowerCase();

				return fullName.includes(query) || userId.includes(query);
			});
		}

		// Filter by year level
		if (selectedYearLevelFilter !== "all") {
			filtered = filtered.filter(
				(student) => student.yearL_id?.toString() === selectedYearLevelFilter
			);
		}

		return filtered;
	};

	const isStudentParticipant = (studentId) => {
		return participants.some((p) => p.activityP_studentId === studentId);
	};

	const getStudentParticipationStatus = (studentId) => {
		const participant = participants.find(
			(p) => p.activityP_studentId === studentId
		);
		if (!participant) {
			return null; // Not assigned to activity
		}
		return participant.activityP_status === 1
			? "participating"
			: "not_participating";
	};

	const getStudentsByYearLevel = () => {
		const filteredStudents = filterStudents(students);
		const grouped = {};

		filteredStudents.forEach((student) => {
			const yearLevel = student.yearL_name || "No Year Level";
			const yearLevelId = student.yearL_id || "none";

			if (!grouped[yearLevel]) {
				grouped[yearLevel] = {
					id: yearLevelId,
					students: [],
				};
			}
			grouped[yearLevel].students.push(student);
		});

		// Sort year levels
		const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
			if (a === "No Year Level") return 1;
			if (b === "No Year Level") return -1;
			return a.localeCompare(b);
		});

		return sortedEntries;
	};

	const getPaginatedStudentsByYearLevel = () => {
		const yearLevelEntries = getStudentsByYearLevel();
		const allStudents = [];

		// Flatten all students with their year level info
		yearLevelEntries.forEach(([yearLevel, data]) => {
			data.students.forEach((student) => {
				allStudents.push({
					...student,
					displayYearLevel: yearLevel,
				});
			});
		});

		// Calculate pagination
		const totalStudents = allStudents.length;
		const totalPages = Math.ceil(totalStudents / STUDENTS_PER_PAGE);
		const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
		const endIndex = startIndex + STUDENTS_PER_PAGE;
		const paginatedStudents = allStudents.slice(startIndex, endIndex);

		// Group paginated students back by year level
		const paginatedGrouped = {};
		paginatedStudents.forEach((student) => {
			const yearLevel = student.displayYearLevel;
			if (!paginatedGrouped[yearLevel]) {
				paginatedGrouped[yearLevel] = {
					id: student.yearL_id || "none",
					students: [],
				};
			}
			paginatedGrouped[yearLevel].students.push(student);
		});

		const paginatedEntries = Object.entries(paginatedGrouped).sort(
			([a], [b]) => {
				if (a === "No Year Level") return 1;
				if (b === "No Year Level") return -1;
				return a.localeCompare(b);
			}
		);

		return {
			entries: paginatedEntries,
			pagination: {
				currentPage,
				totalPages,
				totalStudents,
				startIndex: startIndex + 1,
				endIndex: Math.min(endIndex, totalStudents),
			},
		};
	};

	const toggleYearLevelCollapse = (yearLevel) => {
		const newCollapsed = new Set(collapsedYearLevels);
		if (newCollapsed.has(yearLevel)) {
			newCollapsed.delete(yearLevel);
		} else {
			newCollapsed.add(yearLevel);
		}
		setCollapsedYearLevels(newCollapsed);
	};

	const getAvailableYearLevels = () => {
		const yearLevels = new Set();
		students.forEach((student) => {
			if (student.yearL_id && student.yearL_name) {
				yearLevels.add(
					JSON.stringify({
						id: student.yearL_id,
						name: student.yearL_name,
					})
				);
			}
		});
		return Array.from(yearLevels).map((level) => JSON.parse(level));
	};

	// Reset to page 1 when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, selectedYearLevelFilter]);

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	// Compute a limited set of visible pages (default 5)
	const getVisiblePages = (current, total, maxCount = 5) => {
		if (total <= 0) return [];
		const half = Math.floor(maxCount / 2);
		let start = Math.max(1, current - half);
		let end = Math.min(total, start + maxCount - 1);
		// readjust start if we don't have enough at the end
		start = Math.max(1, Math.min(start, end - maxCount + 1));
		const pages = [];
		for (let p = start; p <= end; p += 1) pages.push(p);
		return pages;
	};

	if (!selectedActivity) return null;

	return (
		<div className="p-3 bg-white rounded-xl shadow-sm sm:p-4 dark:bg-gray-700">
			<div className="flex flex-col gap-4 mb-4 sm:mb-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
					<div className="flex gap-3 items-center">
						<div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
							<Users className="w-5 h-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-200">
								Manage Participants
							</h3>
							<p className="text-sm font-medium text-green-600 dark:text-green-400">
								{selectedActivity.activity_name}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Add or remove students from this activity
							</p>
						</div>
					</div>

					{/* Search Bar */}
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
						<input
							type="text"
							placeholder="Search students..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="py-2 pr-4 pl-10 w-full text-sm bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
						/>
					</div>
				</div>

				{/* Year Level Filter */}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<div className="flex gap-2 items-center">
						<GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							Filter by Year Level:
						</span>
					</div>
					<div className="flex flex-wrap gap-2 ml-0 sm:ml-2">
						<button
							onClick={() => setSelectedYearLevelFilter("all")}
							className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
								selectedYearLevelFilter === "all"
									? "bg-blue-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
							}`}
						>
							All Students
						</button>
						{getAvailableYearLevels().map((yearLevel) => (
							<button
								key={yearLevel.id}
								onClick={() =>
									setSelectedYearLevelFilter(yearLevel.id.toString())
								}
								className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
									selectedYearLevelFilter === yearLevel.id.toString()
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
								}`}
							>
								{yearLevel.name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Students List */}
			{students.length === 0 ? (
				<div className="flex flex-col gap-3 justify-center items-center py-8 text-center">
					<AlertTriangle className="w-12 h-12 text-yellow-500" />
					<div>
						<p className="font-medium text-gray-700 dark:text-gray-300">
							No Students Found
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							No students found in your tribe
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					{(() => {
						const { entries, pagination } = getPaginatedStudentsByYearLevel();

						return (
							<>
								{/* Students by Year Level */}
								{entries.map(([yearLevel, data]) => {
									const isCollapsed = collapsedYearLevels.has(yearLevel);
									const studentsInLevel = data.students;
									const participantCount = studentsInLevel.filter((student) => {
										const status = getStudentParticipationStatus(
											student.user_id
										);
										return status === "participating";
									}).length;

									return (
										<div
											key={yearLevel}
											className="rounded-lg border border-gray-200 dark:border-gray-600"
										>
											{/* Year Level Header */}
											<button
												onClick={() => toggleYearLevelCollapse(yearLevel)}
												className="flex justify-between items-center p-3 w-full text-left bg-gray-50 rounded-t-lg transition-colors hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500"
											>
												<div className="flex gap-3 items-center min-w-0">
													<div className="p-1.5 bg-blue-100 rounded-lg dark:bg-blue-900/30">
														<GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
													</div>
													<div className="min-w-0">
														<h4 className="font-semibold text-gray-800 dark:text-gray-200">
															{yearLevel}
														</h4>
														<p className="text-xs text-gray-500 dark:text-gray-400">
															{studentsInLevel.length} students •{" "}
															{participantCount} participants
														</p>
													</div>
												</div>
												<div className="flex gap-2 items-center flex-shrink-0">
													{participantCount > 0 && (
														<span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-300 dark:bg-green-900/30">
															{participantCount}
														</span>
													)}
													{isCollapsed ? (
														<ChevronRight className="w-4 h-4 text-gray-500" />
													) : (
														<ChevronDown className="w-4 h-4 text-gray-500" />
													)}
												</div>
											</button>

											{/* Students in Year Level */}
											{!isCollapsed && (
												<div className="p-3 space-y-2 bg-white dark:bg-gray-700">
													{studentsInLevel.map((student) => {
														const status = getStudentParticipationStatus(
															student.user_id
														);
														return (
															<div
																key={student.user_id}
																className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-600"
															>
																<div className="flex flex-1 gap-3 items-center min-w-0">
																	<div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-blue-100 rounded-full dark:bg-blue-900/30">
																		<span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
																			{student.user_name[0]}
																		</span>
																	</div>
																	<div className="flex-1 min-w-0">
																		<p className="font-medium text-gray-800 truncate dark:text-gray-200">
																			{student.user_name}
																		</p>
																		{/* Mobile: Stack info vertically, Desktop: Keep horizontal */}
																		<div className="flex flex-col gap-1 mt-1 sm:flex-row sm:items-center sm:gap-2">
																			<p className="text-sm text-gray-500 dark:text-gray-400">
																				{student.user_id}
																			</p>
																			<span className="hidden sm:inline text-gray-400 dark:text-gray-500">
																				•
																			</span>
																			<p className="text-sm text-gray-500 dark:text-gray-400">
																				{student.tribe_name}
																			</p>
																			{student.yearL_name && (
																				<>
																					<span className="text-sm text-blue-600 rounded">
																						{student.yearL_name}
																					</span>
																				</>
																			)}
																		</div>
																	</div>
																</div>

																<div className="flex flex-shrink-0 gap-2 items-center">
																	{/* Show participation status based on activityP_status */}
																	{status ? (
																		<span
																			className={`px-2 py-1 text-xs font-medium rounded-full ${
																				status === "participating"
																					? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
																					: "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/30"
																			}`}
																		>
																			{status === "participating"
																				? "Participating"
																				: "Not Participating"}
																		</span>
																	) : (
																		<span className="px-2 py-1 text-xs font-medium rounded-full text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30">
																			No Status
																		</span>
																	)}
																	<button
																		onClick={() => {
																			if (status === "participating") {
																				handleRemoveParticipant(
																					student.user_id
																				);
																			} else if (
																				status === "not_participating"
																			) {
																				handleRemoveParticipant(
																					student.user_id
																				);
																			} else {
																				handleAddParticipant(student.user_id);
																			}
																		}}
																		disabled={loading}
																		className={`flex gap-1 items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-0 ${
																			status === "participating" ||
																			status === "not_participating"
																				? "text-red-600 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50"
																				: "text-green-600 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50"
																		} ${
																			loading
																				? "opacity-50 cursor-not-allowed"
																				: ""
																		}`}
																	>
																		{status === "participating" ||
																		status === "not_participating" ? (
																			<>
																				<Minus className="w-3 h-3" />
																				<span className="hidden sm:inline">
																					Remove
																				</span>
																			</>
																		) : (
																			<>
																				<Plus className="w-3 h-3" />
																				<span className="hidden sm:inline">
																					Add
																				</span>
																			</>
																		)}
																	</button>
																</div>
															</div>
														);
													})}
												</div>
											)}
										</div>
									);
								})}

								{/* Bottom Pagination */}
								{pagination.totalStudents > STUDENTS_PER_PAGE && (
									<div className="mt-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-600">
										<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
											<div className="text-sm text-gray-600 dark:text-gray-300">
												Showing {pagination.startIndex} to {pagination.endIndex}{" "}
												of {pagination.totalStudents} students
											</div>
											{/* Mobile compact controls */}
											<div className="flex justify-between items-center sm:hidden">
												<button
													onClick={() => handlePageChange(currentPage - 1)}
													disabled={currentPage === 1}
													className="flex gap-1 items-center px-3 py-2 text-sm text-gray-700 bg-white rounded border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
												>
													<ChevronLeft className="w-4 h-4" />
													<span>Prev</span>
												</button>
												<span className="mx-2 text-sm text-gray-600 dark:text-gray-300">
													Page {pagination.currentPage} of{" "}
													{pagination.totalPages}
												</span>
												<button
													onClick={() => handlePageChange(currentPage + 1)}
													disabled={currentPage === pagination.totalPages}
													className="flex gap-1 items-center px-3 py-2 text-sm text-gray-700 bg-white rounded border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
												>
													<span>Next</span>
													<ChevronRight className="w-4 h-4" />
												</button>
											</div>
											{/* Desktop/Tablet numeric pages (max 5 visible) */}
											<div className="hidden sm:flex gap-1 items-center">
												<button
													onClick={() => handlePageChange(currentPage - 1)}
													disabled={currentPage === 1}
													className="flex justify-center items-center w-8 h-8 text-gray-500 bg-white rounded border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
												>
													<ChevronLeft className="w-4 h-4" />
												</button>
												{getVisiblePages(
													currentPage,
													pagination.totalPages,
													5
												).map((page) => (
													<button
														key={page}
														onClick={() => handlePageChange(page)}
														className={`flex justify-center items-center w-8 h-8 text-sm font-medium rounded border transition-colors ${
															page === currentPage
																? "bg-blue-600 text-white border-blue-600"
																: "text-gray-700 bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
														}`}
													>
														{page}
													</button>
												))}
												<button
													onClick={() => handlePageChange(currentPage + 1)}
													disabled={currentPage === pagination.totalPages}
													className="ml-1 flex justify-center items-center w-8 h-8 text-gray-500 bg-white rounded border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
												>
													<ChevronRight className="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								)}
							</>
						);
					})()}
				</div>
			)}

			{/* Participants Summary */}
			{participants.length > 0 && (
				<div className="p-3 mt-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
					<h4 className="mb-3 text-sm font-medium text-blue-800 dark:text-blue-300">
						Current Participants ({participants.length})
					</h4>

					{/* Participants by Year Level */}
					{(() => {
						const participantsByYear = {};
						participants.forEach((participant) => {
							// Find the student data to get year level
							const studentData = students.find(
								(s) => s.user_id === participant.activityP_studentId
							);
							const yearLevel = studentData?.yearL_name || "No Year Level";

							if (!participantsByYear[yearLevel]) {
								participantsByYear[yearLevel] = [];
							}
							participantsByYear[yearLevel].push({
								...participant,
								yearL_name: studentData?.yearL_name,
							});
						});

						return Object.entries(participantsByYear).map(
							([yearLevel, yearParticipants]) => (
								<div key={yearLevel} className="mb-3 last:mb-0">
									<div className="flex gap-2 items-center mb-2">
										<span className="text-xs font-medium text-blue-700 dark:text-blue-300">
											{yearLevel} ({yearParticipants.length})
										</span>
									</div>
									<div className="flex flex-wrap gap-1.5 ml-5">
										{yearParticipants.map((participant) => {
											const isActiveParticipant =
												participant.activityP_status === 1;
											return (
												<span
													key={participant.activityP_id}
													className={`px-2 py-1 text-xs font-medium rounded-full ${
														isActiveParticipant
															? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
															: "text-gray-500 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-transparent dark:border-gray-600"
													}`}
												>
													{participant.user_name}
												</span>
											);
										})}
									</div>
								</div>
							)
						);
					})()}
				</div>
			)}
		</div>
	);
};

export default ParticipantManager;
