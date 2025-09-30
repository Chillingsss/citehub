import React from "react";
import {
	Calendar,
	Search,
	X,
	CheckCircle,
	LogIn,
	LogOut,
	XCircle,
	Users,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	ChevronLeft,
	ChevronRight as ChevronRightIcon,
} from "lucide-react";

const StudentsInTribeSectionComponent = ({
	students,
	attendanceRecords,
	selectedDate,
	setSelectedDate,
	searchQuery,
	setSearchQuery,
}) => {
	// Year level UI state
	const [collapsedYearLevels, setCollapsedYearLevels] = React.useState(
		new Set()
	);
	const [selectedYearLevelFilter, setSelectedYearLevelFilter] =
		React.useState("all");
	const [currentPage, setCurrentPage] = React.useState(1);
	const studentsPerPage = 10;

	// Reset to page 1 when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, selectedYearLevelFilter, selectedDate]);

	const formatTime = (datetime) => {
		if (!datetime) return "-";
		return new Date(datetime).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDate = (datetime) => {
		if (!datetime) return "-";
		return new Date(datetime).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const filteredAttendanceByDate = React.useMemo(() => {
		if (!Array.isArray(attendanceRecords)) return [];
		return attendanceRecords.filter((record) => {
			if (!record.attendance_timeIn) return false;
			const recordDate = new Date(record.attendance_timeIn);
			const philippinesDate = new Date(
				recordDate.getTime() + 8 * 60 * 60 * 1000
			);
			const recordDateString = philippinesDate.toISOString().split("T")[0];
			return recordDateString === selectedDate;
		});
	}, [attendanceRecords, selectedDate]);

	const attendanceByStudentId = React.useMemo(() => {
		const map = new Map();
		filteredAttendanceByDate.forEach((r) => {
			map.set(r.attendance_studentId, r);
		});
		return map;
	}, [filteredAttendanceByDate]);

	const getStudentAttendanceStatusForDate = (studentId) => {
		const record = attendanceByStudentId.get(studentId);
		if (!record) return "No record";
		if (record.attendance_timeIn && !record.attendance_timeOut)
			return "Time In";
		if (record.attendance_timeIn && record.attendance_timeOut)
			return "Completed";
		return "Absent";
	};

	const sortStudentsByNewestAttendanceForDate = (studentsList) => {
		return [...studentsList].sort((a, b) => {
			const recordA = attendanceByStudentId.get(a.user_id);
			const recordB = attendanceByStudentId.get(b.user_id);
			const statusA = getStudentAttendanceStatusForDate(a.user_id);
			const statusB = getStudentAttendanceStatusForDate(b.user_id);
			const priorityOrder = {
				Completed: 3,
				"Time In": 2,
				"No record": 1,
				Absent: 0,
			};
			const priorityA = priorityOrder[statusA] || 0;
			const priorityB = priorityOrder[statusB] || 0;
			if (priorityA !== priorityB) return priorityB - priorityA;
			if (recordA && recordB) {
				const timeA = new Date(recordA.attendance_timeIn).getTime();
				const timeB = new Date(recordB.attendance_timeIn).getTime();
				return timeB - timeA;
			}
			if (recordA && !recordB) return -1;
			if (!recordA && recordB) return 1;
			const nameA = `${a.user_name}`.toLowerCase();
			const nameB = `${b.user_name}`.toLowerCase();
			return nameA.localeCompare(nameB);
		});
	};

	const getAvailableYearLevels = () => {
		const levels = new Set();
		students.forEach((s) => {
			if (s.yearL_id && s.yearL_name) {
				levels.add(JSON.stringify({ id: s.yearL_id, name: s.yearL_name }));
			}
		});
		return Array.from(levels).map((v) => JSON.parse(v));
	};

	const filteredStudents = React.useMemo(() => {
		let list = students;
		const q = (searchQuery || "").trim().toLowerCase();
		if (q) {
			list = list.filter((student) => {
				const fullName = `${student.user_name}`.toLowerCase();
				const studentId = String(student.user_id).toLowerCase();
				return fullName.includes(q) || studentId.includes(q);
			});
		}
		if (selectedYearLevelFilter !== "all") {
			list = list.filter(
				(s) => String(s.yearL_id) === String(selectedYearLevelFilter)
			);
		}
		return list;
	}, [students, searchQuery, selectedYearLevelFilter]);

	// Sort students by attendance status and time for the selected date
	const sortedStudents = React.useMemo(() => {
		return sortStudentsByNewestAttendanceForDate(filteredStudents);
	}, [filteredStudents, selectedDate, attendanceByStudentId]);

	const getStudentsByYearLevel = () => {
		const grouped = {};
		// Use the already sorted students instead of sorting again
		sortedStudents.forEach((s) => {
			const levelName = s.yearL_name || "No Year Level";
			const levelId = s.yearL_id || "none";
			if (!grouped[levelName])
				grouped[levelName] = { id: levelId, students: [] };
			grouped[levelName].students.push(s);
		});
		return Object.entries(grouped).sort(([a], [b]) => {
			if (a === "No Year Level") return 1;
			if (b === "No Year Level") return -1;
			return a.localeCompare(b);
		});
	};

	const toggleYearLevelCollapse = (yearLevel) => {
		const next = new Set(collapsedYearLevels);
		if (next.has(yearLevel)) next.delete(yearLevel);
		else next.add(yearLevel);
		setCollapsedYearLevels(next);
	};

	const todayPhilippinesIso = (() => {
		const now = new Date();
		const philippinesTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
		return philippinesTime.toISOString().split("T")[0];
	})();

	// Pagination logic
	const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);
	const paginatedStudents = sortedStudents.slice(
		(currentPage - 1) * studentsPerPage,
		currentPage * studentsPerPage
	);

	const handlePageChange = (page) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	// Generate visible page numbers for pagination
	const getVisiblePages = () => {
		const maxVisiblePages = 5; // Show up to 5 pages on desktop, fewer on mobile
		const pages = [];
		const startPage = Math.max(
			1,
			currentPage - Math.floor(maxVisiblePages / 2)
		);
		const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
		return pages;
	};

	return (
		<div className="p-3 sm:p-4 md:p-6">
			{/* Filters */}
			<div className="mb-4 space-y-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
						<Calendar className="w-4 h-4" />
						Select Date:
					</label>
					<input
						type="date"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						max={todayPhilippinesIso}
						className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-400"
					/>
					{selectedDate !== todayPhilippinesIso && (
						<button
							onClick={() => setSelectedDate(todayPhilippinesIso)}
							className="text-sm text-blue-600 whitespace-nowrap hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
						>
							Back to Today
						</button>
					)}
				</div>

				<div className="relative">
					<div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
						<Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
					</div>
					<input
						type="text"
						placeholder="Search by name or ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="py-2 pr-4 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-blue-400"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="flex absolute inset-y-0 right-0 items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{/* Year Level Filter */}
			<div className="mb-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<div className="flex gap-2 items-center">
						<GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							Filter by Year Level:
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
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
						{getAvailableYearLevels().map((level) => (
							<button
								key={level.id}
								onClick={() => setSelectedYearLevelFilter(String(level.id))}
								className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
									selectedYearLevelFilter === String(level.id)
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
								}`}
							>
								{level.name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Header */}
			<div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
				<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
					Students in Your Tribe ({sortedStudents.length}/{students.length})
				</h3>
				<div className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
					<div className="flex flex-wrap gap-2 items-center">
						<span className="font-medium text-gray-700 dark:text-gray-300">
							{new Date(selectedDate).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</span>
					</div>
				</div>
			</div>

			{/* Content grouped by Year Level */}
			{students.length === 0 ? (
				<p className="py-8 text-sm text-center text-gray-500 sm:text-base dark:text-gray-400">
					No students found in your tribe.
				</p>
			) : sortedStudents.length === 0 ? (
				<div className="py-8 text-center">
					<Search className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
					<p className="mb-2 text-sm text-gray-500 sm:text-base dark:text-gray-400">
						No students found matching "{searchQuery}"
					</p>
					<button
						onClick={() => setSearchQuery("")}
						className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
					>
						Clear search
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{paginatedStudents.length > 0 &&
						getStudentsByYearLevel()
							.filter(([_, data]) =>
								data.students.some((s) =>
									paginatedStudents.some((ps) => ps.user_id === s.user_id)
								)
							)
							.map(([yearLevel, data]) => {
								const isCollapsed = collapsedYearLevels.has(yearLevel);
								const studentsInLevel = data.students.filter((s) =>
									paginatedStudents.some((ps) => ps.user_id === s.user_id)
								);
								const stats = (() => {
									let completed = 0;
									let timeIn = 0;
									let noRecord = 0;
									studentsInLevel.forEach((s) => {
										const st = getStudentAttendanceStatusForDate(s.user_id);
										if (st === "Completed") completed++;
										else if (st === "Time In") timeIn++;
										else noRecord++;
									});
									return { completed, timeIn, noRecord };
								})();

								return (
									<div
										key={yearLevel}
										className="rounded-lg border border-gray-200 dark:border-gray-600"
									>
										<button
											onClick={() => toggleYearLevelCollapse(yearLevel)}
											className="flex justify-between items-center p-3 w-full text-left bg-gray-50 rounded-t-lg transition-colors hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500"
										>
											<div className="flex gap-3 items-center">
												<div className="p-1.5 bg-blue-100 rounded-lg dark:bg-blue-900/30">
													<GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
												</div>
												<div>
													<h4 className="font-semibold text-gray-800 dark:text-gray-200">
														{yearLevel}
													</h4>
													<div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
														<span>{studentsInLevel.length} students</span>
														{stats.completed > 0 && (
															<span className="text-green-600 dark:text-green-400">
																• {stats.completed} completed
															</span>
														)}
														{stats.timeIn > 0 && (
															<span className="text-yellow-600 dark:text-yellow-400">
																• {stats.timeIn} time in
															</span>
														)}
														{stats.noRecord > 0 && (
															<span className="text-red-600 dark:text-red-400">
																• {stats.noRecord} no record
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="flex gap-2 items-center">
												{stats.completed + stats.timeIn > 0 && (
													<span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:text-blue-300 dark:bg-blue-900/30">
														{stats.completed + stats.timeIn}
													</span>
												)}
												{isCollapsed ? (
													<ChevronRight className="w-4 h-4 text-gray-500" />
												) : (
													<ChevronDown className="w-4 h-4 text-gray-500" />
												)}
											</div>
										</button>

										{!isCollapsed && (
											<div className="p-3 space-y-3 bg-white dark:bg-gray-700">
												{studentsInLevel.map((student) => {
													const status = getStudentAttendanceStatusForDate(
														student.user_id
													);
													const record = attendanceByStudentId.get(
														student.user_id
													);

													return (
														<div
															key={student.user_id}
															className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200 sm:p-4 dark:bg-gray-700 dark:border-gray-600 hover:shadow-md"
														>
															<div className="flex gap-3 items-start">
																<div className="flex-shrink-0">
																	{student.user_avatar ? (
																		<img
																			src={student.user_avatar}
																			alt={`${student.user_name}`}
																			className="object-cover w-10 h-10 rounded-full ring-2 ring-gray-100 sm:w-12 sm:h-12 dark:ring-gray-600"
																		/>
																	) : (
																		<div className="flex justify-center items-center w-10 h-10 text-xs font-semibold text-white bg-blue-500 rounded-full ring-2 ring-gray-100 sm:w-12 sm:h-12 sm:text-sm dark:ring-gray-600">
																			{`${student.user_name?.charAt(0) || ""}`}
																		</div>
																	)}
																</div>

																<div className="flex-1 min-w-0">
																	<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
																		<div className="min-w-0">
																			<p className="text-sm font-semibold leading-tight text-gray-800 sm:text-base dark:text-gray-200">
																				{student.user_name}
																			</p>
																			<div className="flex flex-wrap gap-2 items-center mt-0.5">
																				<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
																					ID: {student.user_id}
																				</p>
																				{student.yearL_name && (
																					<span className="px-1.5 py-0.5 text-xs text-blue-600 bg-blue-100 rounded dark:bg-blue-900/30 dark:text-blue-400">
																						{student.yearL_name}
																					</span>
																				)}
																			</div>
																		</div>
																		<div className="flex-shrink-0">
																			<span
																				className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm ${
																					status === "Completed"
																						? "bg-green-100 text-green-800 ring-1 ring-green-200 dark:bg-green-900 dark:text-green-200 dark:ring-green-700"
																						: status === "Time In"
																						? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:ring-yellow-700"
																						: "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-900 dark:text-red-200 dark:ring-red-700"
																				}`}
																			>
																				{status === "Completed" && (
																					<CheckCircle className="mr-1 w-4 h-4" />
																				)}
																				{status === "Time In" && (
																					<LogIn className="mr-1 w-4 h-4 text-yellow-500" />
																				)}
																				{(status === "Absent" ||
																					status === "No record") && (
																					<XCircle className="mr-1 w-4 h-4 text-red-500" />
																				)}
																				{status}
																			</span>
																		</div>
																	</div>

																	{record && (
																		<div className="p-2 mt-2 bg-gray-50 rounded-lg sm:p-3 sm:mt-3 dark:bg-gray-800">
																			<div className="flex flex-col gap-2 text-xs sm:text-sm">
																				<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
																					<Calendar className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																					<span>
																						{formatDate(
																							record.attendance_timeIn
																						)}
																					</span>
																				</div>
																				<div className="flex flex-col gap-2 text-gray-600 sm:flex-row sm:gap-4 dark:text-gray-300">
																					<div className="flex gap-2 items-center">
																						<LogIn className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																						<span className="font-medium">
																							In:
																						</span>
																						<span>
																							{formatTime(
																								record.attendance_timeIn
																							)}
																						</span>
																					</div>
																					<div className="flex gap-2 items-center">
																						<LogOut className="mr-1 w-4 h-4 text-red-600 dark:text-red-400" />
																						<span className="font-medium">
																							Out:
																						</span>
																						<span>
																							{formatTime(
																								record.attendance_timeOut
																							)}
																						</span>
																					</div>
																				</div>
																				<div className="flex flex-col gap-1 pt-1 border-t border-gray-200 dark:border-gray-600">
																					{record.sbo_name && (
																						<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
																							<Users className="mr-1 w-4 h-4 text-blue-600 dark:text-blue-400" />
																							<span className="text-xs font-medium text-blue-600 dark:text-blue-400">
																								SBO:
																							</span>
																							<span className="text-xs">
																								{record.sbo_name}
																							</span>
																						</div>
																					)}
																					{record.faculty_name && (
																						<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
																							<Users className="mr-1 w-4 h-4 text-blue-600 dark:text-blue-400" />
																							<span className="text-xs font-medium text-purple-600 dark:text-purple-400">
																								Faculty:
																							</span>
																							<span className="text-xs">
																								{record.faculty_name}
																							</span>
																						</div>
																					)}
																				</div>
																			</div>
																		</div>
																	)}
																</div>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
				</div>
			)}

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex flex-col gap-3 items-center mt-4 sm:flex-row sm:justify-between">
					<div className="text-xs text-gray-600 sm:text-sm dark:text-gray-400">
						Showing {(currentPage - 1) * studentsPerPage + 1} to{" "}
						{Math.min(currentPage * studentsPerPage, sortedStudents.length)} of{" "}
						{sortedStudents.length} students
					</div>
					<div className="flex gap-1 items-center sm:gap-2">
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-600"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<div className="flex gap-1">
							{getVisiblePages().map((page) => (
								<button
									key={page}
									onClick={() => handlePageChange(page)}
									className={`px-2 py-1 sm:px-3 sm:py-1 text-sm rounded-lg ${
										currentPage === page
											? "bg-blue-600 text-white"
											: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
									}`}
								>
									{page}
								</button>
							))}
						</div>
						<button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-600"
						>
							<ChevronRightIcon className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

const StudentsInTribeSection = React.memo(StudentsInTribeSectionComponent);

export default StudentsInTribeSection;
