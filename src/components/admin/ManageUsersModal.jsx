import React, { useEffect, useMemo, useState } from "react";
import {
	X,
	Plus,
	RefreshCw,
	Shield,
	UserCog,
	Users,
	Info,
	CheckCircle2,
	Menu,
	FileSpreadsheet,
} from "lucide-react";
import {
	addUser,
	getUsers,
	updateUser,
	getYearLevels,
	getTribes,
	updateUserTribe,
} from "../../utils/admin";
import UserList from "./UserList";
import ExcelImportModal from "./ExcelImportModal";
import { Select } from "../ui/select";
import toast, { Toaster } from "react-hot-toast";

export default function ManageUsersModal({ isOpen, onClose }) {
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [users, setUsers] = useState([]);
	const [yearLevels, setYearLevels] = useState([]);
	const [tribes, setTribes] = useState([]);
	const [search, setSearch] = useState("");
	// Removed showAddForm state - form will always be visible
	const [form, setForm] = useState({
		role: "Faculty",
		isSbo: false,
		userId: "",
		name: "",
		email: "",
		yearLevelId: "",
		tribeId: "",
	});
	const [editingUserId, setEditingUserId] = useState(null);
	const [editDrafts, setEditDrafts] = useState({});
	const [activeTab, setActiveTab] = useState("users"); // 'users' or 'create'
	const [showImportModal, setShowImportModal] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		fetchUsers();
		fetchYearLevels();
		fetchTribes();
	}, [isOpen]);

	async function fetchUsers() {
		try {
			setLoading(true);
			const res = await getUsers();
			if (res?.success) {
				setUsers(res.users || []);
			}
		} catch (e) {
			console.error("getUsers error", e);
		} finally {
			setLoading(false);
		}
	}

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

	async function fetchTribes() {
		try {
			const res = await getTribes();
			if (res?.success) {
				setTribes(res.tribes || []);
			}
		} catch (e) {
			console.error("getTribes error", e);
		}
	}

	function handleFormChange(field, value) {
		setForm((prev) => {
			const newForm = { ...prev, [field]: value };

			// Reset tribeId when role changes to Admin (Admin users don't need a tribe)
			if (field === "role" && value === "Admin") {
				newForm.tribeId = "";
			}

			// Reset yearLevelId when role changes to Faculty or Admin (they don't need year level)
			if (field === "role" && (value === "Faculty" || value === "Admin")) {
				newForm.yearLevelId = "";
				newForm.isSbo = false;
			}

			return newForm;
		});
	}

	async function handleAddUser(e) {
		e?.preventDefault?.();
		if (!form.userId || !form.name || !form.email) return;

		// Check if year level is required for Students and SBO Officers
		if ((form.role === "Student" || form.isSbo) && !form.yearLevelId) {
			toast.error("Year level is required for Students and SBO Officers");
			return;
		}

		try {
			setSaving(true);
			const payload = {
				userId: form.userId.trim(),
				name: form.name.trim(),
				email: form.email.trim(),
				role: form.role,
				isSbo: form.role === "Student" && form.isSbo ? 1 : 0,
				yearLevelId: form.yearLevelId ? parseInt(form.yearLevelId) : null,
				tribeId: form.tribeId ? parseInt(form.tribeId) : null,
			};
			const res = await addUser(payload);
			if (res?.success) {
				await fetchUsers();
				setForm({
					role: "Faculty",
					isSbo: false,
					userId: "",
					name: "",
					email: "",
					yearLevelId: "",
					tribeId: "",
				});
			} else {
				toast.error(res?.message || "Failed to add user");
			}
		} catch (e) {
			console.error("addUser error", e);
			toast.error("Failed to add user");
		} finally {
			setSaving(false);
		}
	}

	function startEdit(user) {
		setEditingUserId(user.user_id);
		setEditDrafts({
			userId: user.user_id,
			newUserId: user.user_id, // Allow editing user ID
			name: user.user_name,
			email: user.user_email,
			role: user.userLevel, // text label
			isSbo: user.user_userlevelId === 2,
			yearLevelId: user.user_yearLevelId || "",
			tribeId: user.user_tribeId || "",
			resetPassword: false,
		});
	}

	function updateDraft(field, value) {
		setEditDrafts((prev) => ({ ...prev, [field]: value }));
	}

	async function saveEdit() {
		if (!editDrafts?.userId) return;
		try {
			setSaving(true);
			const payload = {
				currentUserId: editDrafts.userId,
				newUserId: editDrafts.newUserId,
				name: editDrafts.name,
				email: editDrafts.email,
				role: editDrafts.role === "SBO Officer" ? "Student" : editDrafts.role,
				isSbo:
					editDrafts.role === "SBO Officer"
						? 1
						: editDrafts.role === "Student" && editDrafts.isSbo
						? 1
						: 0,
				yearLevelId: editDrafts.yearLevelId
					? parseInt(editDrafts.yearLevelId)
					: null,
				tribeId: editDrafts.tribeId ? parseInt(editDrafts.tribeId) : null,
				resetPassword: !!editDrafts.resetPassword,
			};
			const res = await updateUser(payload);
			if (res?.success) {
				await fetchUsers();
				setEditingUserId(null);
				setEditDrafts({});
				toast.success(res?.message || "User updated successfully");
			} else {
				toast.error(res?.message || "Failed to update user");
			}
		} catch (e) {
			console.error("updateUser error", e);
			toast.error("Failed to update user");
		} finally {
			setSaving(false);
		}
	}

	const idLabel = useMemo(() => {
		if (form.role === "Faculty") return "Employee ID";
		if (form.role === "Student") return "School ID";
		return "Admin ID";
	}, [form.role]);

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
				<div className="flex overflow-hidden relative flex-col w-full h-full min-h-0 bg-white dark:bg-gray-900">
					{/* Compact Header */}
					<div className="flex-shrink-0 text-white bg-gradient-to-r from-emerald-800 via-green-800 to-teal-800 shadow-lg">
						<div className="px-3 py-2.5 md:px-5 md:py-3">
							<div className="flex justify-between items-center">
								<div className="flex gap-2 items-center">
									<div className="p-1.5 rounded-md backdrop-blur-sm bg-white/10">
										<UserCog className="w-4 h-4 text-white" />
									</div>
									<div>
										<h1 className="text-base font-bold text-white md:text-lg">
											User Management
										</h1>
										<p className="text-xs text-white/80">
											Manage system users and permissions
										</p>
									</div>
								</div>
								<div className="flex gap-2 items-center">
									{/* Stats - Compact */}
									<div className="hidden gap-3 items-center mr-3 sm:flex">
										<div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
											<Users className="w-3 h-3 text-emerald-200" />
											<span className="text-xs font-medium text-white">
												{users.length}
											</span>
										</div>
										<div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
											<Shield className="w-3 h-3 text-red-300" />
											<span className="text-xs font-medium text-white">
												{users.filter((u) => u.userLevel === "Admin").length}
											</span>
										</div>
										<div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
											<UserCog className="w-3 h-3 text-blue-300" />
											<span className="text-xs font-medium text-white">
												{users.filter((u) => u.userLevel === "Faculty").length}
											</span>
										</div>
										<div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
											<Users className="w-3 h-3 text-green-300" />
											<span className="text-xs font-medium text-white">
												{
													users.filter(
														(u) =>
															u.userLevel === "Student" ||
															u.userLevel === "SBO Officer"
													).length
												}
											</span>
										</div>
									</div>

									{/* Mobile Tab Toggle */}
									<div className="md:hidden">
										<button
											onClick={() =>
												setActiveTab(activeTab === "users" ? "create" : "users")
											}
											className="p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/10"
											title="Toggle view"
										>
											<Menu className="w-4 h-4" />
										</button>
									</div>
									<button
										onClick={fetchUsers}
										disabled={loading}
										className="p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50"
										title="Refresh users"
									>
										<RefreshCw
											className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
										/>
									</button>
									<button
										onClick={() => setShowImportModal(true)}
										className="p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/10"
										title="Import from Excel"
									>
										<FileSpreadsheet className="w-4 h-4" />
									</button>
									<button
										onClick={onClose}
										className="p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/10"
										title="Close"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Mobile Tab Navigation */}
							<div className="mt-2 md:hidden">
								<div className="flex p-1 rounded-md bg-white/10">
									<button
										onClick={() => setActiveTab("users")}
										className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
											activeTab === "users"
												? "bg-white text-emerald-800"
												: "text-white/80 hover:text-white"
										}`}
									>
										View Users
									</button>
									<button
										onClick={() => setActiveTab("create")}
										className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
											activeTab === "create"
												? "bg-white text-emerald-800"
												: "text-white/80 hover:text-white"
										}`}
									>
										Create User
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="overflow-hidden flex-1 px-6 min-h-0 bg-gray-50 dark:bg-gray-900/50">
						{/* Desktop Layout */}
						<div className="hidden h-full md:flex">
							{/* Left Panel - Create User Form */}
							<div className="w-80 xl:w-[420px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
								{/* Scrollable Form Content */}
								<div className="overflow-y-auto flex-1 p-4 min-h-0">
									<form onSubmit={handleAddUser} className="space-y-4">
										{/* Role Selection Section */}
										<div className="space-y-2">
											<div className="flex gap-2 items-center">
												<UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
												<label className="block text-sm font-semibold text-gray-900 dark:text-white">
													User Role *
												</label>
											</div>
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
												<button
													type="button"
													onClick={() => handleFormChange("role", "Admin")}
													className={`p-3 rounded-lg border-2 transition-all duration-200 ${
														form.role === "Admin"
															? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md"
															: "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 hover:shadow-sm"
													}`}
												>
													<div className="flex flex-col gap-1.5 items-center">
														<Shield
															className={`w-5 h-5 ${
																form.role === "Admin"
																	? "text-red-600 dark:text-red-400"
																	: "text-gray-400"
															}`}
														/>
														<span
															className={`text-xs font-medium ${
																form.role === "Admin"
																	? "text-red-700 dark:text-red-300"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														>
															Administrator
														</span>
													</div>
												</button>

												<button
													type="button"
													onClick={() => handleFormChange("role", "Faculty")}
													className={`p-4 rounded-xl border-2 transition-all duration-200 ${
														form.role === "Faculty"
															? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
															: "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 hover:shadow-sm"
													}`}
												>
													<div className="flex flex-col gap-2 items-center">
														<UserCog
															className={`w-6 h-6 ${
																form.role === "Faculty"
																	? "text-blue-600 dark:text-blue-400"
																	: "text-gray-400"
															}`}
														/>
														<span
															className={`text-sm font-medium ${
																form.role === "Faculty"
																	? "text-blue-700 dark:text-blue-300"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														>
															Faculty Member
														</span>
													</div>
												</button>

												<button
													type="button"
													onClick={() => handleFormChange("role", "Student")}
													className={`p-4 rounded-xl border-2 transition-all duration-200 ${
														form.role === "Student"
															? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
															: "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 hover:shadow-sm"
													}`}
												>
													<div className="flex flex-col gap-2 items-center">
														<Users
															className={`w-6 h-6 ${
																form.role === "Student"
																	? "text-green-600 dark:text-green-400"
																	: "text-gray-400"
															}`}
														/>
														<span
															className={`text-sm font-medium ${
																form.role === "Student"
																	? "text-green-700 dark:text-green-300"
																	: "text-gray-600 dark:text-gray-400"
															}`}
														>
															Student
														</span>
													</div>
												</button>
											</div>
										</div>

										{/* SBO Officer Checkbox */}
										{form.role === "Student" && (
											<div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800">
												<div className="flex items-center space-x-3">
													<div className="flex items-center">
														<input
															type="checkbox"
															id="sbo-checkbox"
															className="w-5 h-5 text-amber-600 bg-white rounded-lg border-2 border-amber-300 transition-all focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 dark:bg-gray-700 dark:border-amber-600"
															checked={form.isSbo}
															onChange={(e) =>
																handleFormChange("isSbo", e.target.checked)
															}
														/>
													</div>
													<div className="flex-1">
														<label
															htmlFor="sbo-checkbox"
															className="text-sm font-semibold text-amber-800 cursor-pointer dark:text-amber-200"
														>
															Assign as SBO Officer
														</label>
														<p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
															This student will have SBO Officer privileges
														</p>
													</div>
													<div className="flex-shrink-0">
														<Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
													</div>
												</div>
											</div>
										)}

										{/* Year Level Selection */}
										{(form.role === "Student" || form.isSbo) && (
											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
													Year Level *
												</label>
												<Select
													value={form.yearLevelId}
													onValueChange={(value) =>
														handleFormChange("yearLevelId", value)
													}
													options={yearLevels.map((level) => ({
														value: level.yearL_id,
														label: level.yearL_name,
													}))}
													placeholder="Select Year Level"
													searchPlaceholder="Search year levels..."
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border-2 border-gray-200 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-500"
												/>
											</div>
										)}

										{/* Tribe Selection */}
										{(form.role === "Faculty" || form.role === "Student") && (
											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
													Tribe
												</label>
												<Select
													value={form.tribeId}
													onValueChange={(value) =>
														handleFormChange("tribeId", value)
													}
													options={tribes.map((tribe) => ({
														value: tribe.tribe_id,
														label: tribe.tribe_name,
													}))}
													placeholder="Select Tribe"
													searchPlaceholder="Search tribes..."
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border-2 border-gray-200 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-500"
												/>
											</div>
										)}

										{/* Personal Information Section */}
										<div className="space-y-4">
											<div className="flex gap-2 items-center pb-2 border-b border-gray-200 dark:border-gray-700">
												<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
												<h4 className="text-sm font-semibold text-gray-900 dark:text-white">
													Personal Information
												</h4>
											</div>

											{/* User ID */}
											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Info className="w-4 h-4 text-gray-500" />
													{idLabel} *
												</label>
												<div className="relative">
													<input
														type="text"
														className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border-2 border-gray-200 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-500"
														value={form.userId}
														onChange={(e) =>
															handleFormChange("userId", e.target.value)
														}
														placeholder={`Enter ${idLabel.toLowerCase()}`}
														required
													/>
												</div>
											</div>

											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Users className="w-4 h-4 text-gray-500" />
													Name *
												</label>
												<input
													type="text"
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border-2 border-gray-200 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-500"
													value={form.name}
													onChange={(e) =>
														handleFormChange("name", e.target.value)
													}
													placeholder="Enter name"
													required
												/>
											</div>

											{/* Email */}
											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Info className="w-4 h-4 text-gray-500" />
													Email Address *
												</label>
												<input
													type="email"
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border-2 border-gray-200 transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-300 dark:hover:border-gray-500"
													value={form.email}
													onChange={(e) =>
														handleFormChange("email", e.target.value)
													}
													placeholder="user@example.com"
													required
												/>
											</div>
										</div>

										{/* Security Information */}
										<div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
											<div className="flex items-start space-x-3">
												<div className="p-2 bg-blue-100 rounded-xl dark:bg-blue-900/30">
													<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
												</div>
												<div className="flex-1">
													<h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
														Security & Access
													</h4>
													<p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
														The user's <strong>last name</strong> will be set as
														the default password. They can change it after first
														login.
													</p>
													<div className="flex gap-2 items-center mt-2">
														<CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
														<span className="text-xs font-medium text-green-700 dark:text-green-300">
															Secure password policy enabled
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between sm:items-center">
											<div className="flex gap-3">
												<button
													type="button"
													onClick={() => {
														setForm({
															role: "Faculty",
															isSbo: false,
															userId: "",
															name: "",
															email: "",
															yearLevelId: "",
															tribeId: "",
														});
													}}
													className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
												>
													Reset Form
												</button>
												<button
													type="submit"
													disabled={
														saving ||
														!form.userId ||
														!form.name ||
														!form.email ||
														((form.role === "Student" || form.isSbo) &&
															!form.yearLevelId)
													}
													className="inline-flex gap-2 justify-center items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl transition-all duration-200 hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
												>
													{saving ? (
														<>
															<RefreshCw className="w-4 h-4 animate-spin" />
															Creating User...
														</>
													) : (
														<>
															<Plus className="w-4 h-4" />
															Create User
														</>
													)}
												</button>
											</div>
										</div>
									</form>
								</div>
							</div>

							{/* Right Panel - User List */}
							<div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800">
								{/* User List */}
								<div className="flex-1 min-h-0">
									<UserList
										users={users}
										loading={loading}
										search={search}
										setSearch={setSearch}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={startEdit}
										onUpdateDraft={updateDraft}
										onSave={saveEdit}
										saving={saving}
										fetchUsers={fetchUsers}
										yearLevels={yearLevels}
										tribes={tribes}
										updateUserTribe={updateUserTribe}
									/>
								</div>
							</div>
						</div>

						{/* Mobile Layout */}
						<div className="flex flex-col h-full min-h-0 md:hidden">
							{activeTab === "create" ? (
								/* Mobile Create User Form */
								<div className="flex flex-col flex-1 bg-white dark:bg-gray-800">
									<div className="flex-shrink-0 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-800">
										<div className="flex gap-3 items-center">
											<div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900/30">
												<Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
											</div>
											<div>
												<h2 className="text-lg font-bold text-gray-900 dark:text-white">
													Create New User
												</h2>
												<p className="text-sm text-gray-600 dark:text-gray-400">
													Add a new user to the system
												</p>
											</div>
										</div>
									</div>
									<div className="overflow-y-auto flex-1 p-4 min-h-0">
										<form onSubmit={handleAddUser} className="space-y-6">
											{/* Role Selection */}
											<div className="space-y-3">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
													User Role *
												</label>
												<div className="grid grid-cols-2 gap-3">
													<button
														type="button"
														onClick={() => handleFormChange("role", "Admin")}
														className={`p-3 rounded-lg border-2 transition-all ${
															form.role === "Admin"
																? "border-red-500 bg-red-50 dark:bg-red-900/20"
																: "border-gray-200 dark:border-gray-600 hover:border-gray-300"
														}`}
													>
														<div className="flex flex-col gap-2 items-center">
															<Shield
																className={`w-5 h-5 ${
																	form.role === "Admin"
																		? "text-red-600 dark:text-red-400"
																		: "text-gray-400"
																}`}
															/>
															<span
																className={`text-sm font-medium ${
																	form.role === "Admin"
																		? "text-red-700 dark:text-red-300"
																		: "text-gray-600 dark:text-gray-400"
																}`}
															>
																Admin
															</span>
														</div>
													</button>
													<button
														type="button"
														onClick={() => handleFormChange("role", "Faculty")}
														className={`p-3 rounded-lg border-2 transition-all ${
															form.role === "Faculty"
																? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
																: "border-gray-200 dark:border-gray-600 hover:border-gray-300"
														}`}
													>
														<div className="flex flex-col gap-2 items-center">
															<UserCog
																className={`w-5 h-5 ${
																	form.role === "Faculty"
																		? "text-blue-600 dark:text-blue-400"
																		: "text-gray-400"
																}`}
															/>
															<span
																className={`text-sm font-medium ${
																	form.role === "Faculty"
																		? "text-blue-700 dark:text-blue-300"
																		: "text-gray-600 dark:text-gray-400"
																}`}
															>
																Faculty
															</span>
														</div>
													</button>
													<button
														type="button"
														onClick={() => handleFormChange("role", "Student")}
														className={`p-3 rounded-lg border-2 transition-all col-span-2 ${
															form.role === "Student"
																? "border-green-500 bg-green-50 dark:bg-green-900/20"
																: "border-gray-200 dark:border-gray-600 hover:border-gray-300"
														}`}
													>
														<div className="flex gap-2 justify-center items-center">
															<Users
																className={`w-5 h-5 ${
																	form.role === "Student"
																		? "text-green-600 dark:text-green-400"
																		: "text-gray-400"
																}`}
															/>
															<span
																className={`text-sm font-medium ${
																	form.role === "Student"
																		? "text-green-700 dark:text-green-300"
																		: "text-gray-600 dark:text-gray-400"
																}`}
															>
																Student
															</span>
														</div>
													</button>
												</div>
											</div>

											{/* SBO Officer Checkbox */}
											{form.role === "Student" && (
												<div className="p-3 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
													<label className="flex gap-3 items-center">
														<input
															type="checkbox"
															className="w-4 h-4 text-amber-600 bg-white rounded border-2 border-amber-300 focus:ring-2 focus:ring-amber-500"
															checked={form.isSbo}
															onChange={(e) =>
																handleFormChange("isSbo", e.target.checked)
															}
														/>
														<div className="flex-1">
															<span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
																Assign as SBO Officer
															</span>
															<p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
																Grant SBO Officer privileges
															</p>
														</div>
													</label>
												</div>
											)}

											{/* Year Level Selection - Mobile */}
											{(form.role === "Student" || form.isSbo) && (
												<div className="space-y-2">
													<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
														<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
														Year Level *
													</label>
													<Select
														value={form.yearLevelId}
														onValueChange={(value) =>
															handleFormChange("yearLevelId", value)
														}
														options={yearLevels.map((level) => ({
															value: level.yearL_id,
															label: level.yearL_name,
														}))}
														placeholder="Select Year Level"
														searchPlaceholder="Search year levels..."
														className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
													/>
												</div>
											)}

											{/* Tribe Selection - Mobile */}
											{(form.role === "Faculty" || form.role === "Student") && (
												<div className="space-y-2">
													<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
														<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
														Tribe *
													</label>
													<Select
														value={form.tribeId}
														onValueChange={(value) =>
															handleFormChange("tribeId", value)
														}
														options={tribes.map((tribe) => ({
															value: tribe.tribe_id,
															label: tribe.tribe_name,
														}))}
														placeholder="Select Tribe"
														searchPlaceholder="Search tribes..."
														className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
													/>
												</div>
											)}

											{/* User ID */}
											<div className="space-y-2">
												<label className="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-white">
													<Info className="w-4 h-4 text-gray-500" />
													{idLabel} *
												</label>
												<input
													type="text"
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
													value={form.userId}
													onChange={(e) =>
														handleFormChange("userId", e.target.value)
													}
													placeholder={`Enter ${idLabel.toLowerCase()}`}
													required
												/>
											</div>

											{/* Name Fields */}
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<label className="text-sm font-semibold text-gray-900 dark:text-white">
														Name *
													</label>
													<input
														type="text"
														className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
														value={form.name}
														onChange={(e) =>
															handleFormChange("name", e.target.value)
														}
														placeholder="Enter first name"
														required
													/>
												</div>
											</div>

											{/* Email */}
											<div className="space-y-2">
												<label className="text-sm font-semibold text-gray-900 dark:text-white">
													Email Address *
												</label>
												<input
													type="email"
													className="px-4 py-3 w-full text-gray-900 bg-white rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
													value={form.email}
													onChange={(e) =>
														handleFormChange("email", e.target.value)
													}
													placeholder="user@example.com"
													required
												/>
											</div>

											{/* Security Info */}
											<div className="p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
												<div className="flex gap-3 items-start">
													<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
													<div>
														<h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
															Security Info
														</h4>
														<p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
															Default password will be set to the user's last
															name.
														</p>
													</div>
												</div>
											</div>

											{/* Action Buttons */}
											<div className="flex gap-3 pt-4">
												<button
													type="button"
													onClick={() => {
														setForm({
															role: "Faculty",
															isSbo: false,
															userId: "",
															name: "",
															email: "",
															yearLevelId: "",
															tribeId: "",
														});
													}}
													className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
												>
													Reset
												</button>
												<button
													type="submit"
													disabled={
														saving ||
														!form.userId ||
														!form.name ||
														!form.email ||
														((form.role === "Faculty" ||
															form.role === "Student") &&
															!form.tribeId) ||
														((form.role === "Student" || form.isSbo) &&
															!form.yearLevelId)
													}
													className="flex flex-1 gap-2 justify-center items-center py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{saving ? (
														<>
															<RefreshCw className="w-4 h-4 animate-spin" />
															Creating...
														</>
													) : (
														<>
															<Plus className="w-4 h-4" />
															Create User
														</>
													)}
												</button>
											</div>
										</form>
									</div>
								</div>
							) : (
								/* Mobile User List */
								<div className="overflow-hidden flex-1 bg-white dark:bg-gray-800">
									<UserList
										users={users}
										loading={loading}
										search={search}
										setSearch={setSearch}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={startEdit}
										onUpdateDraft={updateDraft}
										onSave={saveEdit}
										saving={saving}
										fetchUsers={fetchUsers}
										yearLevels={yearLevels}
										tribes={tribes}
										updateUserTribe={updateUserTribe}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Excel Import Modal */}
				<ExcelImportModal
					isOpen={showImportModal}
					onClose={() => setShowImportModal(false)}
					onImportComplete={fetchUsers}
				/>
			</div>
		</>
	);
}
