import React, { useState, useRef, useEffect } from "react";
import {
	X,
	Upload,
	Download,
	FileSpreadsheet,
	Users,
	UserCog,
	GraduationCap,
	AlertCircle,
	CheckCircle2,
	XCircle,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { importUsersFromExcel, getYearLevels } from "../../utils/admin";
import * as XLSX from "xlsx";

export default function ExcelImportModal({
	isOpen,
	onClose,
	onImportComplete,
}) {
	const [activeTab, setActiveTab] = useState("import");
	const [userType, setUserType] = useState("Student");
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [defaultYearLevelId, setDefaultYearLevelId] = useState("");
	const [yearLevels, setYearLevels] = useState([]);
	const [importing, setImporting] = useState(false);
	const [importResults, setImportResults] = useState(null);
	const [previewData, setPreviewData] = useState([]);
	const [errors, setErrors] = useState([]);
	const [fileProcessingStatus, setFileProcessingStatus] = useState({});
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (!isOpen) return;
		fetchYearLevels();
	}, [isOpen]);

	async function fetchYearLevels() {
		try {
			const res = await getYearLevels();
			if (res?.success) {
				setYearLevels(res.yearLevels || []);
			}
		} catch (e) {
			console.error("getYearLevels error", e);
		}
	}

	function handleFileSelect(event) {
		const files = Array.from(event.target.files);
		if (files.length === 0) return;

		const validTypes = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
			"text/csv",
		];

		const invalidFiles = files.filter(
			(file) => !validTypes.includes(file.type)
		);
		if (invalidFiles.length > 0) {
			alert(
				`Please select valid Excel files (.xlsx, .xls) or CSV files (.csv). Invalid files: ${invalidFiles
					.map((f) => f.name)
					.join(", ")}`
			);
			return;
		}

		// Add new files to existing selection
		setSelectedFiles((prev) => [...prev, ...files]);

		// Process each new file
		files.forEach((file) => {
			parseExcelFile(file);
		});
	}

	function removeFile(fileToRemove) {
		setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
		setFileProcessingStatus((prev) => {
			const newStatus = { ...prev };
			delete newStatus[fileToRemove.name];
			return newStatus;
		});
		updatePreviewData();
	}

	function updatePreviewData() {
		// Combine preview data from all files (first 5 rows from each)
		const allPreviewData = [];
		selectedFiles.forEach((file) => {
			const fileData = fileProcessingStatus[file.name]?.data || [];
			allPreviewData.push(...fileData.slice(0, 5));
		});
		setPreviewData(allPreviewData.slice(0, 10)); // Show max 10 rows total
	}

	async function parseExcelFile(file) {
		try {
			setFileProcessingStatus((prev) => ({
				...prev,
				[file.name]: { status: "processing", data: [], errors: [] },
			}));

			let data = [];
			let headers = [];

			if (file.type === "text/csv") {
				// Handle CSV files
				const text = await file.text();
				const lines = text.split("\n");
				headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

				for (let i = 1; i < lines.length; i++) {
					if (lines[i].trim()) {
						const values = lines[i].split(",").map((v) => v.trim());
						const row = {};
						headers.forEach((header, index) => {
							row[header] = values[index] || "";
						});
						data.push(row);
					}
				}
			} else {
				// Handle Excel files (.xlsx, .xls)
				const arrayBuffer = await file.arrayBuffer();
				const workbook = XLSX.read(arrayBuffer, { type: "array" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// Convert to JSON with header row
				const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

				if (jsonData.length === 0) {
					setFileProcessingStatus((prev) => ({
						...prev,
						[file.name]: {
							status: "error",
							data: [],
							errors: ["Excel file is empty or has no data"],
						},
					}));
					return;
				}

				// First row contains headers
				headers = jsonData[0].map((h) => String(h).trim().toLowerCase());

				// Process data rows
				for (let i = 1; i < jsonData.length; i++) {
					const row = jsonData[i];
					if (
						row &&
						row.some(
							(cell) =>
								cell !== null &&
								cell !== undefined &&
								String(cell).trim() !== ""
						)
					) {
						const rowData = {};
						headers.forEach((header, index) => {
							rowData[header] = row[index] ? String(row[index]).trim() : "";
						});
						data.push(rowData);
					}
				}
			}

			// Validate headers
			const requiredHeaders = ["userid", "name", "email"];
			const missingHeaders = requiredHeaders.filter(
				(h) => !headers.includes(h)
			);

			if (missingHeaders.length > 0) {
				setFileProcessingStatus((prev) => ({
					...prev,
					[file.name]: {
						status: "error",
						data: [],
						errors: [`Missing required columns: ${missingHeaders.join(", ")}`],
					},
				}));
			} else {
				setFileProcessingStatus((prev) => ({
					...prev,
					[file.name]: {
						status: "success",
						data: data,
						errors: [],
					},
				}));
			}

			updatePreviewData();
		} catch (error) {
			console.error("Error parsing file:", error);
			setFileProcessingStatus((prev) => ({
				...prev,
				[file.name]: {
					status: "error",
					data: [],
					errors: [
						"Error parsing file. Please ensure it's a valid Excel/CSV file.",
					],
				},
			}));
		}
	}

	async function handleImport() {
		if (selectedFiles.length === 0 || !defaultYearLevelId) {
			alert("Please select at least one file and choose default year level");
			return;
		}

		// Check if all files are valid
		const invalidFiles = selectedFiles.filter(
			(file) => fileProcessingStatus[file.name]?.status !== "success"
		);

		if (invalidFiles.length > 0) {
			alert(
				`Please fix errors in the following files before importing: ${invalidFiles
					.map((f) => f.name)
					.join(", ")}`
			);
			return;
		}

		try {
			setImporting(true);

			// Combine all valid data from all files
			let allUsers = [];

			selectedFiles.forEach((file, fileIndex) => {
				const fileData = fileProcessingStatus[file.name]?.data || [];
				fileData.forEach((user, rowIndex) => {
					allUsers.push({
						...user,
						_sourceFile: file.name,
						_sourceRow: rowIndex + 2, // +2 because index 0 is first data row, and we start counting from 1
						_globalIndex: allUsers.length,
					});
				});
			});

			// Validate that we have users to import
			if (allUsers.length === 0) {
				alert("No valid data found in any of the files");
				setImporting(false);
				return;
			}

			// Validate each user has required fields and normalize field names
			const validUsers = [];
			const invalidUsers = [];

			allUsers.forEach((user) => {
				const userId = user.userid || user.user_id || "";
				const name = user.name || user.fullname || user.full_name || "";
				const email = user.email || "";

				if (!userId || !name || !email) {
					invalidUsers.push({
						file: user._sourceFile,
						row: user._sourceRow,
						userId: userId || "N/A",
						reason: `Missing required fields: ${[
							!userId && "ID",
							!name && "Name",
							!email && "Email",
						]
							.filter(Boolean)
							.join(", ")}`,
					});
				} else {
					// Normalize field names to match backend expectations
					validUsers.push({
						userId: userId,
						name: name,
						email: email,
					});
				}
			});

			if (validUsers.length === 0) {
				alert("No valid users found. All users are missing required fields.");
				setImporting(false);
				return;
			}

			// Debug logging
			console.log("Valid users:", validUsers);
			console.log("Invalid users:", invalidUsers);
			console.log("Total files processed:", selectedFiles.length);

			const importData = {
				users: validUsers,
				userType,
				defaultYearLevelId: parseInt(defaultYearLevelId),
			};

			console.log("Sending import data:", importData);

			const res = await importUsersFromExcel(importData);

			if (res?.success) {
				// Combine backend results with our validation results
				const combinedResults = {
					...res.results,
					failed: [...invalidUsers, ...(res.results.failed || [])],
					total:
						(res.results.success?.length || 0) +
						(res.results.failed?.length || 0) +
						invalidUsers.length,
					filesProcessed: selectedFiles.length,
				};

				setImportResults(combinedResults);
				setActiveTab("results");
				if (onImportComplete) {
					onImportComplete();
				}
			} else {
				alert(res?.message || "Import failed");
			}
		} catch (error) {
			console.error("Import error:", error);
			alert("Import failed. Please check the file format and try again.");
		} finally {
			setImporting(false);
		}
	}

	function resetForm() {
		setSelectedFiles([]);
		setDefaultYearLevelId("");
		setPreviewData([]);
		setErrors([]);
		setImportResults(null);
		setFileProcessingStatus({});
		setActiveTab("import");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function downloadTemplate() {
		const template =
			userType === "Student"
				? "userid,name,email\n02-2021-00100,John Doe,john.doe@example.com\n02-2021-00101,Jane Smith,jane.smith@example.com"
				: "userid,name,email\n02-1819-01500,John Doe,john.doe@example.com\n02-1819-01501,Jane Smith,jane.smith@example.com";

		const blob = new Blob([template], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${userType.toLowerCase()}_import_template.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center p-1 backdrop-blur-sm bg-black/50">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[98vh] overflow-hidden">
				{/* Header */}
				<div className="flex-shrink-0 p-6 text-white bg-gradient-to-r from-emerald-800 to-green-800">
					<div className="flex justify-between items-center">
						<div className="flex gap-3 items-center">
							<div className="p-2 rounded-lg bg-white/10">
								<FileSpreadsheet className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-xl font-bold">Bulk Import Users</h2>
								<p className="text-emerald-100">
									Import {userType}s from multiple Excel/CSV files
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-2 rounded-lg transition-colors hover:bg-white/10"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Tab Navigation */}
					<div className="flex gap-1 p-1 mt-4 rounded-lg bg-white/10">
						<button
							onClick={() => setActiveTab("import")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								activeTab === "import"
									? "bg-white text-emerald-800"
									: "text-white/80 hover:text-white"
							}`}
						>
							Import Data
						</button>
						<button
							onClick={() => setActiveTab("results")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								activeTab === "results"
									? "bg-white text-emerald-800"
									: "text-white/80 hover:text-white"
							}`}
						>
							Import Results
						</button>
					</div>
				</div>

				{/* Content */}
				<div
					className="overflow-y-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
					style={{ maxHeight: "calc(98vh - 140px)" }}
				>
					{activeTab === "import" ? (
						<div className="pb-6 space-y-6">
							{/* User Type Selection */}
							<div className="space-y-3">
								<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
									<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
									Import User Type *
								</label>
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => setUserType("Student")}
										className={`p-4 rounded-lg border-2 transition-all ${
											userType === "Student"
												? "border-green-500 bg-green-50 dark:bg-green-900/20"
												: "border-gray-200 dark:border-gray-600 hover:border-gray-300"
										}`}
									>
										<div className="flex flex-col gap-2 items-center">
											<GraduationCap
												className={`w-5 h-5 ${
													userType === "Student"
														? "text-green-600 dark:text-green-400"
														: "text-gray-400"
												}`}
											/>
											<span
												className={`text-sm font-medium ${
													userType === "Student"
														? "text-green-700 dark:text-green-300"
														: "text-gray-600 dark:text-gray-400"
												}`}
											>
												Students
											</span>
										</div>
									</button>
									<button
										type="button"
										onClick={() => setUserType("Faculty")}
										className={`p-4 rounded-lg border-2 transition-all ${
											userType === "Faculty"
												? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
												: "border-gray-200 dark:border-gray-600 hover:border-gray-300"
										}`}
									>
										<div className="flex flex-col gap-2 items-center">
											<UserCog
												className={`w-5 h-5 ${
													userType === "Faculty"
														? "text-blue-600 dark:text-blue-400"
														: "text-gray-400"
												}`}
											/>
											<span
												className={`text-sm font-medium ${
													userType === "Faculty"
														? "text-blue-700 dark:text-blue-300"
														: "text-gray-600 dark:text-gray-400"
												}`}
											>
												Faculty
											</span>
										</div>
									</button>
								</div>
							</div>

							{/* Default Settings */}
							<div className="space-y-2">
								<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
									<GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
									Default Year Level *
								</label>
								<select
									className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
									value={defaultYearLevelId}
									onChange={(e) => setDefaultYearLevelId(e.target.value)}
									required
								>
									<option value="">Select Default Year Level</option>
									{yearLevels.map((level) => (
										<option key={level.yearL_id} value={level.yearL_id}>
											{level.yearL_name}
										</option>
									))}
								</select>
							</div>

							{/* File Upload */}
							<div className="space-y-3">
								<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
									<Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
									Select Excel/CSV Files *
								</label>
								<div className="p-6 text-center rounded-lg border-2 border-gray-300 border-dashed transition-colors dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500">
									<input
										ref={fileInputRef}
										type="file"
										accept=".xlsx,.xls,.csv"
										multiple
										onChange={handleFileSelect}
										className="hidden"
									/>
									<button
										onClick={() => fileInputRef.current?.click()}
										className="flex flex-col gap-3 items-center w-full"
									>
										<Upload className="w-8 h-8 text-gray-400" />
										<div>
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												Click to select files
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Supports multiple .xlsx, .xls, and .csv files
											</p>
										</div>
									</button>
								</div>
							</div>

							{/* Selected Files List */}
							{selectedFiles.length > 0 && (
								<div className="space-y-3">
									<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
										<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
										Selected Files ({selectedFiles.length})
									</label>
									<div className="space-y-2">
										{selectedFiles.map((file, index) => {
											const status = fileProcessingStatus[file.name];
											return (
												<div
													key={index}
													className={`p-3 rounded-lg border-2 ${
														status?.status === "success"
															? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
															: status?.status === "error"
															? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
															: status?.status === "processing"
															? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
															: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
													}`}
												>
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<div className="flex gap-2 items-center">
																<FileSpreadsheet className="w-4 h-4 text-gray-600 dark:text-gray-400" />
																<span className="text-sm font-medium text-gray-900 dark:text-white">
																	{file.name}
																</span>
																<span className="text-xs text-gray-500 dark:text-gray-400">
																	({(file.size / 1024).toFixed(1)} KB)
																</span>
															</div>

															{status?.status === "success" && (
																<div className="flex gap-2 items-center mt-1">
																	<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
																	<span className="text-xs text-green-700 dark:text-green-300">
																		{status.data.length} records ready for
																		import
																	</span>
																</div>
															)}

															{status?.status === "error" && (
																<div className="mt-1">
																	{status.errors.map((error, errorIndex) => (
																		<div
																			key={errorIndex}
																			className="flex gap-2 items-center"
																		>
																			<XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
																			<span className="text-xs text-red-700 dark:text-red-300">
																				{error}
																			</span>
																		</div>
																	))}
																</div>
															)}

															{status?.status === "processing" && (
																<div className="flex gap-2 items-center mt-1">
																	<RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
																	<span className="text-xs text-yellow-700 dark:text-yellow-300">
																		Processing file...
																	</span>
																</div>
															)}
														</div>

														<button
															onClick={() => removeFile(file)}
															className="p-1 text-gray-400 hover:text-red-500 transition-colors"
															title="Remove file"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Template Download */}
							<div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
								<div className="flex gap-3 items-center">
									<Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
									<div className="flex-1">
										<h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
											Download Template
										</h4>
										<p className="text-xs text-blue-700 dark:text-blue-300">
											Use this template to ensure your data is formatted
											correctly. You can import multiple files with the same
											format.
										</p>
									</div>
									<button
										onClick={downloadTemplate}
										className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
									>
										Download
									</button>
								</div>
							</div>

							{/* Combined File Preview */}
							{selectedFiles.length > 0 && previewData.length > 0 && (
								<div className="space-y-3">
									<div className="flex gap-2 items-center">
										<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
										<span className="text-sm font-semibold text-gray-900 dark:text-white">
											Combined Preview ({previewData.length} rows from{" "}
											{selectedFiles.length} files)
										</span>
									</div>
									<div className="overflow-x-auto p-4 bg-gray-50 rounded-lg dark:bg-gray-900/50">
										<table className="w-full text-xs">
											<thead>
												<tr className="border-b border-gray-200 dark:border-gray-700">
													{previewData.length > 0 &&
														Object.keys(previewData[0]).map((header) => (
															<th
																key={header}
																className="p-2 font-medium text-left text-gray-700 dark:text-gray-300"
															>
																{header}
															</th>
														))}
												</tr>
											</thead>
											<tbody>
												{previewData.map((row, index) => (
													<tr
														key={index}
														className="border-b border-gray-100 dark:border-gray-800"
													>
														{Object.values(row).map((value, cellIndex) => (
															<td
																key={cellIndex}
																className="p-2 text-gray-600 dark:text-gray-400"
															>
																{value}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* Errors */}
							{errors.length > 0 && (
								<div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
									<div className="flex gap-2 items-start">
										<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
										<div className="space-y-1">
											<h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
												File Validation Errors
											</h4>
											<ul className="space-y-1 text-xs text-red-700 dark:text-red-300">
												{errors.map((error, index) => (
													<li key={index}>• {error}</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={resetForm}
									className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Reset
								</button>
								<button
									onClick={handleImport}
									disabled={
										importing ||
										selectedFiles.length === 0 ||
										!defaultYearLevelId
									}
									className="flex gap-2 items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{importing ? (
										<>
											<RefreshCw className="w-4 h-4 animate-spin" />
											Importing...
										</>
									) : (
										<>
											<Upload className="w-4 h-4" />
											Import Users ({selectedFiles.length} files)
										</>
									)}
								</button>
							</div>
						</div>
					) : (
						/* Results Tab */
						<div className="pb-6 space-y-6">
							{/* Summary */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
								<div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
									<div className="flex gap-3 items-center">
										<CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
										<div>
											<p className="text-2xl font-bold text-green-800 dark:text-green-200">
												{importResults?.success?.length || 0}
											</p>
											<p className="text-sm text-green-700 dark:text-green-300">
												Successfully Imported
											</p>
										</div>
									</div>
								</div>
								<div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
									<div className="flex gap-3 items-center">
										<XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
										<div>
											<p className="text-2xl font-bold text-red-800 dark:text-red-200">
												{importResults?.failed?.length || 0}
											</p>
											<p className="text-sm text-red-700 dark:text-red-300">
												Failed to Import
											</p>
										</div>
									</div>
								</div>
								<div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
									<div className="flex gap-3 items-center">
										<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
										<div>
											<p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
												{importResults?.total || 0}
											</p>
											<p className="text-sm text-blue-700 dark:text-blue-300">
												Total Records
											</p>
										</div>
									</div>
								</div>
								<div className="p-4 bg-purple-50 rounded-lg border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
									<div className="flex gap-3 items-center">
										<FileSpreadsheet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
										<div>
											<p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
												{importResults?.filesProcessed || 0}
											</p>
											<p className="text-sm text-purple-700 dark:text-purple-300">
												Files Processed
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Failed Imports */}
							{importResults?.failed?.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										Failed Imports
									</h3>
									<div className="overflow-hidden bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead className="bg-red-100 dark:bg-red-900/30">
													<tr>
														<th className="p-3 font-medium text-left text-red-800 dark:text-red-200">
															File
														</th>
														<th className="p-3 font-medium text-left text-red-800 dark:text-red-200">
															Row
														</th>
														<th className="p-3 font-medium text-left text-red-800 dark:text-red-200">
															User ID
														</th>
														<th className="p-3 font-medium text-left text-red-800 dark:text-red-200">
															Reason
														</th>
													</tr>
												</thead>
												<tbody>
													{importResults.failed.map((failure, index) => (
														<tr
															key={index}
															className="border-t border-red-200 dark:border-red-800"
														>
															<td className="p-3 text-red-700 dark:text-red-300">
																{failure.file || "N/A"}
															</td>
															<td className="p-3 text-red-700 dark:text-red-300">
																{failure.row}
															</td>
															<td className="p-3 text-red-700 dark:text-red-300">
																{failure.userId}
															</td>
															<td className="p-3 text-red-700 dark:text-red-300">
																{failure.reason}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{/* Success Imports */}
							{importResults?.success?.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										Successfully Imported
									</h3>
									<div className="overflow-hidden bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead className="bg-green-100 dark:bg-green-900/30">
													<tr>
														<th className="p-3 font-medium text-left text-green-800 dark:text-green-200">
															Row
														</th>
														<th className="p-3 font-medium text-left text-green-800 dark:text-green-200">
															User ID
														</th>
														<th className="p-3 font-medium text-left text-green-800 dark:text-green-200">
															Name
														</th>
														<th className="p-3 font-medium text-left text-green-800 dark:text-green-200">
															Email
														</th>
													</tr>
												</thead>
												<tbody>
													{importResults.success.map((success, index) => (
														<tr
															key={index}
															className="border-t border-green-200 dark:border-green-800"
														>
															<td className="p-3 text-green-700 dark:text-green-300">
																{success.row}
															</td>
															<td className="p-3 text-green-700 dark:text-green-300">
																{success.userId}
															</td>
															<td className="p-3 text-green-700 dark:text-green-300">
																{success.name}
															</td>
															<td className="p-3 text-green-700 dark:text-green-300">
																{success.email}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={resetForm}
									className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Import Another File
								</button>
								<button
									onClick={onClose}
									className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg hover:from-emerald-700 hover:to-green-700"
								>
									Done
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
