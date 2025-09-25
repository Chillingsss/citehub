import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title = "Confirm Action",
	message = "Are you sure you want to proceed?",
	confirmText = "Confirm",
	cancelText = "Cancel",
	type = "danger", // 'danger', 'warning', 'info'
}) {
	if (!isOpen) return null;

	const getTypeStyles = () => {
		switch (type) {
			case "danger":
				return {
					icon: "🗑️",
					iconBg: "bg-red-100 dark:bg-red-900/30",
					iconColor: "text-red-600 dark:text-red-400",
					confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
				};
			case "warning":
				return {
					icon: "⚠️",
					iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
					iconColor: "text-yellow-600 dark:text-yellow-400",
					confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
				};
			case "info":
				return {
					icon: "ℹ️",
					iconBg: "bg-blue-100 dark:bg-blue-900/30",
					iconColor: "text-blue-600 dark:text-blue-400",
					confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
				};
			default:
				return {
					icon: "❓",
					iconBg: "bg-gray-100 dark:bg-gray-700",
					iconColor: "text-gray-600 dark:text-gray-400",
					confirmBtn: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
				};
		}
	};

	const styles = getTypeStyles();

	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Escape") {
			onClose();
		} else if (e.key === "Enter") {
			onConfirm();
		}
	};

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			tabIndex={-1}
		>
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
					<div className="flex items-center gap-3">
						<div
							className={`flex items-center justify-center w-10 h-10 rounded-full ${styles.iconBg}`}
						>
							<span className="text-lg">{styles.icon}</span>
						</div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							{title}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
						{message}
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3 p-6 pt-0 justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className={`px-4 py-2 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${styles.confirmBtn}`}
						autoFocus
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
