import React, { useState, useRef } from "react";
import {
	X,
	Upload,
	FileSpreadsheet,
	Users,
	UserCog,
	AlertCircle,
	CheckCircle2,
	XCircle,
	RefreshCw,
	Info,
} from "lucide-react";
import { updateUserTribe } from "../../utils/admin";
import * as XLSX from "xlsx";

export default function TribeImportModal({
	isOpen,
	onClose,
	tribes,
	onImportComplete,
}) {
	const [importing, setImporting] = useState(false);
	const [importResults, setImportResults] = useState(null);
	const [previewData, setPreviewData] = useState([]);
	const [errors, setErrors] = useState([]);
	const fileInputRef = useRef(null);

	// Multiple tribes queue
	const [tribeQueue, setTribeQueue] = useState([]);
	const [currentTribeId, setCurrentTribeId] = useState("");
	const [currentFile, setCurrentFile] = useState(null);

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		const validTypes = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
			"text/csv",
		];

		if (!validTypes.includes(file.type)) {
			alert(
				"Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)"
			);
			return;
		}

		setCurrentFile(file);
		parseExcelFile(file);
	}

	function addToQueue() {
		if (!currentTribeId || !currentFile) {
			alert("Please select both a tribe and a file");
			return;
		}

		const selectedTribe = tribes?.find((t) => t.tribe_id == currentTribeId);
		const tribeName = selectedTribe?.tribe_name || "Unknown Tribe";

		const queueItem = {
			id: Date.now(),
			tribeId: currentTribeId,
			tribeName: tribeName,
			file: currentFile,
			fileName: currentFile.name,
			previewData: previewData,
		};

		setTribeQueue((prev) => [...prev, queueItem]);

		// Reset current selection
		setCurrentTribeId("");
		setCurrentFile(null);
		setPreviewData([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function parseExcelFile(file) {
		try {
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
					setErrors(["Excel file is empty or has no data"]);
					setPreviewData([]);
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

			// Validate headers - we need at least userid, name
			const requiredHeaders = ["userid", "name"];
			const missingHeaders = requiredHeaders.filter(
				(h) => !headers.includes(h)
			);

			if (missingHeaders.length > 0) {
				setErrors([`Missing required columns: ${missingHeaders.join(", ")}`]);
				setPreviewData([]);
				return;
			}

			setErrors([]);
			setPreviewData(data.slice(0, 5));
		} catch (error) {
			console.error("Error parsing file:", error);
			setErrors([
				"Error parsing file. Please ensure it's a valid Excel/CSV file.",
			]);
		}
	}

	function removeFromQueue(id) {
		setTribeQueue((prev) => prev.filter((item) => item.id !== id));
	}

	function clearQueue() {
		setTribeQueue([]);
		setCurrentTribeId("");
		setCurrentFile(null);
		setPreviewData([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function handleImport() {
		if (tribeQueue.length === 0) {
			alert("Please add at least one tribe and file to the queue");
			return;
		}

		try {
			setImporting(true);
			const allResults = [];

			// Process each item in the queue
			for (const queueItem of tribeQueue) {
				const file = queueItem.file;
				const tribeId = queueItem.tribeId;
				const tribeName = queueItem.tribeName;

				let users = [];
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
							users.push(row);
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
						allResults.push({
							tribeName,
							success: [],
							failed: [{ reason: "Excel file is empty or has no data" }],
							total: 0,
						});
						continue;
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
							users.push(rowData);
						}
					}
				}

				// Validate that we have users to process
				if (users.length === 0) {
					allResults.push({
						tribeName,
						success: [],
						failed: [{ reason: "No valid data found in the file" }],
						total: 0,
					});
					continue;
				}

				// Validate each user has required fields and normalize field names
				const validUsers = [];
				const invalidUsers = [];

				users.forEach((user, index) => {
					const rowNumber = index + 2;
					const userId = user.userid || user.user_id || "";
					const name = user.name || user.name || "";

					if (!userId || !name) {
						invalidUsers.push({
							row: rowNumber,
							userId: userId || "N/A",
							reason: `Missing required fields: ${[
								!userId && "ID",
								!name && "Name",
							]
								.filter(Boolean)
								.join(", ")}`,
						});
					} else {
						validUsers.push({
							userId: userId,
							name: name,
						});
					}
				});

				if (validUsers.length === 0) {
					allResults.push({
						tribeName,
						success: [],
						failed: [
							...invalidUsers,
							{
								reason:
									"No valid users found. All users are missing required fields.",
							},
						],
						total: invalidUsers.length,
					});
					continue;
				}

				// Process each valid user to update their tribe
				const results = {
					tribeName,
					success: [],
					failed: [],
					total: validUsers.length,
				};

				for (const user of validUsers) {
					try {
						const response = await updateUserTribe(
							user.userId,
							parseInt(tribeId)
						);

						if (response?.success) {
							results.success.push({
								row: validUsers.indexOf(user) + 2,
								userId: user.userId,
								name: user.name,
								tribe: tribeName,
							});
						} else {
							results.failed.push({
								row: validUsers.indexOf(user) + 2,
								userId: user.userId,
								reason: response?.message || "Failed to update tribe",
							});
						}
					} catch (error) {
						results.failed.push({
							row: validUsers.indexOf(user) + 2,
							userId: user.userId,
							reason: `Error: ${error.message}`,
						});
					}
				}

				// Combine with validation errors
				results.failed = [...invalidUsers, ...results.failed];
				results.total = results.total + invalidUsers.length;

				allResults.push(results);
			}

			setImportResults({ allResults, totalTribes: tribeQueue.length });
			if (onImportComplete) {
				onImportComplete();
			}
		} catch (error) {
			console.error("Import error:", error);
			alert("Import failed. Please check the file format and try again.");
		} finally {
			setImporting(false);
		}
	}

	function resetForm() {
		setCurrentFile(null);
		setCurrentTribeId("");
		setPreviewData([]);
		setErrors([]);
		setImportResults(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function downloadTemplate() {
		const template =
			"userId,name\n02-2021-00100,John,Doe\n02-2021-00101,Jane,Smith\n02-1819-01500,Ralph,Gallegos";
		const blob = new Blob([template], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "tribe_update_template.csv";
		a.click();
		window.URL.revokeObjectURL(url);
	}

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center p-1 backdrop-blur-sm bg-black/50">
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[98vh] overflow-hidden">
				{/* Header */}
				<div className="flex-shrink-0 p-6 text-white bg-gradient-to-r from-green-800 to-green-800">
					<div className="flex justify-between items-center">
						<div className="flex gap-3 items-center">
							<div className="p-2 rounded-lg bg-white/10">
								<Users className="w-6 h-6" />
							</div>
							<div>
								<h2 className="text-xl font-bold">Batch Update User Tribes</h2>
								<p className="text-green-100">
									Import Excel/CSV files to update multiple user tribe
									assignments
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
				</div>

				{/* Content */}
				<div
					className="overflow-y-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
					style={{ maxHeight: "calc(98vh - 120px)" }}
				>
					{!importResults ? (
						<div className="pb-6 space-y-6">
							{/* Info Box */}
							<div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
								<div className="flex gap-3 items-start">
									<Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
									<div className="space-y-2">
										<h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
											How it works
										</h4>
										<ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
											<li>
												• Select a tribe and upload an Excel/CSV file with user
												IDs, and names
											</li>
											<li>
												• Click "Add to Queue" to add this tribe + file
												combination
											</li>
											<li>
												• Repeat for additional tribes and files as needed
											</li>
											<li>
												• Click "Process All Tribes" to update all users in one
												batch
											</li>
											<li>• Users not found will be reported in the results</li>
										</ul>
									</div>
								</div>
							</div>

							{/* Current Tribe Selection */}
							<div className="space-y-3">
								<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
									<UserCog className="w-4 h-4 text-green-600 dark:text-green-400" />
									Select Tribe for Current File
								</label>
								<select
									value={currentTribeId}
									onChange={(e) => setCurrentTribeId(e.target.value)}
									className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value="">Choose a tribe...</option>
									{tribes?.map((tribe) => (
										<option key={tribe.tribe_id} value={tribe.tribe_id}>
											{tribe.tribe_name}
										</option>
									))}
								</select>
							</div>

							{/* File Upload */}
							<div className="space-y-3">
								<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
									<Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
									Select Excel/CSV File *
								</label>
								<div className="p-6 text-center rounded-lg border-2 border-gray-300 border-dashed transition-colors dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500">
									<input
										ref={fileInputRef}
										type="file"
										accept=".xlsx,.xls,.csv"
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
												Click to select file
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Supports .xlsx, .xls, and .csv files
											</p>
										</div>
									</button>
								</div>
							</div>

							{/* Template Download */}
							<div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
								<div className="flex gap-3 items-center justify-between">
									<div className="flex gap-2 items-center">
										<FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
										<div>
											<p className="text-sm font-medium text-green-800 dark:text-green-200">
												Download Template
											</p>
											<p className="text-xs text-green-700 dark:text-green-300">
												Use this template for each tribe's Excel file
											</p>
										</div>
									</div>
									<button
										onClick={downloadTemplate}
										className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50"
									>
										Download
									</button>
								</div>
							</div>

							{/* File Preview */}
							{currentFile && (
								<div className="space-y-3">
									<div className="flex gap-2 items-center">
										<FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
										<span className="text-sm font-semibold text-gray-900 dark:text-white">
											File Preview ({currentFile.name})
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

							{/* Add to Queue Button */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={addToQueue}
									disabled={!currentFile || !currentTribeId}
									className="flex gap-2 items-center px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Users className="w-4 h-4" />
									Add to Queue
								</button>
								<button
									onClick={resetForm}
									className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Reset
								</button>
							</div>

							{/* Current Queue */}
							{tribeQueue.length > 0 && (
								<div className="space-y-3">
									<div className="flex gap-2 items-center justify-between">
										<h4 className="text-sm font-semibold text-gray-900 dark:text-white">
											Tribe Queue ({tribeQueue.length} items)
										</h4>
										<button
											onClick={clearQueue}
											className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
										>
											Clear All
										</button>
									</div>
									<div className="space-y-2">
										{tribeQueue.map((item) => (
											<div
												key={item.id}
												className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
											>
												<div className="flex-1">
													<div className="flex gap-2 items-center">
														<span className="text-sm font-medium text-gray-900 dark:text-white">
															{item.tribeName}
														</span>
														<span className="text-xs text-gray-500 dark:text-gray-400">
															({item.fileName})
														</span>
													</div>
													<div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
														{item.previewData.length} records previewed
													</div>
												</div>
												<button
													onClick={() => removeFromQueue(item.id)}
													className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Process Queue Button */}
							{tribeQueue.length > 0 && (
								<div className="pt-4">
									<button
										onClick={handleImport}
										disabled={importing}
										className="flex gap-2 items-center w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-600 rounded-lg hover:from-green-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{importing ? (
											<>
												<RefreshCw className="w-4 h-4 animate-spin" />
												Processing {tribeQueue.length} Tribe
												{tribeQueue.length !== 1 ? "s" : ""}...
											</>
										) : (
											<>
												<Upload className="w-4 h-4" />
												Process All Tribes ({tribeQueue.length})
											</>
										)}
									</button>
								</div>
							)}
						</div>
					) : (
						/* Results View */
						<div className="pb-6 space-y-6">
							{/* Summary */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
									<div className="flex gap-3 items-center">
										<CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
										<div>
											<p className="text-2xl font-bold text-green-800 dark:text-green-200">
												{importResults?.allResults?.reduce(
													(sum, result) => sum + (result.success?.length || 0),
													0
												) || 0}
											</p>
											<p className="text-sm text-green-700 dark:text-green-300">
												Total Successfully Updated
											</p>
										</div>
									</div>
								</div>
								<div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
									<div className="flex gap-3 items-center">
										<XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
										<div>
											<p className="text-2xl font-bold text-red-800 dark:text-red-200">
												{importResults?.allResults?.reduce(
													(sum, result) => sum + (result.failed?.length || 0),
													0
												) || 0}
											</p>
											<p className="text-sm text-red-700 dark:text-red-300">
												Total Failed to Update
											</p>
										</div>
									</div>
								</div>
								<div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
									<div className="flex gap-3 items-center">
										<Users className="w-8 h-8 text-green-600 dark:text-green-400" />
										<div>
											<p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
												{importResults?.totalTribes || 0}
											</p>
											<p className="text-sm text-blue-700 dark:text-blue-300">
												Tribes Processed
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Results by Tribe */}
							{importResults?.allResults &&
								importResults.allResults.map((tribeResult, tribeIndex) => (
									<div key={tribeIndex} className="space-y-3">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
											{tribeResult.tribeName} - Results
										</h3>

										{/* Tribe Summary */}
										<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
											<div className="p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
												<div className="text-center">
													<p className="text-xl font-bold text-green-800 dark:text-green-200">
														{tribeResult.success?.length || 0}
													</p>
													<p className="text-xs text-green-700 dark:text-green-300">
														Success
													</p>
												</div>
											</div>
											<div className="p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
												<div className="text-center">
													<p className="text-xl font-bold text-red-800 dark:text-red-200">
														{tribeResult.failed?.length || 0}
													</p>
													<p className="text-xs text-red-700 dark:text-red-300">
														Failed
													</p>
												</div>
											</div>
											<div className="p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
												<div className="text-center">
													<p className="text-xl font-bold text-blue-800 dark:text-blue-200">
														{tribeResult.total || 0}
													</p>
													<p className="text-xs text-blue-700 dark:text-blue-300">
														Total
													</p>
												</div>
											</div>
										</div>

										{/* Successfully Updated */}
										{tribeResult.success && tribeResult.success.length > 0 && (
											<div className="space-y-2">
												<h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
													Successfully Updated Users
												</h4>
												<div className="overflow-x-auto p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
													<table className="w-full text-xs">
														<thead>
															<tr className="border-b border-green-200 dark:border-green-800">
																<th className="p-2 font-medium text-left text-green-800 dark:text-green-200">
																	Row
																</th>
																<th className="p-2 font-medium text-left text-green-800 dark:text-green-200">
																	User ID
																</th>
																<th className="p-2 font-medium text-left text-green-800 dark:text-green-200">
																	Name
																</th>
															</tr>
														</thead>
														<tbody>
															{tribeResult.success.map((user, index) => (
																<tr
																	key={index}
																	className="border-b border-green-100 dark:border-green-800"
																>
																	<td className="p-2 text-green-700 dark:text-green-300">
																		{user.row}
																	</td>
																	<td className="p-2 text-green-700 dark:text-green-300">
																		{user.userId}
																	</td>
																	<td className="p-2 text-green-700 dark:text-green-300">
																		{user.name}
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>
										)}

										{/* Failed Updates */}
										{tribeResult.failed && tribeResult.failed.length > 0 && (
											<div className="space-y-2">
												<h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
													Failed to Update Users
												</h4>
												<div className="overflow-x-auto p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
													<table className="w-full text-xs">
														<thead>
															<tr className="border-b border-red-200 dark:border-red-800">
																<th className="p-2 font-medium text-left text-red-800 dark:text-red-200">
																	Row
																</th>
																<th className="p-2 font-medium text-left text-red-800 dark:text-red-200">
																	User ID
																</th>
																<th className="p-2 font-medium text-left text-red-800 dark:text-red-200">
																	Reason
																</th>
															</tr>
														</thead>
														<tbody>
															{tribeResult.failed.map((user, index) => (
																<tr
																	key={index}
																	className="border-b border-red-100 dark:border-red-800"
																>
																	<td className="p-2 text-red-700 dark:text-red-300">
																		{user.row || "N/A"}
																	</td>
																	<td className="p-2 text-red-700 dark:text-red-300">
																		{user.userId || "N/A"}
																	</td>
																	<td className="p-2 text-red-700 dark:text-red-300">
																		{user.reason}
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>
										)}
									</div>
								))}

							{/* Action Buttons */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={resetForm}
									className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Import More Tribes
								</button>
								<button
									onClick={onClose}
									className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700"
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
