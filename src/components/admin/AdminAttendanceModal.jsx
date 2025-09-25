import React, { useState, useEffect } from "react";
import {
	X,
	Calendar,
	CheckCircle,
	XCircle,
	RefreshCw,
	LogIn,
	LogOut,
	Power,
	Settings,
} from "lucide-react";
import {
	getAttendanceSessions,
	updateAttendanceSessionStatus,
} from "../../utils/admin";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import AdminSessionRecordsModal from "./AdminSessionRecordsModal";

const AdminAttendanceModal = ({ isOpen, onClose }) => {
	const [sessions, setSessions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [updatingSession, setUpdatingSession] = useState(null);
	const [recordsModalOpen, setRecordsModalOpen] = useState(false);
	const [selectedSession, setSelectedSession] = useState(null);

	useEffect(() => {
		if (isOpen) {
			fetchAttendanceSessions();
		}
	}, [isOpen]);

	const fetchAttendanceSessions = async () => {
		setLoading(true);
		try {
			console.log("Fetching attendance sessions...");
			const result = await getAttendanceSessions();
			console.log("Attendance sessions result:", result);

			if (result.success) {
				setSessions(result.sessions);
				console.log("Successfully set sessions:", result.sessions);
			} else {
				console.error("Failed to fetch sessions:", result);
				toast.error(result.message || "Failed to fetch attendance sessions");
				setSessions([]);
			}
		} catch (error) {
			console.error("Error fetching attendance sessions:", {
				error,
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});
			toast.error(`Error fetching attendance sessions: ${error.message}`);
			setSessions([]);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		try {
			// Show loading toast
			const loadingToast = toast.loading("Refreshing session data...");

			// Refresh session data
			await fetchAttendanceSessions();

			// Dismiss loading toast and show success
			toast.dismiss(loadingToast);
			toast.success("Session data refreshed successfully!", {
				duration: 2000,
			});
		} catch (error) {
			console.error("Error refreshing data:", error);
			toast.error("Failed to refresh session data", {
				duration: 3000,
			});
		}
	};

	const handleStatusChange = async (newStatus) => {
		setUpdatingSession(true);
		try {
			const result = await updateAttendanceSessionStatus({
				status: newStatus,
				timeIn: sessions[0]?.attendanceS_timeIn ?? 1, // Keep current timeIn value or default to 1
			});
			if (result.success) {
				toast.success(
					newStatus === 1
						? "Session activated successfully"
						: "Session deactivated successfully"
				);

				// Update the status of the single session
				setSessions((prev) =>
					prev.map((s) => ({ ...s, attendanceS_status: newStatus }))
				);
			} else {
				toast.error(result.message || "Failed to update session status");
			}
		} catch (error) {
			console.error("Error updating session status:", error);
			toast.error("Error updating session status");
		} finally {
			setUpdatingSession(false);
		}
	};

	const handleTimeInChange = async (newTimeIn) => {
		setUpdatingSession(true);
		try {
			console.log("Updating attendance mode:", {
				status: 1,
				timeIn: newTimeIn,
			});
			const result = await updateAttendanceSessionStatus({
				status: 1, // Keep session active
				timeIn: newTimeIn,
			});
			console.log("Update result:", result);

			if (result.success) {
				toast.success(
					newTimeIn === 1
						? "Changed to Time In mode"
						: "Changed to Time Out mode"
				);

				// Update the timeIn value of the single session
				setSessions((prev) =>
					prev.map((s) => ({ ...s, attendanceS_timeIn: newTimeIn }))
				);
			} else {
				console.error("Failed to update attendance mode:", result);
				toast.error(result.message || "Failed to update attendance mode");
			}
		} catch (error) {
			console.error("Error updating attendance mode:", error);
			toast.error("Error updating attendance mode: " + error.message);
		} finally {
			setUpdatingSession(false);
		}
	};

	// Check if any session is active
	const activeSessions = sessions.filter(
		(session) => session.attendanceS_status === 1
	);

	const openRecordsModal = (session) => {
		setSelectedSession(session);
		setRecordsModalOpen(true);
	};

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm bg-opacity-50">
				<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-5xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<div className="flex gap-2 sm:gap-3 items-center min-w-0 flex-1">
							<div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 flex-shrink-0">
								<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div className="min-w-0 flex-1">
								<h2 className="text-sm sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
									Attendance Session Management
								</h2>
								<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
									Activate or deactivate attendance sessions
								</p>
							</div>
						</div>
						<div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
							<button
								onClick={handleRefresh}
								className="flex gap-1 sm:gap-2 items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh session data"
							>
								<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
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
					<div className="overflow-y-auto flex-1">
						<div className="p-4 sm:p-6">
							{/* Loading State */}
							{loading && (
								<div className="flex justify-center items-center py-8 sm:py-12">
									<div className="flex gap-2 sm:gap-3 items-center text-gray-500 dark:text-gray-400">
										<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
										<span className="text-sm sm:text-base">
											Loading attendance sessions...
										</span>
									</div>
								</div>
							)}

							{/* Active Session Indicator */}
							{!loading && activeSessions.length > 0 && (
								<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200 dark:bg-green-900/20 dark:border-green-700">
									<div className="flex gap-2 sm:gap-3 items-start">
										<div className="p-1.5 sm:p-2 bg-green-100 rounded-lg dark:bg-green-900/30 flex-shrink-0">
											<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
										</div>
										<div className="min-w-0 flex-1">
											<h3 className="text-sm sm:text-base font-medium text-green-800 dark:text-green-300">
												Active Sessions
											</h3>
											<p className="text-xs sm:text-sm text-green-700 dark:text-green-400">
												{activeSessions.length === 1
													? `${activeSessions[0].attendanceS_name} is currently active for attendance tracking`
													: `${activeSessions
															.map((s) => s.attendanceS_name)
															.join(
																", "
															)} are currently active for attendance tracking`}
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Sessions List */}
							{!loading && (
								<div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
									{sessions.length === 0 ? (
										<div className="col-span-full py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
											<Calendar className="mx-auto mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
											<p className="text-sm sm:text-base">
												No attendance sessions found
											</p>
										</div>
									) : (
										sessions.map((session) => (
											<div
												key={session.attendanceS_id}
												className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
													session.attendanceS_status === 1
														? "bg-white border-green-200 hover:border-green-300 dark:bg-gray-800 dark:border-green-700 dark:hover:border-green-600"
														: "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:border-gray-500"
												}`}
												onClick={() => openRecordsModal(session)}
											>
												{/* Session Header */}
												<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
													<div className="flex items-center gap-3">
														<div
															className={`p-2 rounded-lg ${
																session.attendanceS_status === 1
																	? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
																	: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
															}`}
														>
															{session.attendanceS_status === 1 ? (
																<CheckCircle className="w-5 h-5" />
															) : (
																<XCircle className="w-5 h-5" />
															)}
														</div>
														<div className="min-w-0 flex-1">
															<h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
																{session.attendanceS_name}
															</h3>
														</div>
													</div>
													<div className="flex items-center gap-2">
														{updatingSession === session.attendanceS_id && (
															<RefreshCw className="w-4 h-4 text-blue-600 animate-spin dark:text-blue-400" />
														)}
													</div>
												</div>

												{/* Status Control Section */}
												<div className="space-y-4">
													{/* Active/Inactive Toggle */}
													<div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2">
																<Power className="w-4 h-4 text-gray-600 dark:text-gray-400" />
																<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																	Session Status
																</span>
															</div>
															<div className="flex items-center gap-3">
																<span
																	className={`text-sm font-medium ${
																		session.attendanceS_status === 1
																			? "text-green-600 dark:text-green-400"
																			: "text-red-600 dark:text-red-400"
																	}`}
																>
																	{session.attendanceS_status === 1
																		? "Active"
																		: "Inactive"}
																</span>
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		handleStatusChange(
																			session.attendanceS_status === 1 ? 0 : 1
																		);
																	}}
																	disabled={
																		updatingSession === session.attendanceS_id
																	}
																	className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
																		session.attendanceS_status === 1
																			? "bg-green-600"
																			: "bg-gray-300 dark:bg-gray-600"
																	} ${
																		updatingSession === session.attendanceS_id
																			? "opacity-50 cursor-not-allowed"
																			: "cursor-pointer"
																	}`}
																>
																	<span
																		className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																			session.attendanceS_status === 1
																				? "translate-x-6"
																				: "translate-x-1"
																		}`}
																	/>
																</button>
															</div>
														</div>
													</div>

													{/* Time In/Out Control - Only shown when active */}
													{session.attendanceS_status === 1 && (
														<div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-2">
																	<Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
																	<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																		Attendance Mode
																	</span>
																</div>
																<div className="flex items-center gap-3">
																	<span
																		className={`text-sm font-medium ${
																			session.attendanceS_timeIn === 1
																				? "text-blue-600 dark:text-blue-400"
																				: "text-orange-600 dark:text-orange-400"
																		}`}
																	>
																		{session.attendanceS_timeIn === 1
																			? "Time In"
																			: "Time Out"}
																	</span>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			handleTimeInChange(
																				session.attendanceS_timeIn === 1 ? 0 : 1
																			);
																		}}
																		disabled={
																			updatingSession === session.attendanceS_id
																		}
																		className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
																			session.attendanceS_timeIn === 1
																				? "bg-blue-600"
																				: "bg-orange-500"
																		} ${
																			updatingSession === session.attendanceS_id
																				? "opacity-50 cursor-not-allowed"
																				: "cursor-pointer"
																		}`}
																	>
																		<span
																			className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
																				session.attendanceS_timeIn === 1
																					? "translate-x-6"
																					: "translate-x-1"
																			}`}
																		/>
																	</button>
																</div>
															</div>
														</div>
													)}
												</div>

												{/* Status Badges */}
												<div className="flex flex-wrap gap-2">
													{/* Active/Inactive Badge */}
													<span
														className={`inline-flex gap-1 items-center px-3 py-1 text-xs font-medium rounded-full ${
															session.attendanceS_status === 1
																? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
																: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
														}`}
													>
														{session.attendanceS_status === 1 ? (
															<>
																<CheckCircle className="w-3 h-3" />
																Active
															</>
														) : (
															<>
																<XCircle className="w-3 h-3" />
																Inactive
															</>
														)}
													</span>

													{/* Time In/Out Badge - Only shown when active */}
													{session.attendanceS_status === 1 && (
														<span
															className={`inline-flex gap-1 items-center px-3 py-1 text-xs font-medium rounded-full ${
																session.attendanceS_timeIn === 1
																	? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
																	: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
															}`}
														>
															{session.attendanceS_timeIn === 1 ? (
																<>
																	<LogIn className="w-3 h-3" />
																	Time In Mode
																</>
															) : (
																<>
																	<LogOut className="w-3 h-3" />
																	Time Out Mode
																</>
															)}
														</span>
													)}
												</div>
											</div>
										))
									)}
								</div>
							)}

							{/* Info Section */}
							{!loading && sessions.length > 0 && (
								<div className="p-4 sm:p-6 mt-6 bg-blue-50 rounded-xl dark:bg-blue-900/20">
									<div className="flex gap-3 items-start">
										<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 flex-shrink-0">
											<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
										</div>
										<div className="min-w-0 flex-1">
											<h4 className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-300 mb-2">
												How Attendance Sessions Work
											</h4>
											<div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
												<div className="flex gap-2 items-start">
													<div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
													<p>
														<strong>Session Status:</strong> Toggle whether the
														session is active for attendance tracking. Only
														active sessions can be used by faculty and SBO
														officers.
													</p>
												</div>
												<div className="flex gap-2 items-start">
													<div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
													<p>
														<strong>Click to View Records:</strong> Click on any
														session card to view detailed attendance records for
														all students.
													</p>
												</div>
											</div>
										</div>
									</div>
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

			<AdminSessionRecordsModal
				isOpen={recordsModalOpen}
				onClose={() => {
					setRecordsModalOpen(false);
					setSelectedSession(null);
				}}
				session={selectedSession}
			/>
		</>
	);
};

export default AdminAttendanceModal;
