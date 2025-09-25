import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import {
	X,
	Calendar as CalendarIcon,
	RefreshCw,
	Search,
	CheckCircle,
	XCircle,
	Clock,
	Users,
	GraduationCap,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import {
	getAllTribes,
	getStudentsInTribe,
	getAttendanceSessions,
	getTodayAttendance,
} from "../../utils/sbo";

const AdminSessionRecordsModal = ({ isOpen, onClose, session }) => {
	const [tribes, setTribes] = useState([]);
	const [selectedTribe, setSelectedTribe] = useState(null);
	const [students, setStudents] = useState([]);
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [collapsedYearLevels, setCollapsedYearLevels] = useState(new Set());
	const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState("all");
	const [selectedDate, setSelectedDate] = useState(() => {
		const now = new Date();
		const philippinesTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
		return philippinesTime.toISOString().split("T")[0];
	});
	const scrollRef = useRef(null);

	useEffect(() => {
		if (!isOpen) return;
		init();
	}, [isOpen]);

	const init = async () => {
		try {
			setLoading(true);
			const loadingToast = toast.loading("Loading records...");
			await Promise.all([fetchTribes(), fetchTodayAttendance()]);
			toast.dismiss(loadingToast);
		} catch (e) {
			console.error(e);
			toast.error("Failed to load records");
		} finally {
			setLoading(false);
		}
	};

	const fetchTribes = async () => {
		const res = await getAllTribes();
		if (res.success) {
			setTribes(res.tribes);
			if (!selectedTribe && res.tribes.length > 0) {
				setSelectedTribe(res.tribes[0]);
				fetchStudents(res.tribes[0].tribe_id);
			}
		}
	};

	const fetchStudents = async (tribeId) => {
		if (tribeId === "all") {
			// Fetch students from all tribes
			const allStudents = [];
			for (const tribe of tribes) {
				const res = await getStudentsInTribe(tribe.tribe_id);
				if (res.success) {
					allStudents.push(...res.students);
				}
			}
			setStudents(allStudents);
		} else {
			const res = await getStudentsInTribe(tribeId);
			setStudents(res.success ? res.students : []);
		}
	};

	const fetchTodayAttendance = async () => {
		// For admin, use SBO endpoint that returns today's records (all tribes)
		const res = await getTodayAttendance("admin");
		setAttendanceRecords(res.success ? res.records : []);
	};

	const handleRefresh = async () => {
		try {
			const loadingToast = toast.loading("Refreshing...");
			await Promise.all([
				fetchTribes(),
				selectedTribe
					? fetchStudents(
							selectedTribe.tribe_id === "all" ? "all" : selectedTribe.tribe_id
					  )
					: Promise.resolve(),
				fetchTodayAttendance(),
				getAttendanceSessions(), // keep API warm/in sync (even if not used here)
			]);
			toast.dismiss(loadingToast);
			toast.success("Refreshed", { duration: 1500 });
		} catch (e) {
			console.error(e);
			toast.error("Failed to refresh");
		}
	};

	const filterStudents = useMemo(() => {
		let filtered = students;
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			filtered = filtered.filter(
				(s) =>
					`${s.user_name}`.toLowerCase().includes(q) ||
					String(s.user_id).toLowerCase().includes(q)
			);
		}
		if (selectedYearLevelFilter !== "all") {
			filtered = filtered.filter(
				(s) => String(s.yearL_id) === String(selectedYearLevelFilter)
			);
		}
		return filtered;
	}, [students, searchQuery, selectedYearLevelFilter]);

	const filteredAttendanceByDate = useMemo(() => {
		if (!Array.isArray(attendanceRecords)) return [];
		// Convert record date to PH date string and compare with selectedDate
		return attendanceRecords.filter((rec) => {
			if (!rec.attendance_timeIn) return false;
			const d = new Date(rec.attendance_timeIn);
			const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
			const dateStr = ph.toISOString().split("T")[0];
			return dateStr === selectedDate;
		});
	}, [attendanceRecords, selectedDate]);

	// Sort students so the newest transaction appears on top
	const sortStudentsByNewestForDate = (list) => {
		const priorityOrder = {
			Completed: 3,
			"Time In": 2,
			"No record": 1,
			Absent: 0,
		};
		return [...list].sort((a, b) => {
			const recA = getStudentRecord(a.user_id);
			const recB = getStudentRecord(b.user_id);
			const statusA = getStatusForStudent(a.user_id);
			const statusB = getStatusForStudent(b.user_id);
			const prA = priorityOrder[statusA] || 0;
			const prB = priorityOrder[statusB] || 0;
			if (prA !== prB) return prB - prA; // higher priority first
			if (recA && recB) {
				const tA = new Date(recA.attendance_timeIn).getTime();
				const tB = new Date(recB.attendance_timeIn).getTime();
				return tB - tA; // newest first
			}
			if (recA && !recB) return -1; // those with a record come first
			if (!recA && recB) return 1;
			// fallback alphabetical
			const nameA = `${a.user_name}`.toLowerCase();
			const nameB = `${b.user_name}`.toLowerCase();
			return nameA.localeCompare(nameB);
		});
	};

	const getStudentRecord = (studentId) => {
		return filteredAttendanceByDate.find(
			(r) => r.attendance_studentId === studentId
		);
	};

	const getStatusForStudent = (studentId) => {
		const record = getStudentRecord(studentId);
		if (!record) return "No record";
		if (record.attendance_timeIn && !record.attendance_timeOut)
			return "Time In";
		if (record.attendance_timeIn && record.attendance_timeOut)
			return "Completed";
		return "Absent";
	};

	const getAvailableYearLevels = () => {
		const yearLevels = new Set();
		students.forEach((s) => {
			if (s.yearL_id && s.yearL_name) {
				yearLevels.add(JSON.stringify({ id: s.yearL_id, name: s.yearL_name }));
			}
		});
		return Array.from(yearLevels).map((v) => JSON.parse(v));
	};

	const getStudentsByYearLevel = () => {
		const grouped = {};
		const sorted = sortStudentsByNewestForDate(filterStudents);
		sorted.forEach((s) => {
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

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
				<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-5xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<div className="min-w-0">
							<h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-200 truncate">
								Attendance Records (Admin)
							</h2>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
								View all attendance records per tribe
							</p>
						</div>
						<div className="flex gap-2 items-center">
							<button
								onClick={handleRefresh}
								className="flex gap-2 items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh"
							>
								<RefreshCw className="w-4 h-4" />
								<span className="hidden sm:inline">Refresh</span>
							</button>
							<button
								onClick={onClose}
								className="p-1.5 sm:p-2 text-gray-400 rounded-lg transition-colors hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
							>
								<X className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1" ref={scrollRef}>
						<div className="p-4 sm:p-6">
							{/* Tribe Selector */}
							<div className="p-4 mb-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700/40 dark:border-gray-600">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex gap-2 items-center">
										<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
										<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Select Tribe
										</span>
									</div>
									<div className="flex gap-2 flex-wrap">
										<button
											onClick={() => {
												setSelectedTribe({
													tribe_id: "all",
													tribe_name: "All Tribes",
												});
												fetchStudents("all");
											}}
											className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
												selectedTribe?.tribe_id === "all"
													? "bg-blue-600 text-white"
													: "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
											}`}
										>
											All Tribes
										</button>
										{tribes.map((tribe) => (
											<button
												key={tribe.tribe_id}
												onClick={() => {
													setSelectedTribe(tribe);
													fetchStudents(tribe.tribe_id);
												}}
												className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
													selectedTribe?.tribe_id === tribe.tribe_id
														? "bg-blue-600 text-white"
														: "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
												}`}
											>
												{tribe.tribe_name}
											</button>
										))}
									</div>
								</div>
							</div>

							{/* Date & Search */}
							<div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
								<div className="flex gap-2 items-center">
									<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
										<CalendarIcon className="w-4 h-4" /> Select Date:
									</label>
									<input
										type="date"
										value={selectedDate}
										onChange={(e) => setSelectedDate(e.target.value)}
										max={(() => {
											const now = new Date();
											const ph = new Date(now.getTime() + 8 * 60 * 60 * 1000);
											return ph.toISOString().split("T")[0];
										})()}
										className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-400"
									/>
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
												onClick={() =>
													setSelectedYearLevelFilter(String(level.id))
												}
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

							{/* Summary Header */}
							{selectedTribe && (
								<div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
									<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
										{selectedTribe.tribe_id === "all"
											? `All Students (${filterStudents.length}/${students.length})`
											: `Students in ${selectedTribe.tribe_name} (${filterStudents.length}/${students.length})`}
									</h3>
									<div className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
										<div className="flex flex-wrap gap-2 items-center">
											<span>Date:</span>
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
							)}

							{/* Records List grouped by Year Level */}
							{!selectedTribe ? (
								<div className="py-10 text-center text-gray-500 dark:text-gray-400">
									<Users className="mx-auto mb-3 w-10 h-10 text-gray-300 dark:text-gray-600" />
									<p>Select a tribe to view records.</p>
								</div>
							) : students.length === 0 ? (
								<p className="py-8 text-sm text-center text-gray-500 sm:text-base dark:text-gray-400">
									{selectedTribe.tribe_id === "all"
										? "No students found in any tribe."
										: `No students found in ${selectedTribe.tribe_name}.`}
								</p>
							) : filterStudents.length === 0 ? (
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
									{getStudentsByYearLevel().map(([yearLevel, data]) => {
										const isCollapsed = collapsedYearLevels.has(yearLevel);
										const studentsInLevel = data.students;
										const stats = (() => {
											let completed = 0;
											let timeIn = 0;
											let noRecord = 0;
											studentsInLevel.forEach((s) => {
												const st = getStatusForStudent(s.user_id);
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
															const status = getStatusForStudent(
																student.user_id
															);
															const record = getStudentRecord(student.user_id);

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
																					{`${
																						student.user_name?.charAt(0) || ""
																					}`}
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
																							<span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded dark:bg-blue-900/30 dark:text-blue-400">
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
																							<Clock className="mr-1 w-4 h-4 text-yellow-500" />
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
																							<CalendarIcon className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																							<span>
																								{new Date(
																									record.attendance_timeIn
																								).toLocaleDateString("en-US", {
																									year: "numeric",
																									month: "short",
																									day: "numeric",
																								})}
																							</span>
																						</div>
																						<div className="flex flex-col gap-2 text-gray-600 sm:flex-row sm:gap-4 dark:text-gray-300">
																							<div className="flex gap-2 items-center">
																								<Clock className="mr-1 w-4 h-4 text-green-600 dark:text-green-400" />
																								<span className="font-medium">
																									In:
																								</span>
																								<span>
																									{record.attendance_timeIn
																										? new Date(
																												record.attendance_timeIn
																										  ).toLocaleTimeString(
																												"en-US",
																												{
																													hour: "2-digit",
																													minute: "2-digit",
																													hour12: true,
																												}
																										  )
																										: "-"}
																								</span>
																							</div>
																							<div className="flex gap-2 items-center">
																								<Clock className="mr-1 w-4 h-4 text-red-600 dark:text-red-400" />
																								<span className="font-medium">
																									Out:
																								</span>
																								<span>
																									{record.attendance_timeOut
																										? new Date(
																												record.attendance_timeOut
																										  ).toLocaleTimeString(
																												"en-US",
																												{
																													hour: "2-digit",
																													minute: "2-digit",
																													hour12: true,
																												}
																										  )
																										: "-"}
																								</span>
																							</div>
																						</div>

																						{/* Processor Information */}
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
																									<Users className="mr-1 w-4 h-4 text-purple-600 dark:text-purple-400" />
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
						</div>
					</div>

					{/* Footer */}
					<div className="flex gap-2 sm:gap-3 justify-end p-4 sm:p-6 border-t dark:border-gray-700">
						<button
							onClick={onClose}
							className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default AdminSessionRecordsModal;
