import React from "react";
import {
	Search,
	RefreshCw,
	Shield,
	GraduationCap,
	Users,
	X,
	ChevronDown,
	ChevronUp,
	AlertCircle,
	FileSpreadsheet,
} from "lucide-react";
import TribeImportModal from "./TribeImportModal";
import UserCard from "./UserCard";
import { resetUsersTribe } from "../../utils/admin";

export default function UserList({
	users,
	loading,
	search,
	setSearch,
	editingUserId,
	editDrafts,
	onStartEdit,
	onUpdateDraft,
	onSave,
	saving,
	fetchUsers,
	yearLevels,
	tribes,
	updateUserTribe,
}) {
	// Filter states
	const [yearLevelFilter, setYearLevelFilter] = React.useState("");
	const [tribeFilter, setTribeFilter] = React.useState("");
	const [showMobileFilters, setShowMobileFilters] = React.useState(false);

	// Dropdown states
	const [showYearLevelDropdown, setShowYearLevelDropdown] =
		React.useState(false);
	const [showTribeDropdown, setShowTribeDropdown] = React.useState(false);
	const [yearLevelSearch, setYearLevelSearch] = React.useState("");
	const [tribeSearch, setTribeSearch] = React.useState("");

	// Pagination states
	const [currentPage, setCurrentPage] = React.useState(1);
	const [itemsPerPage, setItemsPerPage] = React.useState(10);

	const filteredUsers = React.useMemo(() => {
		let filteredList = users;

		// Apply year level filter
		if (yearLevelFilter) {
			filteredList = filteredList.filter(
				(u) =>
					u.user_yearLevelId &&
					u.user_yearLevelId.toString() === yearLevelFilter
			);
		}

		// Apply tribe filter
		if (tribeFilter) {
			filteredList = filteredList.filter(
				(u) => u.user_tribeId && u.user_tribeId.toString() === tribeFilter
			);
		}

		// Apply smart search filter - automatically detect search type
		if (search.trim()) {
			const term = search.trim().toLowerCase();
			filteredList = filteredList.filter((u) => {
				// Check if search term looks like an ID (contains numbers and possibly letters)
				const isLikelyId = /[0-9]/.test(term) && term.length >= 3;

				if (isLikelyId) {
					// Search primarily in ID field, but also check other fields
					return (
						u.user_id?.toLowerCase().includes(term) ||
						u.user_name?.toLowerCase().includes(term) ||
						u.user_email?.toLowerCase().includes(term)
					);
				} else {
					// Search primarily in name fields, but also check other fields
					return (
						u.user_name?.toLowerCase().includes(term) ||
						u.user_id?.toLowerCase().includes(term) ||
						u.user_email?.toLowerCase().includes(term)
					);
				}
			});
		}

		// Group by user level
		const groups = {
			Faculty: [],
			"SBO Officer": [],
			Student: [],
			Admin: [],
		};
		for (const u of filteredList) {
			const label = u.userLevel;
			if (groups[label]) groups[label].push(u);
		}
		return groups;
	}, [users, search, yearLevelFilter, tribeFilter]);

	// Filter year levels based on search
	const filteredYearLevels = React.useMemo(() => {
		if (!yearLevelSearch) return yearLevels || [];
		return (yearLevels || []).filter((level) =>
			level.yearL_name.toLowerCase().includes(yearLevelSearch.toLowerCase())
		);
	}, [yearLevels, yearLevelSearch]);

	// Filter tribes based on search
	const filteredTribes = React.useMemo(() => {
		if (!tribeSearch) return tribes || [];
		return (tribes || []).filter((tribe) =>
			tribe.tribe_name.toLowerCase().includes(tribeSearch.toLowerCase())
		);
	}, [tribes, tribeSearch]);

	// Reset filters function
	const resetFilters = () => {
		setSearch("");
		setYearLevelFilter("");
		setTribeFilter("");
		setShowMobileFilters(false);
		setShowYearLevelDropdown(false);
		setShowTribeDropdown(false);
		setYearLevelSearch("");
		setTribeSearch("");
	};

	// Reset to first page when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [search, yearLevelFilter, tribeFilter]);

	// Close dropdowns when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest(".dropdown-container")) {
				setShowYearLevelDropdown(false);
				setShowTribeDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Pagination functions
	const getPaginatedUsers = (userList, page, perPage) => {
		const startIndex = (page - 1) * perPage;
		const endIndex = startIndex + perPage;
		return userList.slice(startIndex, endIndex);
	};

	const getTotalPages = (userList) => {
		return Math.ceil(userList.length / itemsPerPage);
	};

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	const handleItemsPerPageChange = (newPerPage) => {
		setItemsPerPage(newPerPage);
		setCurrentPage(1); // Reset to first page when changing items per page
	};

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Search Header */}
			<div className="flex-shrink-0 p-2 bg-white border-b border-gray-200 md:p-3 dark:bg-gray-800 dark:border-gray-700">
				<div className="space-y-3">
					{/* Desktop Filters Row */}
					<div className="hidden grid-cols-1 gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 relative">
						{/* Smart Search Input */}
						<div className="space-y-1">
							<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
								Search
							</label>
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
								<input
									type="text"
									className="py-1.5 pr-3 pl-9 w-full text-sm text-gray-900 bg-white rounded-md border border-gray-300 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
									placeholder="Search by name, ID, or email..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>

						{/* Year Level Filter */}
						<div className="space-y-1 relative dropdown-container">
							<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
								Year Level
							</label>
							<div className="relative">
								<button
									type="button"
									onClick={() => {
										setShowYearLevelDropdown(!showYearLevelDropdown);
										setShowTribeDropdown(false);
									}}
									className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<span
										className={
											yearLevelFilter
												? "text-gray-900 dark:text-white"
												: "text-gray-500 dark:text-gray-400"
										}
									>
										{yearLevelFilter
											? yearLevels?.find(
													(level) =>
														level.yearL_id.toString() === yearLevelFilter
											  )?.yearL_name
											: "All Year Levels"}
									</span>
									<ChevronDown
										className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
											showYearLevelDropdown ? "rotate-180" : ""
										}`}
									/>
								</button>

								{/* Year Level Dropdown */}
								{showYearLevelDropdown && (
									<div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600">
										{/* Search Input */}
										<div className="p-2 border-b border-gray-200 dark:border-gray-600">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
												<input
													type="text"
													placeholder="Search year levels..."
													value={yearLevelSearch}
													onChange={(e) => setYearLevelSearch(e.target.value)}
													className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
												/>
											</div>
										</div>

										{/* Options */}
										<div className="max-h-80 overflow-auto">
											<div
												onClick={() => {
													setYearLevelFilter("");
													setShowYearLevelDropdown(false);
													setYearLevelSearch("");
												}}
												className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
											>
												All Year Levels
											</div>
											{filteredYearLevels.map((level) => (
												<div
													key={level.yearL_id}
													onClick={() => {
														setYearLevelFilter(level.yearL_id.toString());
														setShowYearLevelDropdown(false);
														setYearLevelSearch("");
													}}
													className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white ${
														yearLevelFilter === level.yearL_id.toString()
															? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
															: ""
													}`}
												>
													{level.yearL_name}
												</div>
											))}
											{filteredYearLevels.length === 0 && yearLevelSearch && (
												<div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
													No year levels found
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Tribe Filter */}
						<div className="space-y-1 relative dropdown-container">
							<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
								Tribe
							</label>
							<div className="relative">
								<button
									type="button"
									onClick={() => {
										setShowTribeDropdown(!showTribeDropdown);
										setShowYearLevelDropdown(false);
									}}
									className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<span
										className={
											tribeFilter
												? "text-gray-900 dark:text-white"
												: "text-gray-500 dark:text-gray-400"
										}
									>
										{tribeFilter
											? tribes?.find(
													(tribe) => tribe.tribe_id.toString() === tribeFilter
											  )?.tribe_name
											: "All Tribes"}
									</span>
									<ChevronDown
										className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
											showTribeDropdown ? "rotate-180" : ""
										}`}
									/>
								</button>

								{/* Tribe Dropdown */}
								{showTribeDropdown && (
									<div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600">
										{/* Search Input */}
										<div className="p-2 border-b border-gray-200 dark:border-gray-600">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
												<input
													type="text"
													placeholder="Search tribes..."
													value={tribeSearch}
													onChange={(e) => setTribeSearch(e.target.value)}
													className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
												/>
											</div>
										</div>

										{/* Options */}
										<div className="max-h-60 overflow-auto">
											<div
												onClick={() => {
													setTribeFilter("");
													setShowTribeDropdown(false);
													setTribeSearch("");
												}}
												className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
											>
												All Tribes
											</div>
											{filteredTribes.map((tribe) => (
												<div
													key={tribe.tribe_id}
													onClick={() => {
														setTribeFilter(tribe.tribe_id.toString());
														setShowTribeDropdown(false);
														setTribeSearch("");
													}}
													className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white ${
														tribeFilter === tribe.tribe_id.toString()
															? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
															: ""
													}`}
												>
													{tribe.tribe_name}
												</div>
											))}
											{filteredTribes.length === 0 && tribeSearch && (
												<div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
													No tribes found
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Mobile Compact Filters */}
					<div className="block sm:hidden">
						<div className="flex gap-2 items-center">
							{/* Quick Search */}
							<div className="relative flex-1">
								<Search className="absolute left-2.5 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
								<input
									type="text"
									className="py-1 pr-3 pl-8 w-full text-xs text-gray-900 bg-white rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
									placeholder="Quick search..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>

							{/* Filter Toggle Button */}
							<button
								onClick={() => setShowMobileFilters(!showMobileFilters)}
								className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
							>
								Filters
							</button>
						</div>

						{/* Expandable Mobile Filters */}
						{showMobileFilters && (
							<div className="p-2 mt-1 bg-gray-50 rounded border dark:bg-gray-800 dark:border-gray-700">
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
											Year
										</label>
										<select
											value={yearLevelFilter}
											onChange={(e) => setYearLevelFilter(e.target.value)}
											className="px-2 py-0.5 mt-1 w-full text-xs text-gray-900 bg-white rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										>
											<option value="">All</option>
											{yearLevels?.map((level) => (
												<option key={level.yearL_id} value={level.yearL_id}>
													{level.yearL_name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
											Tribe
										</label>
										<select
											value={tribeFilter}
											onChange={(e) => setTribeFilter(e.target.value)}
											className="px-2 py-0.5 mt-1 w-full text-xs text-gray-900 bg-white rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										>
											<option value="">All</option>
											{tribes?.map((tribe) => (
												<option key={tribe.tribe_id} value={tribe.tribe_id}>
													{tribe.tribe_name}
												</option>
											))}
										</select>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Active Filters Display */}
					{(yearLevelFilter || tribeFilter || search) && (
						<div className="flex flex-wrap gap-1.5 items-center">
							<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
								Active Filters:
							</span>
							{yearLevelFilter && (
								<span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/20 dark:text-blue-300">
									Year:{" "}
									{
										yearLevels?.find(
											(l) => l.yearL_id.toString() === yearLevelFilter
										)?.yearL_name
									}
									<button
										onClick={() => setYearLevelFilter("")}
										className="ml-1 w-3 h-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
									>
										×
									</button>
								</span>
							)}
							{tribeFilter && (
								<span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900/20 dark:text-green-300">
									Tribe:{" "}
									{
										tribes?.find((t) => t.tribe_id.toString() === tribeFilter)
											?.tribe_name
									}
									<button
										onClick={() => setTribeFilter("")}
										className="ml-1 w-3 h-3 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
									>
										×
									</button>
								</span>
							)}
							{search && (
								<span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900/20 dark:text-purple-300">
									Search: "{search}"
									<button
										onClick={() => setSearch("")}
										className="ml-1 w-3 h-3 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
									>
										×
									</button>
								</span>
							)}
							{/* Reset Filters Button */}
							{(yearLevelFilter || tribeFilter || search) && (
								<button
									onClick={resetFilters}
									className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Clear Filters
								</button>
							)}
						</div>
					)}

					{/* Mobile Active Filters Summary */}
					<div className="block sm:hidden">
						{(yearLevelFilter || tribeFilter || search) && (
							<div className="flex gap-2 justify-between items-center p-1.5 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
								<div className="flex gap-1 items-center">
									<span className="text-xs font-medium text-blue-800 dark:text-blue-200">
										{[
											yearLevelFilter && "Year",
											tribeFilter && "Tribe",
											search && "Search",
										]
											.filter(Boolean)
											.join(", ")}{" "}
										active
									</span>
								</div>
								<button
									onClick={resetFilters}
									className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
								>
									Clear All
								</button>
							</div>
						)}
					</div>

					{/* Pagination Controls */}
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
						{/* Mobile Compact Layout - Items Per Page + Total on same line */}
						<div className="flex gap-3 items-center justify-between sm:justify-start">
							{/* Items Per Page Selector */}
							<div className="flex gap-2 items-center">
								<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
									Show:
								</label>
								<select
									value={itemsPerPage}
									onChange={(e) =>
										handleItemsPerPageChange(parseInt(e.target.value))
									}
									className="px-2 py-1 text-xs text-gray-900 bg-white rounded border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value={5}>5</option>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
								<span className="text-xs text-gray-600 dark:text-gray-400">
									per page
								</span>
							</div>

							{/* Total Results Info - Mobile Compact */}
							<div className="text-xs text-gray-600 dark:text-gray-400">
								Total:{" "}
								{Object.values(filteredUsers).reduce(
									(total, group) => total + group.length,
									0
								)}{" "}
								users
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Users List Content */}
			<div className="overflow-y-auto flex-1 px-2 min-h-0">
				<div className="p-2 md:p-3">
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-center">
								<RefreshCw className="mx-auto mb-3 w-6 h-6 text-emerald-600 animate-spin" />
								<p className="text-base font-medium text-gray-900 dark:text-white">
									Loading users...
								</p>
								<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Please wait while we fetch the user data
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Filtered Results Summary */}
							{(yearLevelFilter || tribeFilter || search) && (
								<div className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
									<div className="flex flex-wrap gap-2 justify-between items-center">
										<div className="flex flex-wrap gap-2 items-center">
											<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
												Filtered Results:
											</span>
											<span className="text-sm text-blue-700 dark:text-blue-300">
												{Object.values(filteredUsers).reduce(
													(total, group) => total + group.length,
													0
												)}{" "}
												users found
											</span>
										</div>
										<button
											onClick={resetFilters}
											className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
										>
											Clear All Filters
										</button>
									</div>
								</div>
							)}

							{Object.keys(filteredUsers).some(
								(key) => filteredUsers[key].length > 0
							) ? (
								<div className="space-y-4">
									<RoleGroup
										title="Student"
										icon={
											<GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
										}
										users={filteredUsers.Student}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={onStartEdit}
										onUpdateDraft={onUpdateDraft}
										onSave={onSave}
										saving={saving}
										colorTheme="green"
										yearLevels={yearLevels}
										tribes={tribes}
										fetchUsers={fetchUsers}
										updateUserTribe={updateUserTribe}
										currentPage={currentPage}
										itemsPerPage={itemsPerPage}
										onPageChange={handlePageChange}
									/>
									<RoleGroup
										title="SBO Officer"
										icon={
											<GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
										}
										users={filteredUsers["SBO Officer"]}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={onStartEdit}
										onUpdateDraft={onUpdateDraft}
										onSave={onSave}
										saving={saving}
										colorTheme="amber"
										yearLevels={yearLevels}
										tribes={tribes}
										fetchUsers={fetchUsers}
										updateUserTribe={updateUserTribe}
										currentPage={currentPage}
										itemsPerPage={itemsPerPage}
										onPageChange={handlePageChange}
									/>
									<RoleGroup
										title="Faculty"
										icon={
											<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
										}
										users={filteredUsers.Faculty}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={onStartEdit}
										onUpdateDraft={onUpdateDraft}
										onSave={onSave}
										saving={saving}
										colorTheme="blue"
										yearLevels={yearLevels}
										tribes={tribes}
										fetchUsers={fetchUsers}
										updateUserTribe={updateUserTribe}
										currentPage={currentPage}
										itemsPerPage={itemsPerPage}
										onPageChange={handlePageChange}
									/>
									<RoleGroup
										title="Admin"
										icon={
											<Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
										}
										users={filteredUsers.Admin}
										editingUserId={editingUserId}
										editDrafts={editDrafts}
										onStartEdit={onStartEdit}
										onUpdateDraft={onUpdateDraft}
										onSave={onSave}
										saving={saving}
										colorTheme="red"
										yearLevels={yearLevels}
										tribes={tribes}
										fetchUsers={fetchUsers}
										updateUserTribe={updateUserTribe}
										currentPage={currentPage}
										itemsPerPage={itemsPerPage}
										onPageChange={handlePageChange}
									/>
								</div>
							) : (
								/* Empty state */
								<div className="flex justify-center items-center h-48">
									<div className="text-center">
										<Users className="mx-auto mb-3 w-12 h-12 text-gray-300 dark:text-gray-600" />
										<h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
											{search || yearLevelFilter || tribeFilter
												? "No matching users found"
												: "No users found"}
										</h3>
										<p className="text-sm text-gray-500 dark:text-gray-400">
											{search || yearLevelFilter || tribeFilter
												? "Try adjusting your search terms or filters"
												: "Start by creating your first user account"}
										</p>
										{(search || yearLevelFilter || tribeFilter) && (
											<button
												onClick={resetFilters}
												className="px-4 py-2 mt-3 text-sm font-medium text-blue-600 bg-blue-100 rounded-md transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
											>
												Clear All Filters
											</button>
										)}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function RoleGroup({
	title,
	icon,
	users,
	editingUserId,
	editDrafts,
	onStartEdit,
	onUpdateDraft,
	onSave,
	saving,
	colorTheme,
	yearLevels,
	tribes,
	fetchUsers,
	updateUserTribe,
	currentPage,
	itemsPerPage,
	onPageChange,
}) {
	const [isExpanded, setIsExpanded] = React.useState(true);
	const [showTribeManager, setShowTribeManager] = React.useState(false);
	const [selectedTribeId, setSelectedTribeId] = React.useState("");
	const [selectedUsers, setSelectedUsers] = React.useState([]);
	const [updatingTribe, setUpdatingTribe] = React.useState(false);
	const [notification, setNotification] = React.useState(null);
	const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
	const [confirmAction, setConfirmAction] = React.useState(null);
	const [showTribeImportModal, setShowTribeImportModal] = React.useState(false);
	const [showResetConfirmDialog, setShowResetConfirmDialog] =
		React.useState(false);
	const [resettingTribe, setResettingTribe] = React.useState(false);

	// Tribe manager filters
	const [tribeManagerSearch, setTribeManagerSearch] = React.useState("");
	const [tribeManagerYearFilter, setTribeManagerYearFilter] =
		React.useState("");

	// Pagination for this role group
	const [groupCurrentPage, setGroupCurrentPage] = React.useState(1);

	// Reset group page when users change or when tribe manager filters change
	React.useEffect(() => {
		setGroupCurrentPage(1);
	}, [users, tribeManagerSearch, tribeManagerYearFilter]);

	// Get paginated users for this group
	const getPaginatedGroupUsers = (userList) => {
		const startIndex = (groupCurrentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return userList.slice(startIndex, endIndex);
	};

	const getGroupTotalPages = (userList) => {
		return Math.ceil(userList.length / itemsPerPage);
	};

	const handleGroupPageChange = (newPage) => {
		setGroupCurrentPage(newPage);
	};

	// Filter users for tribe manager
	const filteredUsersForTribeManager = React.useMemo(() => {
		let filtered = users;

		// Apply year level filter
		if (tribeManagerYearFilter) {
			filtered = filtered.filter(
				(u) =>
					u.user_yearLevelId &&
					u.user_yearLevelId.toString() === tribeManagerYearFilter
			);
		}

		// Apply search filter
		if (tribeManagerSearch.trim()) {
			const term = tribeManagerSearch.trim().toLowerCase();
			filtered = filtered.filter((u) => {
				// Check if search term looks like an ID (contains numbers and possibly letters)
				const isLikelyId = /[0-9]/.test(term) && term.length >= 3;

				if (isLikelyId) {
					// Search primarily in ID field, but also check other fields
					return (
						u.user_id?.toLowerCase().includes(term) ||
						u.user_name?.toLowerCase().includes(term) ||
						u.user_email?.toLowerCase().includes(term)
					);
				} else {
					// Search primarily in name fields, but also check other fields
					return (
						u.user_name?.toLowerCase().includes(term) ||
						u.user_id?.toLowerCase().includes(term) ||
						u.user_email?.toLowerCase().includes(term)
					);
				}
			});
		}

		return filtered;
	}, [users, tribeManagerYearFilter, tribeManagerSearch]);

	if (!users || users.length === 0) return null;

	const colorClasses = {
		red: {
			bg: "bg-red-50 dark:bg-red-900/20",
			border: "border-red-200 dark:border-red-800",
			header: "bg-red-100 dark:bg-red-900/30",
			text: "text-red-800 dark:text-red-200",
			badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
		},
		blue: {
			bg: "bg-blue-50 dark:bg-blue-900/20",
			border: "border-blue-200 dark:border-blue-800",
			header: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-800 dark:text-blue-200",
			badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
		},
		amber: {
			bg: "bg-amber-50 dark:bg-amber-900/20",
			border: "border-amber-200 dark:border-amber-800",
			header: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-800 dark:text-amber-200",
			badge:
				"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
		},
		green: {
			bg: "bg-green-50 dark:bg-green-900/20",
			border: "border-green-200 dark:border-green-800",
			header: "bg-green-100 dark:bg-green-900/30",
			text: "text-green-800 dark:text-green-200",
			badge:
				"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
		},
	};

	const colors = colorClasses[colorTheme] || colorClasses.blue;

	// Tribe management functions
	const handleTribeUpdate = async () => {
		if (!selectedTribeId || selectedUsers.length === 0) return;

		// Get tribe name for confirmation
		const selectedTribe = tribes?.find((t) => t.tribe_id == selectedTribeId);
		const tribeName = selectedTribe?.tribe_name || "Unknown Tribe";

		// Show custom confirmation dialog
		setConfirmAction({
			message: `Are you sure you want to update ${
				selectedUsers.length
			} ${title.toLowerCase()}(s) to tribe "${tribeName}"? This action cannot be undone.`,
			tribeName: tribeName,
			onConfirm: () => executeTribeUpdate(selectedTribeId, tribeName),
		});
		setShowConfirmDialog(true);
	};

	const executeTribeUpdate = async (tribeId, tribeName) => {
		setShowConfirmDialog(false);
		setConfirmAction(null);

		setUpdatingTribe(true);
		try {
			// Update each selected user's tribe using the imported function
			const updatePromises = selectedUsers.map((userId) =>
				updateUserTribe(userId, parseInt(selectedTribeId))
			);

			await Promise.all(updatePromises);

			// Reset form and refresh users
			setSelectedUsers([]);
			setSelectedTribeId("");
			setShowTribeManager(false);

			// Refresh the user list
			if (typeof fetchUsers === "function") {
				fetchUsers();
			}

			// Show success message
			showNotification(
				`Successfully updated tribe for ${
					selectedUsers.length
				} ${title.toLowerCase()}(s) to "${tribeName}"`,
				"success"
			);
		} catch (error) {
			console.error("Error updating tribes:", error);
			showNotification(`Failed to update tribes: ${error.message}`, "error");
		} finally {
			setUpdatingTribe(false);
		}
	};

	// updateUserTribe function is now imported from admin.js

	const toggleUserSelection = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
		);
	};

	const selectAllUsers = () => {
		setSelectedUsers(filteredUsersForTribeManager.map((u) => u.user_id));
	};

	const deselectAllUsers = () => {
		setSelectedUsers([]);
	};

	const showNotification = (message, type = "info") => {
		setNotification({ message, type, timestamp: Date.now() });
		// Auto-hide after 5 seconds
		setTimeout(() => setNotification(null), 5000);
	};

	const resetTribeManagerFilters = () => {
		setTribeManagerSearch("");
		setTribeManagerYearFilter("");
		setSelectedUsers([]);
	};

	const handleResetTribe = async () => {
		setShowResetConfirmDialog(false);
		setResettingTribe(true);

		try {
			const response = await resetUsersTribe(title);

			if (response.success) {
				showNotification(response.message, "success");

				// Refresh the user list
				if (typeof fetchUsers === "function") {
					fetchUsers();
				}

				// Reset tribe manager state
				setSelectedUsers([]);
				setSelectedTribeId("");
			} else {
				showNotification(
					`Failed to reset tribes: ${response.message}`,
					"error"
				);
			}
		} catch (error) {
			console.error("Error resetting tribes:", error);
			showNotification(`Failed to reset tribes: ${error.message}`, "error");
		} finally {
			setResettingTribe(false);
		}
	};

	return (
		<div
			className={`rounded-xl border overflow-hidden ${
				showTribeManager
					? "border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
					: `${colors.border} ${colors.bg}`
			}`}
		>
			{/* Notification */}
			{notification && (
				<div
					className={`p-3 text-sm font-medium flex justify-between items-center ${
						notification.type === "success"
							? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
							: notification.type === "error"
							? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
							: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
					}`}
				>
					<span>{notification.message}</span>
					<button
						onClick={() => setNotification(null)}
						className="ml-2 text-current hover:opacity-70"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Custom Confirmation Dialog */}
			{showConfirmDialog && confirmAction && (
				<div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
					<div className="p-6 mx-4 max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
						<div className="flex gap-3 items-center mb-4">
							<div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900/30">
								<AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Confirm Tribe Update
							</h3>
						</div>

						<p className="mb-6 text-gray-700 dark:text-gray-300">
							{confirmAction.message}
						</p>

						<div className="flex gap-3 justify-end">
							<button
								onClick={() => {
									setShowConfirmDialog(false);
									setConfirmAction(null);
								}}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
							<button
								onClick={confirmAction.onConfirm}
								className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
							>
								Update Tribe
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Reset Tribe Confirmation Dialog */}
			{showResetConfirmDialog && (
				<div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
					<div className="p-6 mx-4 max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
						<div className="flex gap-3 items-center mb-4">
							<div className="p-2 bg-red-100 rounded-full dark:bg-red-900/30">
								<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Reset All {title} Tribes
							</h3>
						</div>

						<p className="mb-6 text-gray-700 dark:text-gray-300">
							Are you sure you want to reset all {title.toLowerCase()}s' tribe
							assignments? This will remove all {title.toLowerCase()}s from
							their current tribes and cannot be undone.
						</p>

						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowResetConfirmDialog(false)}
								disabled={resettingTribe}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
							<button
								onClick={handleResetTribe}
								disabled={resettingTribe}
								className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{resettingTribe && (
									<RefreshCw className="w-4 h-4 animate-spin" />
								)}
								{resettingTribe ? "Resetting..." : "Reset Tribes"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Group Header */}
			<div className={`px-3 py-3 ${colors.header} border-b ${colors.border}`}>
				<div className="flex justify-between items-center">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex flex-1 gap-2 items-center text-left transition-opacity hover:opacity-80"
					>
						<div className="p-1.5 bg-white rounded-md shadow-sm dark:bg-gray-800">
							{icon}
						</div>
						<div>
							<h3 className={`text-base font-bold ${colors.text}`}>{title}</h3>
							<p className="text-xs opacity-80">
								{users.length} {users.length === 1 ? "user" : "users"}
							</p>
						</div>
					</button>

					<div className="flex gap-2 items-center">
						{/* Manage Tribe Button for Students and SBO Officers */}
						{(title === "Student" || title === "SBO Officer") && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									setShowTribeManager(!showTribeManager);
								}}
								className={`text-xs font-medium transition-colors border-b border-transparent ${
									showTribeManager
										? "text-emerald-800 dark:text-emerald-200"
										: "text-emerald-600 dark:text-emerald-400 hover:border-emerald-600 dark:hover:border-emerald-400"
								}`}
							>
								{showTribeManager ? "Cancel" : "Manage Tribe"}
							</button>
						)}

						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="p-1 rounded transition-colors hover:bg-white/20"
						>
							{isExpanded ? (
								<ChevronUp className="w-4 h-4 text-gray-500" />
							) : (
								<ChevronDown className="w-4 h-4 text-gray-500" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Tribe Manager */}
			{showTribeManager && (title === "Student" || title === "SBO Officer") && (
				<div className="p-3 sm:p-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
					<div className="space-y-3 sm:space-y-4">
						{/* Header with Import and Selection Buttons */}
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
							<h4 className="text-sm font-semibold text-gray-900 dark:text-white">
								Manage Tribe for {title}s
							</h4>
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => setShowTribeImportModal(true)}
									className="flex gap-1.5 items-center px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-900/50"
								>
									<FileSpreadsheet className="w-3 h-3" />
									<span className="hidden sm:inline">Import Excel</span>
									<span className="sm:hidden">Import</span>
								</button>
								<button
									onClick={() => setShowResetConfirmDialog(true)}
									disabled={resettingTribe}
									className="flex gap-1.5 items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
								>
									{resettingTribe && (
										<RefreshCw className="w-3 h-3 animate-spin" />
									)}
									<span className="hidden sm:inline">Reset Tribe</span>
									<span className="sm:hidden">Reset</span>
								</button>
								<button
									onClick={selectAllUsers}
									className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
								>
									Select All
								</button>
								<button
									onClick={deselectAllUsers}
									className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								>
									Deselect All
								</button>
							</div>
						</div>

						{/* Tribe Manager Filters - Mobile Optimized */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							{/* Search Input */}
							<div className="space-y-1">
								<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
									Search Users
								</label>
								<div className="relative">
									<Search className="absolute left-2.5 top-1/2 w-3 h-3 text-gray-400 -translate-y-1/2" />
									<input
										type="text"
										className="py-2 pr-3 pl-8 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
										placeholder="Search by name, ID, or email..."
										value={tribeManagerSearch}
										onChange={(e) => setTribeManagerSearch(e.target.value)}
									/>
								</div>
							</div>

							{/* Year Level Filter */}
							<div className="space-y-1">
								<label className="text-xs font-medium text-gray-700 dark:text-gray-300">
									Year Level
								</label>
								<select
									value={tribeManagerYearFilter}
									onChange={(e) => setTribeManagerYearFilter(e.target.value)}
									className="py-2 px-3 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value="">All Year Levels</option>
									{yearLevels?.map((level) => (
										<option key={level.yearL_id} value={level.yearL_id}>
											{level.yearL_name}
										</option>
									))}
								</select>
							</div>

							{/* Reset Filters Button */}
							<div className="space-y-1">
								{(tribeManagerSearch || tribeManagerYearFilter) && (
									<button
										onClick={resetTribeManagerFilters}
										className="py-2 px-3 w-full text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
									>
										Reset Filters
									</button>
								)}
							</div>
						</div>

						{/* Active Filters Display - Mobile Optimized */}
						{(tribeManagerSearch || tribeManagerYearFilter) && (
							<div className="flex flex-wrap gap-2 items-center">
								<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
									Active Filters:
								</span>
								{tribeManagerYearFilter && (
									<span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/20 dark:text-blue-300">
										Year:{" "}
										{
											yearLevels?.find(
												(l) => l.yearL_id.toString() === tribeManagerYearFilter
											)?.yearL_name
										}
										<button
											onClick={() => setTribeManagerYearFilter("")}
											className="ml-1 w-3 h-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
										>
											×
										</button>
									</span>
								)}
								{tribeManagerSearch && (
									<span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-blue-900/20 dark:text-purple-300">
										Search: "{tribeManagerSearch}"
										<button
											onClick={() => setTribeManagerSearch("")}
											className="ml-1 w-3 h-3 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
										>
											×
										</button>
									</span>
								)}
							</div>
						)}

						{/* Filtered Results Summary */}
						{(tribeManagerSearch || tribeManagerYearFilter) && (
							<div className="p-3 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
								<p className="text-sm text-blue-700 dark:text-blue-300">
									{filteredUsersForTribeManager.length} users found
									{selectedUsers.length > 0 &&
										` • ${selectedUsers.length} selected`}
								</p>
							</div>
						)}

						{/* Tribe Selection - Mobile Optimized */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Select Tribe:
							</label>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
								<select
									value={selectedTribeId}
									onChange={(e) => setSelectedTribeId(e.target.value)}
									className="px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								>
									<option value="">Choose a tribe...</option>
									{tribes?.map((tribe) => (
										<option key={tribe.tribe_id} value={tribe.tribe_id}>
											{tribe.tribe_name}
										</option>
									))}
								</select>

								<button
									onClick={handleTribeUpdate}
									disabled={
										!selectedTribeId ||
										selectedUsers.length === 0 ||
										updatingTribe
									}
									className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{updatingTribe && (
										<RefreshCw className="w-4 h-4 animate-spin" />
									)}
									<span className="whitespace-nowrap">
										{updatingTribe
											? "Updating..."
											: `Update ${selectedUsers.length} Users`}
									</span>
								</button>
							</div>
						</div>

						{/* Add New Tribe Section - Mobile Optimized */}
						<div className="p-3 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex gap-2 items-center">
									<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
										Need a new tribe? Create one and import users directly
									</span>
								</div>
								<button
									onClick={() => setShowTribeImportModal(true)}
									className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 whitespace-nowrap"
								>
									Create & Import
								</button>
							</div>
						</div>

						{/* Selection Summary */}
						{selectedUsers.length > 0 && (
							<div className="p-3 bg-blue-50 rounded border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
								<p className="text-sm text-blue-700 dark:text-blue-300">
									{selectedUsers.length} {title.toLowerCase()}
									{selectedUsers.length === 1 ? "" : "s"} selected
									{filteredUsersForTribeManager.length !== users.length &&
										` (from ${filteredUsersForTribeManager.length} filtered users)`}
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Users List */}
			{isExpanded && (
				<>
					<div className="divide-y divide-gray-200 dark:divide-gray-700">
						{getPaginatedGroupUsers(
							showTribeManager ? filteredUsersForTribeManager : users
						).map((u) => (
							<UserCard
								key={u.user_id}
								user={u}
								isEditing={editingUserId === u.user_id}
								editDrafts={editDrafts}
								onStartEdit={onStartEdit}
								onUpdateDraft={onUpdateDraft}
								onSave={onSave}
								saving={saving}
								colorTheme={colorTheme}
								yearLevels={yearLevels}
								tribes={tribes}
								showTribeManager={showTribeManager}
								selectedUsers={selectedUsers}
								onToggleSelection={toggleUserSelection}
							/>
						))}
					</div>

					{/* Group Pagination Controls */}
					{getGroupTotalPages(
						showTribeManager ? filteredUsersForTribeManager : users
					) > 1 && (
						<div className="p-3 bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								{/* Page Info */}
								<div className="text-xs text-gray-600 dark:text-gray-400">
									Showing {(groupCurrentPage - 1) * itemsPerPage + 1} to{" "}
									{Math.min(
										groupCurrentPage * itemsPerPage,
										(showTribeManager ? filteredUsersForTribeManager : users)
											.length
									)}{" "}
									of{" "}
									{
										(showTribeManager ? filteredUsersForTribeManager : users)
											.length
									}{" "}
									{title.toLowerCase()}(s)
								</div>

								{/* Pagination Buttons */}
								<div className="flex gap-1 items-center">
									<button
										onClick={() => handleGroupPageChange(groupCurrentPage - 1)}
										disabled={groupCurrentPage === 1}
										className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
									>
										Previous
									</button>

									{/* Page Numbers */}
									{Array.from(
										{
											length: getGroupTotalPages(
												showTribeManager ? filteredUsersForTribeManager : users
											),
										},
										(_, i) => i + 1
									)
										.filter((page) => {
											const totalPages = getGroupTotalPages(
												showTribeManager ? filteredUsersForTribeManager : users
											);
											if (totalPages <= 7) return true;
											if (page === 1 || page === totalPages) return true;
											if (
												page >= groupCurrentPage - 1 &&
												page <= groupCurrentPage + 1
											)
												return true;
											return false;
										})
										.map((page, index, array) => {
											const totalPages = getGroupTotalPages(
												showTribeManager ? filteredUsersForTribeManager : users
											);
											const showEllipsis =
												index > 0 && page - array[index - 1] > 1;

											return (
												<React.Fragment key={page}>
													{showEllipsis && (
														<span className="px-2 py-1 text-xs text-gray-500">
															...
														</span>
													)}
													<button
														onClick={() => handleGroupPageChange(page)}
														className={`px-2 py-1 text-xs font-medium rounded ${
															page === groupCurrentPage
																? "text-white bg-emerald-600 border border-emerald-600"
																: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
														}`}
													>
														{page}
													</button>
												</React.Fragment>
											);
										})}

									<button
										onClick={() => handleGroupPageChange(groupCurrentPage + 1)}
										disabled={
											groupCurrentPage ===
											getGroupTotalPages(
												showTribeManager ? filteredUsersForTribeManager : users
											)
										}
										className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
									>
										Next
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			)}

			{/* Tribe Import Modal */}
			<TribeImportModal
				isOpen={showTribeImportModal}
				onClose={() => setShowTribeImportModal(false)}
				tribes={tribes}
				onImportComplete={() => {
					setShowTribeImportModal(false);
					if (typeof fetchUsers === "function") {
						fetchUsers();
					}
				}}
			/>
		</div>
	);
}
