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
				<div className="flex justify-between items-center p-4 border-b border-gray-200 sm:p-6 dark:border-gray-700 flex-shrink-0">
					<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
						My Attendance Records
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-gray-500 rounded-lg transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						<X className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="p-4 sm:p-6">
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
							<div className="space-y-3 sm:space-y-4">
								{attendanceRecords.map((record, index) => {
									const status = getAttendanceStatus(record);
									return (
										<div
											key={index}
											className="p-3 bg-gray-50 rounded-lg border border-gray-200 sm:p-4 dark:bg-gray-700 dark:border-gray-600"
										>
											<div className="flex flex-col gap-2 mb-3 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
												<div>
													<p className="text-xs text-gray-600 sm:text-sm dark:text-gray-400">
														{formatDate(record.attendance_timeIn)}
													</p>
													{/* Processor Information */}
													<div className="mt-1 space-y-1">
														{record.sbo_name && (
															<p className="text-xs text-blue-600 sm:text-sm dark:text-blue-400">
																SBO: {record.sbo_name}
															</p>
														)}
														{record.faculty_name && (
															<p className="text-xs text-purple-600 sm:text-sm dark:text-purple-400">
																Faculty: {record.faculty_name}
															</p>
														)}
													</div>
												</div>
												<span
													className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
														status === "Completed"
															? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
															: status === "Time In"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
															: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
													}`}
												>
													{status === "Completed" && (
														<CheckCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
													)}
													{status === "Time In" && (
														<LogIn className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
													)}
													{status === "No record" && (
														<XCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
													)}
													{status}
												</span>
											</div>

											<div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:gap-4 sm:text-sm">
												<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
													<LogIn className="flex-shrink-0 w-3 h-3 text-green-600 sm:w-4 sm:h-4 dark:text-green-400" />
													<span className="font-medium">Time In:</span>
													<span>{formatTime(record.attendance_timeIn)}</span>
												</div>
												<div className="flex gap-2 items-center text-gray-600 dark:text-gray-300">
													<LogOut className="flex-shrink-0 w-3 h-3 text-red-600 sm:w-4 sm:h-4 dark:text-red-400" />
													<span className="font-medium">Time Out:</span>
													<span>{formatTime(record.attendance_timeOut)}</span>
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
