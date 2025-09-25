import * as React from "react";
import { ChevronDownIcon, CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(
	(
		{
			options = [],
			value,
			onValueChange,
			placeholder = "Select an option...",
			searchPlaceholder = "Search...",
			className,
			disabled = false,
			...props
		},
		ref
	) => {
		const [open, setOpen] = React.useState(false);
		const [searchTerm, setSearchTerm] = React.useState("");
		const selectRef = React.useRef(null);
		const searchRef = React.useRef(null);

		// Filter options based on search term
		const filteredOptions = React.useMemo(() => {
			if (!searchTerm) return options;
			return options.filter((option) =>
				option.label.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}, [options, searchTerm]);

		// Find selected option
		const selectedOption = options.find((option) => option.value === value);

		// Handle click outside to close dropdown
		React.useEffect(() => {
			const handleClickOutside = (event) => {
				if (selectRef.current && !selectRef.current.contains(event.target)) {
					setOpen(false);
					setSearchTerm("");
				}
			};

			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}, []);

		// Focus search input when dropdown opens
		React.useEffect(() => {
			if (open && searchRef.current) {
				searchRef.current.focus();
			}
		}, [open]);

		// Handle keyboard navigation
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setOpen(false);
				setSearchTerm("");
			} else if (event.key === "Enter") {
				event.preventDefault();
				if (filteredOptions.length > 0) {
					onValueChange(filteredOptions[0].value);
					setOpen(false);
					setSearchTerm("");
				}
			}
		};

		const handleOptionSelect = (optionValue) => {
			onValueChange(optionValue);
			setOpen(false);
			setSearchTerm("");
		};

		return (
			<div className="relative" ref={selectRef}>
				{/* Trigger Button */}
				<button
					type="button"
					ref={ref}
					className={cn(
						"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
						"placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
						"dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
						className
					)}
					onClick={() => !disabled && setOpen(!open)}
					disabled={disabled}
					{...props}
				>
					<span
						className={
							selectedOption
								? "text-foreground"
								: "text-muted-foreground dark:text-gray-400"
						}
					>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<ChevronDownIcon
						className={cn(
							"h-4 w-4 opacity-50 transition-transform duration-200",
							open && "rotate-180"
						)}
					/>
				</button>

				{/* Dropdown */}
				{open && (
					<div
						className={cn(
							"absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md",
							"dark:bg-gray-800 dark:border-gray-600"
						)}
					>
						{/* Search Input */}
						<div className="flex items-center border-b px-3 dark:border-gray-600">
							<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
							<input
								ref={searchRef}
								type="text"
								placeholder={searchPlaceholder}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={handleKeyDown}
								className={cn(
									"flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none",
									"placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
									"dark:text-gray-200 dark:placeholder:text-gray-400"
								)}
							/>
						</div>

						{/* Options List */}
						<div className="max-h-60 overflow-auto p-1">
							{filteredOptions.length === 0 ? (
								<div className="py-6 text-center text-sm text-muted-foreground dark:text-gray-400">
									No options found.
								</div>
							) : (
								filteredOptions.map((option) => (
									<div
										key={option.value}
										className={cn(
											"relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
											"hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
											"dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:text-gray-200",
											value === option.value &&
												"bg-accent text-accent-foreground dark:bg-gray-700"
										)}
										onClick={() => handleOptionSelect(option.value)}
									>
										<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
											{value === option.value && (
												<CheckIcon className="h-4 w-4" />
											)}
										</span>
										{option.label}
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>
		);
	}
);

Select.displayName = "Select";

export { Select };
