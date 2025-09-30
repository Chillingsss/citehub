import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
	X,
	ChevronUp,
	ChevronDown,
	AlertTriangle,
	Users,
	QrCode,
	RefreshCw,
	Edit3,
	Check,
} from "lucide-react";
import {
	getAllTribes,
	getStudentsInTribe,
	getAttendanceSessions,
	getTodayAttendance,
	processAttendance,
} from "../../utils/sbo";
import QRCodeModal from "../QRCodeModal";
import SboStudentsInTribeSection from "./SboStudentsInTribeSection";

const SboAttendanceModal = ({ isOpen, onClose, sboId, sboProfile }) => {
	const [tribes, setTribes] = useState([]);
	const [selectedTribe, setSelectedTribe] = useState(null);
	const [students, setStudents] = useState([]);
	const [sessions, setSessions] = useState([]);
	const [selectedSession, setSelectedSession] = useState(null);
	const [showScanner, setShowScanner] = useState(false);
	const [scanResult, setScanResult] = useState("");
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedDate, setSelectedDate] = useState(() => {
		// Get current date in Philippines timezone (UTC+8)
		const now = new Date();
		const philippinesTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours for UTC+8
		return philippinesTime.toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format
	});
	const [showQRCodeModal, setShowQRCodeModal] = useState(false);
	const [recentlyScanned, setRecentlyScanned] = useState(new Set());
	const recentlyScannedRef = useRef(new Set());
	const [manualStudentId, setManualStudentId] = useState("");
	const [showManualInput, setShowManualInput] = useState(false);
	const videoRef = useRef(null);
	const codeReader = useRef(null);
	const scrollContainerRef = useRef(null);
	const selectedTribeRef = useRef(null);
	const tribesRef = useRef([]);

	useEffect(() => {
		if (isOpen && sboId) {
			fetchTribes();
			fetchAttendanceSessions();
			fetchTodayAttendance();
		}
	}, [isOpen, sboId]);

	useEffect(() => {
		return () => {
			if (codeReader.current) {
				codeReader.current.reset();
			}
			setRecentlyScanned(new Set()); // Clear recently scanned codes when component unmounts
			recentlyScannedRef.current = new Set(); // Clear ref as well
		};
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			if (scrollContainerRef.current) {
				const scrollTop = scrollContainerRef.current.scrollTop;
				setShowScrollTop(scrollTop > 200);
			}
		};

		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, [isOpen]);

	// Update refs whenever state changes to avoid closure issues
	useEffect(() => {
		selectedTribeRef.current = selectedTribe;
	}, [selectedTribe]);

	useEffect(() => {
		tribesRef.current = tribes;
	}, [tribes]);

	useEffect(() => {
		recentlyScannedRef.current = recentlyScanned;
	}, [recentlyScanned]);

	const scrollToTop = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const fetchTribes = async () => {
		try {
			const result = await getAllTribes();
			if (result.success) {
				setTribes(result.tribes);
			} else {
				console.warn("Failed to fetch tribes:", result);
				setTribes([]);
			}
		} catch (error) {
			console.error("Error fetching tribes:", error);
			setTribes([]);
		}
	};

	const fetchStudentsInTribe = async (tribeId) => {
		try {
			const result = await getStudentsInTribe(tribeId);
			if (result.success) {
				setStudents(result.students);
			} else {
				console.warn("Failed to fetch students:", result);
				setStudents([]);
			}
		} catch (error) {
			console.error("Error fetching students:", error);
			setStudents([]);
		}
	};

	const fetchAttendanceSessions = async () => {
		try {
			const result = await getAttendanceSessions();
			if (result.success) {
				setSessions(result.sessions);
			} else {
				console.warn("Failed to fetch sessions:", result);
				setSessions([]);
			}
		} catch (error) {
			console.error("Error fetching sessions:", error);
			setSessions([]);
		}
	};

	const fetchTodayAttendance = async () => {
		try {
			const result = await getTodayAttendance(sboId);
			if (result.success) {
				setAttendanceRecords(result.records);
				return result.records || [];
			} else {
				console.warn("Failed to fetch today's attendance:", result);
				setAttendanceRecords([]);
				return [];
			}
		} catch (error) {
			console.error("Error fetching today's attendance:", error);
			setAttendanceRecords([]);
			return [];
		}
	};

	const handleRefresh = async () => {
		try {
			const loadingToast = toast.loading("Refreshing attendance data...");

			await Promise.all([
				fetchTribes(),
				fetchAttendanceSessions(),
				fetchTodayAttendance(),
				selectedTribe
					? fetchStudentsInTribe(selectedTribe.tribe_id)
					: Promise.resolve(),
			]);

			// Keep selectedSession in sync with any updates
			if (selectedSession) {
				const fresh = await getAttendanceSessions();
				if (fresh.success) {
					const updated = fresh.sessions.find(
						(s) => s.attendanceS_id === selectedSession.attendanceS_id
					);
					if (updated) {
						const statusChanged =
							updated.attendanceS_status !== selectedSession.attendanceS_status;
						setSelectedSession(updated);
						if (statusChanged) {
							toast(
								`${updated.attendanceS_name} session is now ${
									updated.attendanceS_status === 1 ? "active" : "inactive"
								}.`,
								{
									duration: 3000,
									icon: updated.attendanceS_status === 1 ? "✅" : "⚠️",
								}
							);
						}
					}
				}
			}

			toast.dismiss(loadingToast);
			toast.success("Attendance data refreshed successfully!", {
				duration: 2000,
			});
		} catch (error) {
			console.error("Error refreshing data:", error);
			toast.error("Failed to refresh attendance data", { duration: 3000 });
		}
	};

	const handleTribeSelect = (tribe) => {
		setSelectedTribe(tribe);
		setStudents([]);

		fetchStudentsInTribe(tribe.tribe_id);

		// Automatically select the first active session
		const activeSession = sessions.find(
			(session) => session.attendanceS_status === 1
		);
		if (activeSession) {
			setSelectedSession(activeSession);
		} else {
			setSelectedSession(null);
		}
	};

	const startScanner = async () => {
		const sessions = await getAttendanceSessions();
		if (
			!sessions.success ||
			!sessions.sessions.length ||
			sessions.sessions[0].attendanceS_status === 0
		) {
			toast.error("Attendance is currently inactive!");
			return;
		}

		setShowScanner(true);

		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Camera access is not supported in this browser");
			}

			codeReader.current = new BrowserMultiFormatReader();

			const constraintOptions = [
				{
					video: {
						facingMode: { exact: "environment" },
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				{
					video: {
						facingMode: "environment",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				{
					video: {
						facingMode: "user",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				{
					video: {
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				{
					video: true,
				},
			];

			let stream = null;
			let lastError = null;

			for (const constraints of constraintOptions) {
				try {
					stream = await navigator.mediaDevices.getUserMedia(constraints);
					break;
				} catch (error) {
					lastError = error;
					continue;
				}
			}

			if (!stream) {
				throw lastError || new Error("Unable to access camera");
			}

			if (videoRef.current) {
				videoRef.current.srcObject = stream;

				await new Promise((resolve, reject) => {
					const video = videoRef.current;
					if (!video) {
						reject(new Error("Video element not available"));
						return;
					}

					const onLoadedMetadata = () => {
						video.removeEventListener("loadedmetadata", onLoadedMetadata);
						video.removeEventListener("error", onError);
						resolve();
					};

					const onError = (error) => {
						video.removeEventListener("loadedmetadata", onLoadedMetadata);
						video.removeEventListener("error", onError);
						reject(new Error("Video failed to load: " + error.message));
					};

					video.addEventListener("loadedmetadata", onLoadedMetadata);
					video.addEventListener("error", onError);

					video.play().catch(reject);
				});

				codeReader.current.decodeFromVideoDevice(
					null,
					videoRef.current,
					(result, error) => {
						if (result) {
							console.log("QR Code detected:", result.getText());
							setScanResult(result.getText());
							handleQRScanResult(result.getText());
						}
						if (error && error.name !== "NotFoundException") {
							console.warn("QR Scanner error:", error);
						}
					}
				);
			}
		} catch (error) {
			console.error("Camera access error:", error);
			setShowScanner(false);

			if (error.name === "NotAllowedError") {
				toast.error(
					"Camera permission denied. Please allow camera access and try again.",
					{
						duration: 5000,
					}
				);
			} else if (error.name === "NotFoundError") {
				toast.error("No camera found on this device.");
			} else if (error.name === "NotSupportedError") {
				toast.error("Camera is not supported in this browser.");
			} else if (error.name === "NotReadableError") {
				toast.error("Camera is already in use by another application.");
			} else if (error.name === "OverconstrainedError") {
				toast.error("Camera doesn't support the requested settings.");
			} else {
				toast.error(error.message || "Unknown camera error occurred.", {
					duration: 4000,
				});
			}
		}
	};

	const stopScanner = () => {
		if (codeReader.current) {
			codeReader.current.reset();
		}
		if (videoRef.current && videoRef.current.srcObject) {
			const tracks = videoRef.current.srcObject.getTracks();
			tracks.forEach((track) => track.stop());
			videoRef.current.srcObject = null;
		}
		setShowScanner(false);
		setRecentlyScanned(new Set()); // Clear recently scanned codes when stopping scanner
		recentlyScannedRef.current = new Set(); // Clear ref as well
		toast.success("Scanner stopped.", {
			duration: 2000,
		});
	};

	const handleQRScanResult = async (qrText) => {
		// Prevent processing if already loading
		if (loading) {
			console.log("Already processing a scan, skipping...");
			return;
		}

		let studentId = qrText;
		if (qrText.includes("student_id:")) {
			studentId = qrText.split("student_id:")[1].trim();
		}

		// Check if this specific QR code was recently scanned using ref for immediate check
		if (recentlyScannedRef.current.has(studentId)) {
			toast("QR code already processed recently", {
				icon: "⚠️",
				duration: 2000,
			});
			return;
		}

		// Immediately add to ref and state to prevent duplicate processing
		recentlyScannedRef.current.add(studentId);
		setRecentlyScanned((prev) => new Set(prev).add(studentId));

		// Show immediate feedback that QR code was detected
		toast(`QR Code detected: ${studentId}`, {
			icon: "📱",
			duration: 2000,
		});

		// Remove from recently scanned set after 3 seconds
		setTimeout(() => {
			setRecentlyScanned((prev) => {
				const newSet = new Set(prev);
				newSet.delete(studentId);
				return newSet;
			});
			recentlyScannedRef.current.delete(studentId);
		}, 5000);

		const student = students.find((s) => s.user_id === studentId);
		if (!student) {
			toast.error("Student not found in selected tribe!", {
				duration: 3000,
			});
			return;
		}

		const studentName = `${student.user_name}`;
		const checkingToast = toast.loading("Checking attendance status...");

		try {
			const freshAttendanceRecords = await fetchTodayAttendance();
			const today = new Date();
			const philippinesToday = new Date(today.getTime() + 8 * 60 * 60 * 1000);
			const todayDateString = philippinesToday.toISOString().split("T")[0];
			const todaysRecords = (freshAttendanceRecords || []).filter((record) => {
				if (!record.attendance_timeIn) return false;
				const recordDate = new Date(record.attendance_timeIn);
				const philippinesDate = new Date(
					recordDate.getTime() + 8 * 60 * 60 * 1000
				);
				const recordDateString = philippinesDate.toISOString().split("T")[0];
				return recordDateString === todayDateString;
			});
			const currentRecord = todaysRecords.find(
				(r) => r.attendance_studentId === studentId
			);

			toast.dismiss(checkingToast);

			if (currentRecord && currentRecord.attendance_timeIn) {
				// Check if student already has complete attendance for today

				if (currentRecord.attendance_timeOut) {
					const timeInFormatted = formatTime(currentRecord.attendance_timeIn);
					const timeOutFormatted = formatTime(currentRecord.attendance_timeOut);
					const dateFormatted = formatDate(currentRecord.attendance_timeIn);

					toast.success(
						`${studentName} already completed attendance!\n📅 ${dateFormatted}\n🕐 In: ${timeInFormatted} | Out: ${timeOutFormatted}`,
						{
							duration: 5000,
							icon: "✅",
						}
					);
					return;
				}

				// Let the backend handle Time In/Out logic
			}

			const loadingToast = toast.loading("Processing attendance...");

			try {
				const result = await processAttendance(sboId, studentId);
				toast.dismiss(loadingToast);

				if (result.success) {
					const actionText =
						result.action === "time_in" ? "Time In" : "Time Out";
					toast.success(`${actionText} recorded for ${studentName}`, {
						duration: 3000,
						icon: result.action === "time_in" ? "🕐" : "🔚",
					});
					await fetchTodayAttendance();
				} else {
					toast.error(result.message || "Failed to process attendance", {
						duration: 3000,
					});
				}
			} catch (error) {
				toast.dismiss(loadingToast);
				console.error("Error processing attendance:", error);
				toast.error("Failed to process attendance. Please try again.", {
					duration: 3000,
				});
			}
		} catch (error) {
			toast.dismiss(checkingToast);
			console.error("Error checking attendance status:", error);
			toast.error("Error checking attendance status. Please try again.");
			return;
		}

		console.log("Continuing to scan for more QR codes...");
	};

	const handleManualAttendance = async () => {
		if (!manualStudentId.trim()) {
			toast.error("Please enter a student ID", { duration: 3000 });
			return;
		}

		// Prevent processing if already loading
		if (loading) {
			console.log("Already processing attendance, please wait...");
			return;
		}

		const studentId = manualStudentId.trim();

		// Check if this specific student ID was recently processed
		if (recentlyScannedRef.current.has(studentId)) {
			toast("Student ID already processed recently", {
				icon: "⚠️",
				duration: 2000,
			});
			return;
		}

		// Immediately add to ref and state to prevent duplicate processing
		recentlyScannedRef.current.add(studentId);
		setRecentlyScanned((prev) => new Set(prev).add(studentId));

		// Show immediate feedback that student ID was entered
		toast(`Processing attendance for: ${studentId}`, {
			icon: "📝",
			duration: 2000,
		});

		// Remove from recently processed set after 5 seconds
		setTimeout(() => {
			setRecentlyScanned((prev) => {
				const newSet = new Set(prev);
				newSet.delete(studentId);
				return newSet;
			});
			recentlyScannedRef.current.delete(studentId);
		}, 5000);

		const student = students.find((s) => s.user_id === studentId);
		if (!student) {
			toast.error("Student not found in selected tribe!", {
				duration: 3000,
			});
			return;
		}

		const studentName = `${student.user_name}`;
		const checkingToast = toast.loading("Checking attendance status...");

		try {
			const freshAttendanceRecords = await fetchTodayAttendance();
			const today = new Date();
			const philippinesToday = new Date(today.getTime() + 8 * 60 * 60 * 1000);
			const todayDateString = philippinesToday.toISOString().split("T")[0];
			const todaysRecords = (freshAttendanceRecords || []).filter((record) => {
				if (!record.attendance_timeIn) return false;
				const recordDate = new Date(record.attendance_timeIn);
				const philippinesDate = new Date(
					recordDate.getTime() + 8 * 60 * 60 * 1000
				);
				const recordDateString = philippinesDate.toISOString().split("T")[0];
				return recordDateString === todayDateString;
			});
			const currentRecord = todaysRecords.find(
				(r) => r.attendance_studentId === studentId
			);

			toast.dismiss(checkingToast);

			if (currentRecord && currentRecord.attendance_timeIn) {
				// Check if student already has complete attendance for today
				if (currentRecord.attendance_timeOut) {
					const timeInFormatted = formatTime(currentRecord.attendance_timeIn);
					const timeOutFormatted = formatTime(currentRecord.attendance_timeOut);
					const dateFormatted = formatDate(currentRecord.attendance_timeIn);

					toast.success(
						`${studentName} already completed attendance!\n📅 ${dateFormatted}\n🕐 In: ${timeInFormatted} | Out: ${timeOutFormatted}`,
						{
							duration: 5000,
							icon: "✅",
						}
					);
					return;
				}
			}

			const loadingToast = toast.loading("Processing attendance...");

			try {
				const result = await processAttendance(sboId, studentId);
				toast.dismiss(loadingToast);

				if (result.success) {
					const actionText =
						result.action === "time_in" ? "Time In" : "Time Out";
					toast.success(`${actionText} recorded for ${studentName}`, {
						duration: 3000,
						icon: result.action === "time_in" ? "🕐" : "🔚",
					});
					await fetchTodayAttendance();
					// Clear the input field after successful processing
					setManualStudentId("");
				} else {
					toast.error(result.message || "Failed to process attendance", {
						duration: 3000,
					});
				}
			} catch (error) {
				toast.dismiss(loadingToast);
				console.error("Error processing attendance:", error);
				toast.error("Failed to process attendance. Please try again.", {
					duration: 3000,
				});
			}
		} catch (error) {
			toast.dismiss(checkingToast);
			console.error("Error checking attendance status:", error);
			toast.error("Error checking attendance status. Please try again.");
			return;
		}
	};

	// Removed duplicate processAttendance function since it's now handled in handleQRScanResult

	// Function to filter attendance records by selected date
	const getFilteredAttendanceByDate = () => {
		if (!Array.isArray(attendanceRecords)) {
			return [];
		}

		return attendanceRecords.filter((record) => {
			if (!record.attendance_timeIn) return false;

			// Convert the database datetime to Philippines date for comparison
			const recordDate = new Date(record.attendance_timeIn);
			// Add 8 hours to convert to Philippines timezone (UTC+8)
			const philippinesDate = new Date(
				recordDate.getTime() + 8 * 60 * 60 * 1000
			);
			const recordDateString = philippinesDate.toISOString().split("T")[0]; // Get YYYY-MM-DD part

			return recordDateString === selectedDate;
		});
	};

	// Function to get student attendance status for selected date
	const getStudentAttendanceStatusForDate = (studentId) => {
		if (!selectedSession) return "No Session";

		const filteredRecords = getFilteredAttendanceByDate();
		const record = filteredRecords.find(
			(r) =>
				r.attendance_studentId === studentId &&
				parseInt(r.attendance_sessionId) ===
					parseInt(selectedSession.attendanceS_id)
		);

		if (!record) return "No record";
		if (record.attendance_timeIn && !record.attendance_timeOut)
			return "Time In";
		if (record.attendance_timeIn && record.attendance_timeOut)
			return "Completed";
		return "Absent";
	};

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

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
							SBO Attendance System
						</h2>
						<div className="flex gap-2 items-center">
							{/* QR Code Button for SBO */}
							<button
								onClick={handleRefresh}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh attendance data"
							>
								<RefreshCw className="w-4 h-4" />
								<span className="hidden sm:inline">Refresh</span>
							</button>
							<button
								onClick={() => setShowQRCodeModal(true)}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-800/30"
								title="Show my QR code for attendance"
							>
								<QrCode className="w-4 h-4" />
								<span className="hidden sm:inline">My QR Code</span>
							</button>
							<button
								onClick={onClose}
								className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
					</div>

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1" ref={scrollContainerRef}>
						{/* Tribe Selection */}
						<div className="p-4 border-b sm:p-6 dark:border-gray-700">
							<div className="flex items-center mb-3 sm:mb-4">
								<Users className="mr-2 w-5 h-5 text-gray-600 dark:text-gray-400" />
								<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
									Select Tribe
								</h3>
							</div>
							<div className="relative">
								<select
									value={selectedTribe?.tribe_id || ""}
									onChange={(e) => {
										if (e.target.value === "") {
											// Handle "Choose a tribe..." option
											setSelectedTribe(null);
											setStudents([]);
											setSelectedSession(null);
										} else {
											const tribe = tribes.find(
												(t) => String(t.tribe_id) === String(e.target.value)
											);
											if (tribe) {
												handleTribeSelect(tribe);
											} else {
												console.error(
													"Tribe not found for ID:",
													e.target.value
												);
											}
										}
									}}
									className="px-4 py-3 w-full text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
								>
									<option value="">Choose a tribe...</option>
									{tribes.map((tribe) => (
										<option key={tribe.tribe_id} value={tribe.tribe_id}>
											{tribe.tribe_name}
										</option>
									))}
								</select>
								<div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
									<ChevronDown className="w-5 h-5 text-gray-400" />
								</div>
							</div>
							{selectedTribe && (
								<div className="p-3 mt-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
									<div className="flex gap-2 items-center">
										<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
										<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
											Selected: {selectedTribe.tribe_name}
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Session Selection - Only show when tribe is selected */}
						{selectedTribe && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<h3 className="mb-3 text-base font-semibold text-gray-700 sm:mb-4 sm:text-lg dark:text-gray-300">
									Select Session
								</h3>
								<div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
									{sessions.map((session) => (
										<button
											key={session.attendanceS_id}
											onClick={() => setSelectedSession(session)}
											className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium ${
												selectedSession?.attendanceS_id ===
												session.attendanceS_id
													? "bg-blue-600 text-white"
													: session.attendanceS_status === 1
													? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
													: "bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
											}`}
										>
											Attendance
											{session.attendanceS_status === 0 && " (Inactive)"}
											{session.attendanceS_status === 1 && " (Active)"}
										</button>
									))}
								</div>
							</div>
						)}

						{/* QR Scanner Section - Only show for active sessions */}
						{selectedSession && selectedSession.attendanceS_status === 1 && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
									<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
										QR Code Scanner
									</h3>
									<button
										onClick={showScanner ? stopScanner : startScanner}
										disabled={loading}
										className={`px-4 py-2.5 sm:py-2 rounded-lg text-white transition-colors duration-200 text-sm sm:text-base font-medium ${
											showScanner
												? "bg-red-600 hover:bg-red-700"
												: "bg-green-600 hover:bg-green-700"
										} disabled:bg-gray-400 disabled:cursor-not-allowed`}
									>
										{loading
											? "Processing..."
											: showScanner
											? "Stop Scanner"
											: "Start Scanner"}
									</button>
								</div>

								{showScanner && (
									<div className="flex justify-center mb-4">
										<div className="relative">
											<video
												ref={videoRef}
												className="w-full max-w-xs h-48 bg-black rounded-lg sm:w-80 sm:h-60"
												playsInline
											/>
											<div className="absolute inset-0 rounded-lg border-2 border-green-500 pointer-events-none">
												<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-green-500 sm:top-4 sm:left-4 sm:w-6 sm:h-6"></div>
												<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-green-500 sm:top-4 sm:right-4 sm:w-6 sm:h-6"></div>
												<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-green-500 sm:bottom-4 sm:left-4 sm:w-6 sm:h-6"></div>
												<div className="absolute right-2 bottom-2 w-4 h-4 border-r-2 border-b-2 border-green-500 sm:right-4 sm:bottom-4 sm:w-6 sm:h-6"></div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Manual Attendance Input Section - Only show for active sessions */}
						{selectedSession && selectedSession.attendanceS_status === 1 && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
									<h3 className="text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-300">
										Manual Attendance
									</h3>
									<button
										onClick={() => setShowManualInput(!showManualInput)}
										className={`px-4 py-2.5 sm:py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base font-medium ${
											showManualInput
												? "bg-gray-600 text-white hover:bg-gray-700"
												: "bg-blue-600 text-white hover:bg-blue-700"
										}`}
									>
										{showManualInput
											? "Hide Manual Input"
											: "Show Manual Input"}
									</button>
								</div>

								{showManualInput && (
									<div className="space-y-4">
										<div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
											<div className="flex gap-2 items-center mb-2">
												<Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
												<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
													Enter Student ID Manually
												</span>
											</div>
											<p className="text-xs text-blue-700 dark:text-blue-300">
												Type the student's school ID and click "Process
												Attendance" to record their attendance.
											</p>
										</div>

										<div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
											<div className="flex-1">
												<label
													htmlFor="manualStudentId"
													className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Student ID
												</label>
												<input
													id="manualStudentId"
													type="text"
													value={manualStudentId}
													onChange={(e) => setManualStudentId(e.target.value)}
													onKeyPress={(e) => {
														if (e.key === "Enter") {
															handleManualAttendance();
														}
													}}
													placeholder="Enter student ID..."
													className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
													disabled={loading}
												/>
											</div>
											<div className="flex items-end">
												<button
													onClick={handleManualAttendance}
													disabled={loading || !manualStudentId.trim()}
													className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
												>
													<Check className="w-4 h-4" />
													{loading ? "Processing..." : "Process Attendance"}
												</button>
											</div>
										</div>

										{manualStudentId && (
											<div className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
												<div className="flex gap-2 items-center">
													<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
														Ready to process:
													</span>
													<span className="px-2 py-1 font-mono text-xs text-gray-800 bg-gray-200 rounded dark:bg-gray-600 dark:text-gray-200">
														{manualStudentId}
													</span>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{/* Session Status Info for Inactive Sessions */}
						{selectedSession && selectedSession.attendanceS_status === 0 && (
							<div className="p-4 border-b sm:p-6 dark:border-gray-700">
								<div className="flex gap-3 items-start p-3 bg-amber-50 rounded-lg border border-amber-200 sm:p-4 dark:bg-amber-900/20 dark:border-amber-800">
									<div className="flex-shrink-0 mt-0.5">
										<AlertTriangle className="w-5 h-5 text-amber-600 sm:w-6 sm:h-6 dark:text-amber-400" />
									</div>
									<div>
										<h4 className="text-sm font-medium text-amber-800 sm:text-base dark:text-amber-200">
											{selectedSession.attendanceS_name} Session is Inactive
										</h4>
										<p className="mt-1 text-xs text-amber-700 sm:text-sm dark:text-amber-300">
											You can view attendance records, but scanning is not
											available for inactive sessions.
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Students List - Always show when tribe and session are selected */}
						{selectedTribe && selectedSession && (
							<>
								{/* All Tribes Info Banner */}
								<SboStudentsInTribeSection
									students={students}
									selectedTribe={selectedTribe}
									selectedSession={selectedSession}
									attendanceRecords={attendanceRecords}
									selectedDate={selectedDate}
									setSelectedDate={setSelectedDate}
									searchQuery={searchQuery}
									setSearchQuery={setSearchQuery}
								/>
							</>
						)}

						{/* No Tribe Selected */}
						{!selectedTribe && (
							<div className="p-4 sm:p-6">
								<div className="py-6 text-center sm:py-8">
									<div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-full sm:w-16 sm:h-16 dark:bg-gray-700">
										<Users className="w-6 h-6 text-gray-400 sm:w-8 sm:h-8 dark:text-gray-500" />
									</div>
									<h3 className="mb-2 text-base font-medium text-gray-900 sm:text-lg dark:text-gray-100">
										Select a Tribe
									</h3>
									<p className="px-4 text-sm text-gray-500 sm:text-base dark:text-gray-400">
										Choose a specific tribe above to manage attendance for its
										students.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Scroll to Top Button */}
				{showScrollTop && (
					<button
						onClick={scrollToTop}
						className="fixed right-6 bottom-6 z-50 p-3 text-white bg-green-600 rounded-full shadow-lg transition-all duration-300 transform hover:bg-blue-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						title="Scroll to top"
					>
						<ChevronUp className="w-5 h-5" />
					</button>
				)}
			</div>

			{/* QR Code Modal for SBO */}
			<QRCodeModal
				isOpen={showQRCodeModal}
				onClose={() => setShowQRCodeModal(false)}
				userId={sboId}
				userProfile={sboProfile}
			/>
		</>
	);
};

export default SboAttendanceModal;
