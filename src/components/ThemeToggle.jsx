import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }) {
	const { toggleTheme, isDark } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className={`relative p-3 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
			title={`Switch to ${isDark ? "light" : "dark"} mode`}
		>
			<div className="flex relative justify-center items-center w-6 h-6">
				{/* Sun Icon */}
				<Sun
					className={`absolute w-6 h-6 text-yellow-500 transition-all duration-300 transform ${
						isDark
							? "opacity-0 scale-0 rotate-90"
							: "opacity-100 scale-100 rotate-0"
					}`}
				/>

				{/* Moon Icon */}
				<Moon
					className={`absolute w-6 h-6 text-blue-400 transition-all duration-300 transform ${
						isDark
							? "opacity-100 scale-100 rotate-0"
							: "opacity-0 scale-0 -rotate-90"
					}`}
				/>
			</div>
		</button>
	);
}
