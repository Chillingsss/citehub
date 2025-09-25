import React from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeLoader({ children }) {
	const { isLoaded } = useTheme();

	if (!isLoaded) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
				<div className="flex flex-col items-center space-y-4">
					<div className="w-12 h-12 rounded-full border-4 border-green-200 animate-spin dark:border-green-700 border-t-green-600 dark:border-t-green-400"></div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
				</div>
			</div>
		);
	}

	return children;
}
