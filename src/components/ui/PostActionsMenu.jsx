import React, { useRef, useEffect } from "react";

export default function PostActionsMenu({
	canEdit = false,
	onEdit,
	onArchive,
	onTrash,
	isOpen,
	onClose,
}) {
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				onClose && onClose();
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			className="absolute right-0 top-full mt-1 z-50 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#1f1f1f]"
		>
			<div className="py-1">
				{canEdit && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onEdit && onEdit(e);
						}}
						className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<svg
							className="mr-2 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						Edit post
					</button>
				)}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onArchive && onArchive(e);
					}}
					className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<svg
						className="mr-2 h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v8m4-12H8a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2z"
						/>
					</svg>
					Move to Archive
				</button>
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onTrash && onTrash(e);
					}}
					className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
				>
					<svg
						className="mr-2 h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 01-2-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v0a2 2 0 01-2 2"
						/>
					</svg>
					Move to Trash
				</button>
			</div>
		</div>
	);
}
