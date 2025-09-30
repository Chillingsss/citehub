import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import {
	X,
	Calendar,
	RefreshCw,
	Users,
	CheckCircle,
	XCircle,
	Printer,
	GraduationCap,
	Search,
	Clock,
	ChevronLeft,
	ChevronRight,
	FileSpreadsheet,
} from "lucide-react";
import { getAttendanceReports, getYearLevels } from "../../utils/admin";
import * as XLSX from "xlsx";

const ReportsModal = ({ isOpen, onClose }) => {
	const [activeTab, setActiveTab] = useState("attendance");
	const [loading, setLoading] = useState(false);
	const [attendanceData, setAttendanceData] = useState([]);
	const [yearLevels, setYearLevels] = useState([]);
	const [selectedDate, setSelectedDate] = useState(() => {
		const now = new Date();
		const philippinesTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
		return philippinesTime.toISOString().split("T")[0];
	});
	const [selectedYearLevel, setSelectedYearLevel] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [studentsPerPage] = useState(20);

	useEffect(() => {
		if (!isOpen) return;
		fetchYearLevels();
		fetchAttendanceReports();
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			fetchAttendanceReports();
		}
	}, [selectedDate, selectedYearLevel]);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedDate, selectedYearLevel, selectedStatus, searchQuery]);

	const fetchYearLevels = async () => {
		try {
			const response = await getYearLevels();
			if (response.success) {
				setYearLevels(response.yearLevels);
			}
		} catch (error) {
			console.error("Error fetching year levels:", error);
		}
	};

	const fetchAttendanceReports = async () => {
		try {
			setLoading(true);
			const response = await getAttendanceReports({
				date: selectedDate,
				yearLevelId: selectedYearLevel === "all" ? null : selectedYearLevel,
			});
			if (response.success) {
				setAttendanceData(response.attendance);
			} else {
				toast.error(response.message || "Failed to fetch attendance data");
			}
		} catch (error) {
			console.error("Error fetching attendance reports:", error);
			toast.error("Error fetching attendance reports");
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = () => {
		fetchAttendanceReports();
		toast.success("Reports refreshed successfully!");
	};

	const handleExportExcel = () => {
		try {
			// Prepare data for Excel export
			const excelData = filteredAttendanceData.map((record, index) => ({
				"No.": index + 1,
				"Student Name": record.student_name || "N/A",
				"Student ID": record.student_id || "N/A",
				"Year Level": record.year_level || "N/A",
				Tribe: record.tribe_name || "No Tribe",
				Status: record.status === "present" ? "Present" : "Absent",
				"Time In": record.time_in
					? formatPhilippineTime(record.time_in)
					: "N/A",
				"Time Out": record.time_out
					? formatPhilippineTime(record.time_out)
					: "N/A",
			}));

			// Create workbook and worksheet
			const wb = XLSX.utils.book_new();
			const ws = XLSX.utils.json_to_sheet(excelData);

			// Set column widths
			const colWidths = [
				{ wch: 5 }, // No.
				{ wch: 30 }, // Student Name
				{ wch: 15 }, // Student ID
				{ wch: 12 }, // Year Level
				{ wch: 20 }, // Tribe
				{ wch: 10 }, // Status
				{ wch: 15 }, // Time In
				{ wch: 15 }, // Time Out
			];
			ws["!cols"] = colWidths;

			// Add the worksheet to workbook
			XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

			// Generate filename with date and filters
			const dateStr = formatPhilippineDate(selectedDate).replace(
				/[^a-zA-Z0-9]/g,
				"_"
			);
			const yearLevelStr =
				selectedYearLevel === "all"
					? "All_Levels"
					: yearLevels
							.find((l) => l.yearL_id == selectedYearLevel)
							?.yearL_name?.replace(/[^a-zA-Z0-9]/g, "_") || "All";
			const statusStr =
				selectedStatus === "all"
					? "All_Status"
					: selectedStatus === "present"
					? "Present_Only"
					: "Absent_Only";

			const filename = `Attendance_Report_${dateStr}_${yearLevelStr}_${statusStr}.xlsx`;

			// Export the file
			XLSX.writeFile(wb, filename);

			toast.success(
				`Excel file "${filename}" has been downloaded successfully!`
			);
		} catch (error) {
			console.error("Error exporting to Excel:", error);
			toast.error("Failed to export Excel file. Please try again.");
		}
	};

	const handleExport = () => {
		handleExportExcel();
	};

	// Format date to Philippine format
	const formatPhilippineDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		const options = {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		};
		return date.toLocaleDateString("en-PH", options);
	};

	// Format time to Philippine format (12-hour with AM/PM)
	const formatPhilippineTime = (timeString) => {
		if (!timeString) return "N/A";

		let date;
		// Check if it's a full datetime string (contains space or T)
		if (timeString.includes(" ") || timeString.includes("T")) {
			// It's a full datetime, parse it directly
			date = new Date(timeString);
		} else {
			// It's just a time string, create a date with it
			date = new Date(`2000-01-01T${timeString}`);
		}

		// Check if the date is valid
		if (isNaN(date.getTime())) {
			return "Invalid Time";
		}

		return date.toLocaleTimeString("en-PH", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Group attendance data by student (without sessions)
	const groupAttendanceByStudent = (data) => {
		const grouped = {};

		data.forEach((record) => {
			const studentId = record.student_id;

			if (!grouped[studentId]) {
				grouped[studentId] = {
					student_id: record.student_id,
					student_name: record.student_name,
					student_avatar: record.student_avatar,
					year_level: record.year_level,
					tribe_name: record.tribe_name,
					status: record.status || "absent",
					time_in: record.time_in,
					time_out: record.time_out,
					attendance_date: record.attendance_date,
				};
			}
		});

		return Object.values(grouped);
	};

	const handlePrint = () => {
		// Create a clean table for printing without avatar circles and icons
		const printTable = document
			.getElementById("attendance-table")
			.cloneNode(true);

		// Replace the table body with all filtered data (not just current page)
		const tbody = printTable.querySelector("tbody");
		if (tbody) {
			tbody.innerHTML = "";

			// Generate rows for all filtered students (not just current page)
			filteredAttendanceData.forEach((record, index) => {
				const row = document.createElement("tr");
				row.className =
					"transition-colors hover:bg-gray-50 dark:hover:bg-gray-600/50";

				// Student column
				const studentCell = document.createElement("td");
				studentCell.className = "px-4 py-4 whitespace-nowrap";
				studentCell.innerHTML = `
					<div class="flex items-center">
						<div class="ml-3">
							<div class="text-sm font-medium text-gray-900 dark:text-white">
								${record.student_name}
							</div>
						</div>
					</div>
				`;
				row.appendChild(studentCell);

				// ID column
				const idCell = document.createElement("td");
				idCell.className =
					"px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white";
				idCell.textContent = record.student_id;
				row.appendChild(idCell);

				// Year Level column
				const yearLevelCell = document.createElement("td");
				yearLevelCell.className =
					"px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white";
				yearLevelCell.textContent = record.year_level;
				row.appendChild(yearLevelCell);

				// Tribe column
				const tribeCell = document.createElement("td");
				tribeCell.className =
					"px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white";
				tribeCell.textContent = record.tribe_name || "No Tribe";
				row.appendChild(tribeCell);

				// Status column
				const statusCell = document.createElement("td");
				statusCell.className = "px-4 py-4 whitespace-nowrap";
				statusCell.innerHTML = `
					<div class="flex justify-center items-center">
						<span class="status-badge inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
							record.status
						)}">
							${getStatusText(record.status)}
						</span>
					</div>
				`;
				row.appendChild(statusCell);

				// Remove sessions column completely

				// Time In column
				const timeInCell = document.createElement("td");
				timeInCell.className = "px-4 py-4 whitespace-nowrap";
				timeInCell.style.textAlign = "center";
				timeInCell.innerHTML = `<div style="line-height: 1.4;">${
					record.time_in ? formatPhilippineTime(record.time_in) : "N/A"
				}</div>`;
				row.appendChild(timeInCell);

				// Time Out column
				const timeOutCell = document.createElement("td");
				timeOutCell.className = "px-4 py-4 whitespace-nowrap";
				timeOutCell.style.textAlign = "center";
				timeOutCell.innerHTML = `<div style="line-height: 1.4;">${
					record.time_out ? formatPhilippineTime(record.time_out) : "N/A"
				}</div>`;
				row.appendChild(timeOutCell);

				tbody.appendChild(row);
			});
		}

		// Remove ID column (2nd column)
		const idHeaders = printTable.querySelectorAll("th:nth-child(2)");
		const idCells = printTable.querySelectorAll("td:nth-child(2)");
		idHeaders.forEach((header) => header.remove());
		idCells.forEach((cell) => cell.remove());

		// Remove Tribe column (3rd column after ID removal)
		const tribeHeaders = printTable.querySelectorAll("th:nth-child(3)");
		const tribeCells = printTable.querySelectorAll("td:nth-child(3)");
		tribeHeaders.forEach((header) => header.remove());
		tribeCells.forEach((cell) => cell.remove());

		// Remove avatar circles and first letters from the print table
		const avatarCells = printTable.querySelectorAll("td:first-child");
		avatarCells.forEach((cell) => {
			cell.innerHTML = cell.querySelector(".text-sm")?.textContent.trim() || "";
		});

		// Remove all icons from the print table
		const iconElements = printTable.querySelectorAll("svg, .lucide");
		iconElements.forEach((icon) => {
			icon.remove();
		});

		// Time formatting is already handled in the cell creation above

		const printContent = `
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<div style="text-align: center; margin-bottom: 30px;">
					<div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
						<img src="${
							window.location.origin
						}/images/cocLogo.png" alt="PHINMA COC Logo" style="height: 80px; width: auto; margin-right: 20px;" onerror="this.style.display='none';" />
						<div>
							<h1 style="color: #1f2937; margin: 0; font-size: 24px;">PHINMA Cagayan de Oro College</h1>
							<h2 style="color: #374151; margin: 5px 0; font-size: 18px;">Attendance Report</h2>
						</div>
					</div>
					<p style="color: #6b7280; margin: 5px 0;">Date: ${formatPhilippineDate(
						selectedDate
					)}</p>
					<p style="color: #6b7280; margin: 5px 0;">Year Level: ${
						selectedYearLevel === "all"
							? "All Year Levels"
							: yearLevels.find((l) => l.yearL_id == selectedYearLevel)
									?.yearL_name || "All"
					}</p>
					<p style="color: #6b7280; margin: 5px 0;">Status: ${
						selectedStatus === "all"
							? "All Status"
							: selectedStatus === "present"
							? "Present Only"
							: "Absent Only"
					}</p>
					<p style="color: #6b7280; margin: 5px 0;">Generated: ${new Date().toLocaleString(
						"en-PH"
					)}</p>
				</div>
				<div style="margin-bottom: 20px;">
					<div style="display: inline-block; margin-right: 30px;">
						<span style="background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
							Present: ${filteredAttendanceData.filter((r) => r.status === "present").length}
						</span>
					</div>
					<div style="display: inline-block;">
						<span style="background: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
							Absent: ${filteredAttendanceData.filter((r) => r.status === "absent").length}
						</span>
					</div>
				</div>
				${printTable.outerHTML}
			</div>
		`;

		const printWindow = window.open("", "_blank");
		printWindow.document.write(`
			<html>
				<head>
					<title>Attendance Report - ${formatPhilippineDate(selectedDate)}</title>
							<style>
						@media print {
							body { margin: 0; }
							table { width: 100%; border-collapse: collapse; }
							th, td { 
								border: 1px solid #ddd; 
								padding: 6px 8px; 
								text-align: left;
								font-size: 11px;
								vertical-align: top;
							}
							th { 
								background-color: #f3f4f6;
								font-weight: bold;
								font-size: 12px;
							}
							tr:nth-child(even) { background-color: #f9fafb; }
							/* Column widths for print - after removing ID and Tribe columns */
							th:nth-child(1), td:nth-child(1) { width: 50%; padding-left: 6px; } /* Student Name (increased) */
							th:nth-child(2), td:nth-child(2) { width: 12%; text-align: center; } /* Year Level (reduced) */
							th:nth-child(3), td:nth-child(3) { width: 12%; text-align: center; } /* Status (reduced) */
							th:nth-child(4), td:nth-child(4) { width: 13%; text-align: center; } /* Time In (slightly increased) */
							th:nth-child(5), td:nth-child(5) { width: 13%; text-align: center; } /* Time Out (slightly increased) */
							
							/* Student name column styling */
							td:first-child { 
								max-width: 250px;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
								font-weight: 500;
							}
							
							/* Center align headers for Year Level, Status, Time In, Time Out */
							th:nth-child(2), th:nth-child(3), th:nth-child(4), th:nth-child(5) {
								text-align: center;
							}
							
							/* Compact status badges */
							.status-badge {
								font-size: 9px !important;
								padding: 2px 6px !important;
							}
							
							/* Multiple time entries styling */
							td:nth-child(4) div, td:nth-child(5) div {
								line-height: 1.4;
								margin: 0;
							}
							
							/* Ensure proper spacing for multiple sessions */
							br {
								line-height: 1.4;
							}
						}
					</style>
				</head>
				<body>${printContent}</body>
			</html>
		`);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	};

	// Group and filter attendance data
	const groupedAttendanceData = groupAttendanceByStudent(attendanceData);
	const filteredAttendanceData = groupedAttendanceData.filter((record) => {
		// Search filter
		if (searchQuery) {
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				(record.student_name?.toLowerCase() || "").includes(searchLower) ||
				(record.student_id?.toLowerCase() || "").includes(searchLower) ||
				(record.tribe_name?.toLowerCase() || "").includes(searchLower);
			if (!matchesSearch) return false;
		}

		// Status filter
		if (selectedStatus !== "all") {
			if (record.status !== selectedStatus) return false;
		}

		// No session filter needed

		return true;
	});

	// Pagination logic
	const indexOfLastStudent = currentPage * studentsPerPage;
	const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
	const currentStudents = filteredAttendanceData.slice(
		indexOfFirstStudent,
		indexOfLastStudent
	);
	const totalPages = Math.ceil(filteredAttendanceData.length / studentsPerPage);

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total is less than max visible
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Show pages around current page
			const startPage = Math.max(
				1,
				currentPage - Math.floor(maxVisiblePages / 2)
			);
			const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}
		}

		return pages;
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "present":
				return <CheckCircle className="w-5 h-5 text-green-500" />;
			case "absent":
				return <XCircle className="w-5 h-5 text-red-500" />;
			default:
				return <XCircle className="w-5 h-5 text-gray-400" />;
		}
	};

	const getStatusText = (status) => {
		switch (status) {
			case "present":
				return "Present";
			case "absent":
				return "Absent";
			default:
				return "Unknown";
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "present":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
			case "absent":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-opacity-50 backdrop-blur-sm bg-black/50">
				<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-7xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-col flex-shrink-0 gap-3 p-4 border-b sm:flex-row sm:justify-between sm:items-center sm:gap-0 sm:p-6 dark:border-gray-700">
						<div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
							<div className="flex justify-between items-center">
								<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
									Reports
								</h2>
								<div className="flex gap-2 items-center sm:hidden">
									<button
										onClick={handleRefresh}
										className="flex gap-2 items-center p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
										title="Refresh data"
									>
										<RefreshCw className="w-4 h-4" />
									</button>
									<button
										onClick={handleExport}
										className="flex gap-2 items-center p-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
										title="Export to Excel"
									>
										<FileSpreadsheet className="w-4 h-4" />
									</button>
									<button
										onClick={handlePrint}
										className="flex gap-2 items-center p-2 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
										title="Print data"
									>
										<Printer className="w-4 h-4" />
									</button>
									<button
										onClick={onClose}
										className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<X className="w-6 h-6" />
									</button>
								</div>
							</div>
							<div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
								<div className="flex gap-2 justify-start items-center px-3 py-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 sm:rounded-full sm:px-3 sm:py-1">
									<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									<span className="text-sm font-medium text-blue-800 dark:text-blue-300">
										Date: {formatPhilippineDate(selectedDate)}
									</span>
								</div>
								{selectedYearLevel !== "all" && (
									<div className="flex gap-2 justify-start items-center px-3 py-2 bg-green-100 rounded-lg dark:bg-green-900/30 sm:rounded-full sm:px-3 sm:py-1">
										<GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
										<span className="text-sm font-medium text-green-800 dark:text-green-300">
											{
												yearLevels.find((l) => l.yearL_id == selectedYearLevel)
													?.yearL_name
											}
										</span>
									</div>
								)}
								{selectedStatus !== "all" && (
									<div className="flex gap-2 justify-start items-center px-3 py-2 bg-purple-100 rounded-lg dark:bg-purple-900/30 sm:rounded-full sm:px-3 sm:py-1">
										<CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
										<span className="text-sm font-medium text-purple-800 dark:text-purple-300">
											{selectedStatus === "present" ? "Present" : "Absent"}
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="hidden gap-2 items-center sm:flex">
							<button
								onClick={handleRefresh}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh data"
							>
								<RefreshCw className="w-4 h-4" />
								<span>Refresh</span>
							</button>
							<button
								onClick={handleExport}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
								title="Export to Excel"
							>
								<FileSpreadsheet className="w-4 h-4" />
								<span>Export Excel</span>
							</button>
							<button
								onClick={handlePrint}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
								title="Print data"
							>
								<Printer className="w-4 h-4" />
								<span>Print</span>
							</button>
							<button
								onClick={onClose}
								className="p-2 text-gray-400 rounded-lg transition-colors hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex flex-shrink-0 border-b dark:border-gray-700">
						<button
							onClick={() => setActiveTab("attendance")}
							className={`flex gap-2 items-center px-4 py-3 text-sm font-medium transition-colors ${
								activeTab === "attendance"
									? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
									: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							}`}
						>
							<CheckCircle className="w-4 h-4" />
							Attendance
						</button>
						{/* Add more tabs here as needed */}
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1">
						<div className="p-4 space-y-6 sm:p-6">
							{activeTab === "attendance" && (
								<div className="space-y-6">
									{/* Filters */}
									<div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
										{/* First Row - Date and Year Level */}
										<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
												<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
													<Calendar className="w-4 h-4" />
													Date:
												</label>
												<input
													type="date"
													value={selectedDate}
													max={new Date().toISOString().split("T")[0]}
													onChange={(e) => {
														const selectedDate = e.target.value;
														const today = new Date()
															.toISOString()
															.split("T")[0];

														// Prevent selecting future dates
														if (selectedDate > today) {
															toast.error(
																"Cannot select future dates. Please select today or a past date."
															);
															setSelectedDate(today);
														} else {
															setSelectedDate(selectedDate);
														}
													}}
													className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
												/>
											</div>
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
												<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
													<GraduationCap className="w-4 h-4" />
													Year Level:
												</label>
												<div className="relative">
													<select
														value={selectedYearLevel}
														onChange={(e) =>
															setSelectedYearLevel(e.target.value)
														}
														className="px-4 py-2.5 pr-10 w-full text-sm bg-white rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-200 appearance-none cursor-pointer dark:bg-gray-600 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 hover:border-gray-300 dark:hover:border-gray-400"
													>
														<option value="all" className="py-2">
															All Year Levels
														</option>
														{yearLevels.map((level) => (
															<option
																key={level.yearL_id}
																value={level.yearL_id}
																className="py-2"
															>
																{level.yearL_name}
															</option>
														))}
													</select>
													<div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
														<svg
															className="w-5 h-5 text-gray-400 transition-transform duration-200 dark:text-gray-300"
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
											</div>
										</div>

										{/* Second Row - Status and Session */}
										<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
												<label className="flex gap-2 items-center text-sm font-medium text-gray-700 dark:text-gray-300">
													<CheckCircle className="w-4 h-4" />
													Status:
												</label>
												<div className="relative">
													<select
														value={selectedStatus}
														onChange={(e) => setSelectedStatus(e.target.value)}
														className="px-4 py-2.5 pr-10 w-full text-sm bg-white rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-200 appearance-none cursor-pointer dark:bg-gray-600 dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 hover:border-gray-300 dark:hover:border-gray-400"
													>
														<option value="all" className="py-2">
															All Status
														</option>
														<option value="present" className="py-2">
															Present
														</option>
														<option value="absent" className="py-2">
															Absent
														</option>
													</select>
													<div className="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
														<svg
															className="w-5 h-5 text-gray-400 transition-transform duration-200 dark:text-gray-300"
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
											</div>
										</div>
									</div>

									{/* Search */}
									<div className="relative">
										<Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
										<input
											type="text"
											placeholder="Search students, ID, or tribe..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="py-2 pr-4 pl-10 w-full text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
										/>
									</div>

									{/* Statistics */}
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
											<div className="flex gap-3 items-center">
												<CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
												<div>
													<p className="text-sm font-medium text-green-800 dark:text-green-300">
														Present
													</p>
													<p className="text-2xl font-bold text-green-900 dark:text-green-100">
														{
															filteredAttendanceData.filter(
																(r) => r.status === "present"
															).length
														}
													</p>
												</div>
											</div>
										</div>
										<div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
											<div className="flex gap-3 items-center">
												<XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
												<div>
													<p className="text-sm font-medium text-red-800 dark:text-red-300">
														Absent
													</p>
													<p className="text-2xl font-bold text-red-900 dark:text-red-100">
														{
															filteredAttendanceData.filter(
																(r) => r.status === "absent"
															).length
														}
													</p>
												</div>
											</div>
										</div>
									</div>

									{/* Attendance Table */}
									<div className="overflow-hidden bg-white rounded-lg border dark:bg-gray-700 dark:border-gray-600">
										<div className="overflow-x-auto">
											<table className="w-full" id="attendance-table">
												<thead className="bg-gray-50 dark:bg-gray-600">
													<tr>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Student
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															ID
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Year Level
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Tribe
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Status
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Time In
														</th>
														<th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
															Time Out
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-200 dark:divide-gray-600">
													{loading ? (
														<tr>
															<td colSpan="5" className="px-4 py-8 text-center">
																<div className="flex justify-center items-center">
																	<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
																</div>
															</td>
														</tr>
													) : filteredAttendanceData.length === 0 ? (
														<tr>
															<td
																colSpan="5"
																className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
															>
																<Users className="mx-auto mb-2 w-8 h-8" />
																<p>
																	No attendance records found for the selected
																	criteria.
																</p>
															</td>
														</tr>
													) : (
														currentStudents.map((record, index) => {
															return (
																<tr
																	key={index}
																	className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-600/50"
																>
																	<td className="px-4 py-4 whitespace-nowrap">
																		<div className="flex items-center">
																			<div className="flex-shrink-0 w-8 h-8">
																				{record.student_avatar ? (
																					<img
																						className="w-8 h-8 rounded-full"
																						src={record.student_avatar}
																						alt={record.student_name}
																					/>
																				) : (
																					<div className="flex justify-center items-center w-8 h-8 bg-gray-300 rounded-full dark:bg-gray-600">
																						<span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
																							{record.student_name?.[0] || "?"}
																						</span>
																					</div>
																				)}
																			</div>
																			<div className="ml-3">
																				<div className="text-sm font-medium text-gray-900 dark:text-white">
																					{record.student_name}
																				</div>
																			</div>
																		</div>
																	</td>
																	<td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
																		{record.student_id}
																	</td>
																	<td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
																		{record.year_level}
																	</td>
																	<td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
																		{record.tribe_name || "No Tribe"}
																	</td>
																	<td className="px-4 py-4 whitespace-nowrap">
																		<div className="flex gap-2 items-center">
																			{getStatusIcon(record.status)}
																			<span
																				className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
																					record.status
																				)}`}
																			>
																				{getStatusText(record.status)}
																			</span>
																		</div>
																	</td>
																	<td className="px-4 py-4 whitespace-nowrap">
																		<div className="flex gap-2 items-center">
																			<Clock className="w-4 h-4 text-blue-500" />
																			<span className="text-xs text-gray-900 dark:text-white">
																				{record.time_in
																					? formatPhilippineTime(record.time_in)
																					: "N/A"}
																			</span>
																		</div>
																	</td>
																	<td className="px-4 py-4 whitespace-nowrap">
																		<div className="flex gap-2 items-center">
																			<Clock className="w-4 h-4 text-red-500" />
																			<span className="text-xs text-gray-900 dark:text-white">
																				{record.time_out
																					? formatPhilippineTime(
																							record.time_out
																					  )
																					: "N/A"}
																			</span>
																		</div>
																	</td>
																</tr>
															);
														})
													)}
												</tbody>
											</table>
										</div>
									</div>

									{/* Pagination */}
									{filteredAttendanceData.length > studentsPerPage && (
										<div className="flex justify-between items-center px-4 py-3 bg-white border-t dark:bg-gray-700 dark:border-gray-600">
											<div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
												<span>
													Showing {indexOfFirstStudent + 1} to{" "}
													{Math.min(
														indexOfLastStudent,
														filteredAttendanceData.length
													)}{" "}
													of {filteredAttendanceData.length} students
												</span>
											</div>
											<div className="flex gap-2 items-center">
												<button
													onClick={() =>
														setCurrentPage(Math.max(1, currentPage - 1))
													}
													disabled={currentPage === 1}
													className="flex items-center px-3 py-1 text-sm font-medium text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-500"
												>
													<ChevronLeft className="w-4 h-4" />
													Previous
												</button>

												{getPageNumbers().map((pageNumber) => (
													<button
														key={pageNumber}
														onClick={() => setCurrentPage(pageNumber)}
														className={`px-3 py-1 text-sm font-medium rounded-md ${
															currentPage === pageNumber
																? "text-white bg-blue-600 border border-blue-600"
																: "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-500"
														}`}
													>
														{pageNumber}
													</button>
												))}

												<button
													onClick={() =>
														setCurrentPage(
															Math.min(totalPages, currentPage + 1)
														)
													}
													disabled={currentPage === totalPages}
													className="flex items-center px-3 py-1 text-sm font-medium text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-500"
												>
													Next
													<ChevronRight className="w-4 h-4" />
												</button>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default ReportsModal;
