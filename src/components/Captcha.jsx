import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";
import { useTheme } from "../contexts/ThemeContext";

export default function Captcha({ onVerify, error }) {
	const [captchaText, setCaptchaText] = useState("");
	const [userInput, setUserInput] = useState("");
	const canvasRef = useRef(null);
	const { isDark } = useTheme();

	// Generate random CAPTCHA text
	const generateCaptcha = () => {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		for (let i = 0; i < 6; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setCaptchaText(result);
		setUserInput("");
		return result;
	};

	// Draw CAPTCHA on canvas with theme support
	const drawCaptcha = (text) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Background with theme-aware colors
		if (isDark) {
			// Dark mode background
			const gradient = ctx.createLinearGradient(
				0,
				0,
				canvas.width,
				canvas.height
			);
			gradient.addColorStop(0, "#1f2937");
			gradient.addColorStop(0.5, "#374151");
			gradient.addColorStop(1, "#111827");
			ctx.fillStyle = gradient;
		} else {
			// Light mode background
			ctx.fillStyle = "#f0f9ff";
		}
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add theme-aware noise lines
		for (let i = 0; i < 3; i++) {
			if (isDark) {
				ctx.strokeStyle = `rgba(59, 130, 246, ${Math.random() * 0.3 + 0.2})`;
			} else {
				ctx.strokeStyle = `rgba(34, 197, 94, ${Math.random() * 0.2 + 0.1})`;
			}
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
			ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
			ctx.stroke();
		}

		// Draw text with theme-aware colors
		const charWidth = canvas.width / text.length;
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const x = charWidth * i + charWidth / 2;
			const y = canvas.height / 2;

			// Font size and rotation
			const fontSize = 14 + Math.random() * 4;
			const rotation = (Math.random() - 0.5) * 0.2;

			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rotation);
			ctx.font = `bold ${fontSize}px Arial`;

			// Theme-aware text colors
			if (isDark) {
				// Dark mode: lighter colors
				const hue = 200 + Math.random() * 60; // Blue to cyan range
				const saturation = 70 + Math.random() * 20;
				const lightness = 60 + Math.random() * 25;
				ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
			} else {
				// Light mode: darker colors
				const greenShade = Math.floor(Math.random() * 80) + 60;
				ctx.fillStyle = `rgb(${Math.floor(
					greenShade * 0.3
				)}, ${greenShade}, ${Math.floor(greenShade * 0.5)})`;
			}

			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(char, 0, 0);
			ctx.restore();
		}

		// Add theme-aware noise dots
		for (let i = 0; i < 20; i++) {
			if (isDark) {
				ctx.fillStyle = `rgba(59, 130, 246, ${Math.random() * 0.4 + 0.1})`;
			} else {
				ctx.fillStyle = `rgba(34, 197, 94, ${Math.random() * 0.2 + 0.1})`;
			}
			ctx.beginPath();
			ctx.arc(
				Math.random() * canvas.width,
				Math.random() * canvas.height,
				0.5,
				0,
				2 * Math.PI
			);
			ctx.fill();
		}
	};

	// Initialize CAPTCHA on component mount
	useEffect(() => {
		const text = generateCaptcha();
		drawCaptcha(text);
	}, []);

	// Redraw when captcha text changes or theme changes
	useEffect(() => {
		if (captchaText) {
			drawCaptcha(captchaText);
		}
	}, [captchaText, isDark]);

	const handleRefresh = () => {
		const newText = generateCaptcha();
		drawCaptcha(newText);
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setUserInput(value);

		// Auto-verify when user has entered the correct length
		if (value.length === captchaText.length) {
			const isValid = value === captchaText; // Exact case-sensitive match
			onVerify(isValid, value);
		}
	};

	return (
		<div className="space-y-3 w-full">
			<Label className="text-sm font-semibold text-green-800 dark:text-green-300">
				CAPTCHA Verification
			</Label>

			{/* CAPTCHA Display - Theme-aware Layout */}
			<div className="flex flex-col space-y-3">
				<div className="flex justify-center items-center">
					<canvas
						ref={canvasRef}
						width={140}
						height={45}
						className="bg-white rounded-lg border-2 border-green-200 shadow-sm dark:bg-gray-800 dark:border-gray-600"
						style={{ width: "180px", height: "65px" }}
					/>
				</div>
				<div className="flex justify-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						className="p-2 w-8 h-8 text-green-600 bg-green-50 rounded-lg border-2 border-green-200 transition-all duration-200 dark:text-green-400 dark:bg-gray-700 dark:border-gray-600 hover:bg-green-100 dark:hover:bg-gray-600 hover:text-green-700 dark:hover:text-green-300"
						title="Refresh CAPTCHA"
					>
						<RefreshCw className="w-3 h-3" />
					</Button>
				</div>
			</div>

			{/* Input Field - Theme-aware */}
			<div className="space-y-2">
				<Input
					type="text"
					value={userInput}
					onChange={handleInputChange}
					placeholder="Enter the characters shown above"
					className="px-3 py-2 w-full text-sm placeholder-green-400 text-green-900 rounded-lg border-2 border-green-200 transition-all duration-200 dark:placeholder-green-500 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 hover:border-green-300 dark:hover:border-gray-500"
					maxLength={6}
				/>
				{error && (
					<p className="text-xs font-medium text-red-600 dark:text-red-400">
						{error}
					</p>
				)}
			</div>

			<p className="text-xs leading-relaxed text-center text-green-600 dark:text-green-400">
				Enter the characters shown in the image above (case sensitive)
			</p>
		</div>
	);
}
