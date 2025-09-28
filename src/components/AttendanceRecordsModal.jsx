import React, { useEffect, useState } from "react";
import { Calendar, LogIn, LogOut, CheckCircle, XCircle, X } from "lucide-react";
import { getStudentAttendanceRecords } from "../utils/student";

const AttendanceRecordsModal = ({ isOpen, onClose, userId }) => {
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen || !userId) return;
		const fetchAttendanceRecords = async () => {
			setLoading(true);
			try {
				const result = await getStudentAttendanceRecords(userId);
				if (result.success) {
					setAttendanceRecords(result.records);
				} else {
					setAttendanceRecords([]);
				}
			} catch (error) {
				console.error("Error fetching attendance records:", error);
				setAttendanceRecords([]);
			} finally {
				setLoading(false);
			}
		};
		fetchAttendanceRecords();
	}, [isOpen, userId]);

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

	const getAttendanceStatus = (record) => {
		if (record.attendance_timeIn && record.attendance_timeOut) {
			return "Completed";
		} else if (record.attendance_timeIn && !record.attendance_timeOut) {
			return "Time In";
		}
		return "No record";
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 justify-center items-center bg-black bg-opacity-50 backdrop-blur-md z-80">
			<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col mx-0 sm:mx-4">
				{/* Header */}
				<div className="flex justify-between items-center p-3 border-b border-gray-200 sm:p-6 dark:border-gray-700 flex-shrink-0">
					<h2 className="text-base font-bold text-gray-800 sm:text-xl dark:text-gray-200">
						My Attendance Records
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 text-gray-500 rounded-lg transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						<X className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="p-3 sm:p-6">
						{loading ? (
							<div className="flex justify-center items-center py-8">
								<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
							</div>
						) : attendanceRecords.length === 0 ? (
							<div className="py-8 text-center">
								<Calendar className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
								<p className="text-sm text-gray-500 sm:text-base dark:text-gray-400">
									No attendance records found
								</p>
							</div>
						) : (
							<div className="space-y-2 sm:space-y-4">
								{attendanceRecords.map((record, index) => {
									const status = getAttendanceStatus(record);
									return (
										<div
											key={index}
											className="bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600 overflow-hidden"
										>
											{/* Status Bar */}
											<div
												className={`px-3 py-2 ${
													status === "Completed"
														? "bg-green-100 dark:bg-green-900"
														: status === "Time In"
														? "bg-yellow-100 dark:bg-yellow-900"
														: "bg-red-100 dark:bg-red-900"
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														{status === "Completed" && (
															<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
														)}
														{status === "Time In" && (
															<LogIn className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
														)}
														{status === "No record" && (
															<XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
														)}
														<span
															className={`text-sm font-medium ${
																status === "Completed"
																	? "text-green-800 dark:text-green-200"
																	: status === "Time In"
																	? "text-yellow-800 dark:text-yellow-200"
																	: "text-red-800 dark:text-red-200"
															}`}
														>
															{status === "Time In"
																? "→ Time In"
																: status === "Completed"
																? "✓ Completed"
																: status}
														</span>
													</div>
													<span className="text-xs text-gray-600 dark:text-gray-400">
														{formatDate(record.attendance_timeIn)}
													</span>
												</div>
											</div>

											{/* Card Content */}
											<div className="p-3">
												{/* Processor Information */}
												{(record.sbo_name || record.faculty_name) && (
													<div className="mb-3 space-y-1">
														{record.sbo_name && (
															<p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
																SBO: {record.sbo_name}
															</p>
														)}
														{record.faculty_name && (
															<p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
																Faculty: {record.faculty_name}
															</p>
														)}
													</div>
												)}

												{/* Time Information */}
												<div className="space-y-2">
													<div className="flex items-center gap-2 text-sm">
														<LogIn className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
														<span className="text-gray-600 dark:text-gray-300 font-medium">
															Time In:
														</span>
														<span className="text-gray-800 dark:text-gray-200">
															{formatTime(record.attendance_timeIn)}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm">
														<LogOut className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
														<span className="text-gray-600 dark:text-gray-300 font-medium">
															Time Out:
														</span>
														<span className="text-gray-800 dark:text-gray-200">
															{formatTime(record.attendance_timeOut)}
														</span>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AttendanceRecordsModal;
