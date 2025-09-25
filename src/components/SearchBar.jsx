import React, { useState, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
	onSearch,
	placeholder = "Search posts, people...",
	className = "",
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const searchInputRef = useRef(null);

	// Handle search input change
	const handleSearchChange = (e) => {
		const query = e.target.value;
		setSearchQuery(query);

		// Debounce search to avoid too many API calls
		if (isSearching) return;

		setIsSearching(true);
		setTimeout(() => {
			onSearch(query);
			setIsSearching(false);
		}, 300);
	};

	// Handle search submit
	const handleSearchSubmit = (e) => {
		e.preventDefault();
		onSearch(searchQuery);
	};

	// Clear search
	const handleClearSearch = () => {
		setSearchQuery("");
		onSearch("");
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	return (
		<div className="flex-1 w-full max-w-full px-2 sm:px-4">
			<form onSubmit={handleSearchSubmit} className="relative w-full">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						ref={searchInputRef}
						type="text"
						value={searchQuery}
						onChange={handleSearchChange}
						placeholder={placeholder}
						className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#282828] dark:text-gray-100 dark:placeholder-gray-400"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={handleClearSearch}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:hover:text-gray-300"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>
			</form>
		</div>
	);
}
