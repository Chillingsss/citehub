import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import axios from "axios";
import { getDecryptedApiUrl } from "../../utils/apiConfig";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
	X,
	ChevronUp,
	AlertTriangle,
	Clock,
	RefreshCw,
	Calendar,
} from "lucide-react";
import {
	getStudentsInTribe,
	getAttendanceSessions,
	getTodayAttendance,
	processAttendance,
} from "../../utils/faculty";
import StudentsInTribeSection from "./StudentsInTribeSection";

const FacultyAttendanceModal = ({
	isOpen,
	onClose,
	facultyId,
	facultyProfile,
}) => {
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
	const videoRef = useRef(null);
	const codeReader = useRef(null);
	const scrollContainerRef = useRef(null);

	useEffect(() => {
		if (isOpen && facultyId) {
			fetchStudentsInTribe();
			fetchAttendanceSessions();
			fetchTodayAttendance();
		}
	}, [isOpen, facultyId]);

	useEffect(() => {
		return () => {
			// Cleanup camera when component unmounts
			if (codeReader.current) {
				codeReader.current.reset();
			}
		};
	}, []);

	// Handle scroll events to show/hide scroll-to-top button
	useEffect(() => {
		const handleScroll = () => {
			if (scrollContainerRef.current) {
				const scrollTop = scrollContainerRef.current.scrollTop;
				setShowScrollTop(scrollTop > 200); // Show button after scrolling 200px
			}
		};

		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, [isOpen]);

	// Function to scroll to top
	const scrollToTop = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const fetchStudentsInTribe = async () => {
		try {
			const result = await getStudentsInTribe(facultyId);
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
				// Auto-select first active session if none selected
				if (!selectedSession) {
					const activeSession = result.sessions.find(
						(session) => session.attendanceS_status === 1
					);
					if (activeSession) {
						setSelectedSession(activeSession);
					} else if (
						Array.isArray(result.sessions) &&
						result.sessions.length > 0
					) {
						setSelectedSession(result.sessions[0]);
					}
				}
			} else {
				console.warn("Failed to fetch sessions:", result);
				setSessions([]);
			}
		} catch (error) {
			console.error("Error fetching sessions:", error);
			setSessions([]);
		}
	};

	// Stop scanner if session switches to inactive
	useEffect(() => {
		if (
			selectedSession &&
			selectedSession.attendanceS_status === 0 &&
			showScanner
		) {
			stopScanner();
		}
	}, [selectedSession]);

	const fetchTodayAttendance = async () => {
		try {
			const result = await getTodayAttendance(facultyId);
			if (result.success) {
				console.log("Fetched attendance records:", result.records);
				setAttendanceRecords(result.records);
			} else {
				console.warn("Failed to fetch today's attendance:", result);
				setAttendanceRecords([]);
			}
		} catch (error) {
			console.error("Error fetching today's attendance:", error);
			setAttendanceRecords([]);
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
			// Check if getUserMedia is supported
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Camera access is not supported in this browser");
			}

			// First, check camera permissions
			try {
				const permissionStatus = await navigator.permissions.query({
					name: "camera",
				});
				console.log("Camera permission status:", permissionStatus.state);

				if (permissionStatus.state === "denied") {
					throw new Error(
						"Camera permission is denied. Please enable camera access in your browser settings."
					);
				}
			} catch (permError) {
				console.warn("Permission API not supported:", permError);
				// Continue anyway, as some browsers don't support permissions API
			}

			codeReader.current = new BrowserMultiFormatReader();

			// Try different camera constraints in order of preference
			const constraintOptions = [
				// First try: Back camera with ideal resolution
				{
					video: {
						facingMode: { exact: "environment" },
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Second try: Any back camera
				{
					video: {
						facingMode: "environment",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Third try: Front camera
				{
					video: {
						facingMode: "user",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Fourth try: Any camera with basic constraints
				{
					video: {
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				},
				// Last try: Just video
				{
					video: true,
				},
			];

			let stream = null;
			let lastError = null;

			// Try each constraint option until one works
			for (const constraints of constraintOptions) {
				try {
					console.log("Trying camera constraints:", constraints);
					stream = await navigator.mediaDevices.getUserMedia(constraints);
					console.log(
						"Camera access successful with constraints:",
						constraints
					);
					break;
				} catch (error) {
					console.warn(
						"Failed with constraints:",
						constraints,
						"Error:",
						error.message
					);
					lastError = error;
					continue;
				}
			}

			if (!stream) {
				throw (
					lastError ||
					new Error("Unable to access camera with any configuration")
				);
			}

			if (videoRef.current) {
				videoRef.current.srcObject = stream;

				// Wait for video to be ready
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

				// Start QR code detection
				codeReader.current.decodeFromVideoDevice(
					null,
					videoRef.current,
					(result, error) => {
						if (result) {
							console.log("QR Code detected:", result.getText());
							setScanResult(result.getText());
							handleQRScanResult(result.getText());
							// Don't stop scanner here - let it continue scanning
						}
						if (error && error.name !== "NotFoundException") {
							console.warn("QR Scanner error:", error);
						}
					}
				);

				// Show success toast when camera starts
				toast.success("Camera started! Scan QR codes continuously.", {
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Camera access error:", error);
			setShowScanner(false);

			// Provide specific error messages with toast
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
		toast.success("Scanner stopped.", {
			duration: 2000,
		});
	};

	const handleQRScanResult = async (qrText) => {
		if (loading) {
			console.log("Already processing a scan, skipping...");
			return;
		}

		let studentId = qrText;
		if (qrText.includes("student_id:")) {
			studentId = qrText.split("student_id:")[1].trim();
		}

		const student = students.find((s) => s.user_id === studentId);
		if (!student) {
			toast.error("Student not found in your tribe!", {
				duration: 3000,
			});
			return;
		}

		const studentName = `${student.user_name}`;
		const checkingToast = toast.loading("Checking attendance status...");

		try {
			await fetchTodayAttendance();
			await new Promise((resolve) => setTimeout(resolve, 100));

			const response = await axios.post(
				`${getDecryptedApiUrl()}/faculty.php`,
				(() => {
					const formData = new FormData();
					formData.append("operation", "getTodayAttendance");
					formData.append("json", JSON.stringify({ facultyId }));
					return formData;
				})()
			);

			const freshAttendanceRecords = Array.isArray(response.data)
				? response.data
				: [];

			// Filter records to only today's date (Philippines timezone)
			const today = new Date();
			const philippinesToday = new Date(today.getTime() + 8 * 60 * 60 * 1000);
			const todayDateString = philippinesToday.toISOString().split("T")[0];

			const todaysRecords = freshAttendanceRecords.filter((record) => {
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
				const result = await processAttendance(facultyId, studentId, 1);
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

	// Function to filter students by search query (name or ID)
	const filterStudents = (students) => {
		if (!searchQuery.trim()) {
			return students;
		}

		const query = searchQuery.toLowerCase().trim();
		return students.filter((student) => {
			const fullName = `${student.user_name}`.toLowerCase();
			const studentId = student.user_id.toLowerCase();

			return fullName.includes(query) || studentId.includes(query);
		});
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

	const handleRefresh = async () => {
		try {
			// Show loading toast
			const loadingToast = toast.loading("Refreshing attendance data...");

			// Refresh all data
			await Promise.all([
				fetchStudentsInTribe(),
				fetchAttendanceSessions(),
				fetchTodayAttendance(),
			]);

			// Dismiss loading toast and show success
			toast.dismiss(loadingToast);
			toast.success("Attendance data refreshed successfully!", {
				duration: 2000,
			});
		} catch (error) {
			console.error("Error refreshing data:", error);
			toast.error("Failed to refresh attendance data", {
				duration: 3000,
			});
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
							Faculty Attendance System
						</h2>
						<div className="flex gap-2 items-center">
							<button
								onClick={handleRefresh}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh attendance data"
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

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1" ref={scrollContainerRef}>
						{/* Session Selection */}
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
											selectedSession?.attendanceS_id === session.attendanceS_id
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

						{/* Students List */}
						<StudentsInTribeSection
							students={students}
							attendanceRecords={attendanceRecords}
							selectedDate={selectedDate}
							setSelectedDate={setSelectedDate}
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
						/>
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
		</>
	);
};

export default FacultyAttendanceModal;
