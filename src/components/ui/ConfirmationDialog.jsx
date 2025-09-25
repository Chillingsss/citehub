import React from "react";

export default function ConfirmationDialog({
	isOpen,
	onClose,
	onConfirm,
	title = "Confirm Action",
	message = "Are you sure you want to proceed?",
	confirmText = "Confirm",
	cancelText = "Cancel",
	type = "danger", // 'danger', 'warning', 'info'
	isLoading = false,
	loadingText = "Processing...",
}) {
	if (!isOpen) return null;

	const getTypeStyles = () => {
		switch (type) {
			case "danger":
				return {
					icon: (
						<svg
							className="w-6 h-6 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					),
					iconBg: "bg-red-100 dark:bg-red-900/20",
					confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
				};
			case "warning":
				return {
					icon: (
						<svg
							className="w-6 h-6 text-yellow-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					),
					iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
					confirmButton:
						"bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
				};
			case "info":
				return {
					icon: (
						<svg
							className="w-6 h-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					),
					iconBg: "bg-blue-100 dark:bg-blue-900/20",
					confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
				};
			default:
				return {
					icon: null,
					iconBg: "bg-gray-100 dark:bg-gray-800",
					confirmButton: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
				};
		}
	};

	const typeStyles = getTypeStyles();

	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all">
				{/* Header */}
				<div className="flex items-center justify-between p-6 pb-4">
					<div className="flex items-center space-x-3">
						{typeStyles.icon && (
							<div
								className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeStyles.iconBg}`}
							>
								{typeStyles.icon}
							</div>
						)}
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							{title}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className="px-6 pb-6">
					<p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
						{message}
					</p>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						disabled={isLoading}
						className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center space-x-2 ${typeStyles.confirmButton}`}
					>
						{isLoading && (
							<svg
								className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						)}
						<span>{isLoading ? loadingText : confirmText}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
