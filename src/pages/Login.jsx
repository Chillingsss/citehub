"use client";

import React, { useState, useEffect } from "react";
import {
	LockKeyhole,
	Mail,
	ArrowRight,
	AlertCircle,
	Eye,
	EyeOff,
	Users,
} from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import Captcha from "../components/Captcha";
import { loginUser } from "../utils/security";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import PasswordResetModal from "../components/PasswordResetModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

const COOKIE_KEY = "cite_user";
const SECRET_KEY = "cite_secret_key"; // You can use a more secure key in production

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showCaptcha, setShowCaptcha] = useState(false);
	const [captchaVerified, setCaptchaVerified] = useState(false);
	const [captchaError, setCaptchaError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
	const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		const encrypted = Cookies.get(COOKIE_KEY);
		if (encrypted) {
			try {
				const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
				const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
				if (decrypted && decrypted.userLevel === "Admin") {
					navigate("/AdminDashboard");
				} else if (decrypted && decrypted.userLevel === "Student") {
					navigate("/StudentDashboard");
				} else if (decrypted && decrypted.userLevel === "Faculty") {
					navigate("/FacultyDashboard");
				} else if (decrypted && decrypted.userLevel === "SBO Officer") {
					navigate("/SboDashboard");
				}
			} catch (e) {
				// Invalid cookie, ignore
			}
		}
	}, [navigate]);

	const handleCaptchaVerify = (isValid, userInput) => {
		if (isValid) {
			setCaptchaVerified(true);
			setCaptchaError("");
			toast.success("CAPTCHA verified successfully!");
		} else {
			setCaptchaVerified(false);
			setCaptchaError("Incorrect CAPTCHA. Please try again.");
			toast.error("Incorrect CAPTCHA. Please try again.");
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		// Validate username and password first
		if (!username.trim() || !password.trim()) {
			setError("Please enter both username and password.");
			toast.error("Please enter both username and password.");
			return;
		}

		// First click: Show CAPTCHA
		if (!showCaptcha) {
			setShowCaptcha(true);
			setError(""); // Clear any previous errors
			toast("Please complete the CAPTCHA verification to continue.");
			return;
		}

		// Second click: Check CAPTCHA and proceed with login
		if (!captchaVerified) {
			setCaptchaError("Please complete the CAPTCHA verification first.");
			toast.error("Please complete the CAPTCHA verification first.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const user = await loginUser(username, password);

			if (user) {
				// Check if password reset is required
				if (user.requiresPasswordReset) {
					setError(
						"Password reset required. Please reset your default password first."
					);
					toast.error("Password reset required!");
					setShowPasswordResetModal(true);
					setIsLoading(false);
					return;
				}

				// Store user data in cookie after successful login
				const encrypted = CryptoJS.AES.encrypt(
					JSON.stringify(user),
					SECRET_KEY
				).toString();
				Cookies.set(COOKIE_KEY, encrypted, { expires: 1 }); // 1 day expiry

				// Navigate to appropriate dashboard
				if (user.userLevel === "Admin") {
					toast.success("Welcome to Admin Dashboard!");
					navigate("/AdminDashboard");
				} else if (user.userLevel === "Student") {
					toast.success("Welcome to Student Dashboard!");
					navigate("/StudentDashboard");
				} else if (user.userLevel === "Faculty") {
					toast.success("Welcome to Faculty Dashboard!");
					navigate("/FacultyDashboard");
				} else if (user.userLevel === "SBO Officer") {
					toast.success("Welcome to SBO Officer Dashboard!");
					navigate("/SboDashboard");
				}
			} else {
				// Invalid credentials - reset everything
				setError(
					"Invalid credentials or unauthorized access. Please check your username and password."
				);
				toast.error("Login failed");
				setShowCaptcha(false);
				setCaptchaVerified(false);
				setCaptchaError("");
				setIsLoading(false);
			}
		} catch (err) {
			console.error("Login error:", err);
			setError("Login failed. Please try again.");
			toast.error("Login failed. Please try again.");
			// Reset everything on error
			setShowCaptcha(false);
			setCaptchaVerified(false);
			setCaptchaError("");
			setIsLoading(false);
		}
	};

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
				{/* Theme Toggle - Fixed position */}
				<div className="fixed top-4 right-4 z-50">
					<ThemeToggle />
				</div>

				{/* Left Panel - Logo Section */}
				<div className="hidden overflow-hidden relative bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 lg:flex lg:w-2/5">
					{/* Background Pattern */}
					<div className="absolute inset-0 bg-gradient-to-br from-green-700/30 via-emerald-800/30 to-green-900/30 dark:from-gray-700/30 dark:via-gray-800/30 dark:to-gray-900/30"></div>

					<div className="flex relative z-10 flex-col justify-center items-center p-12 w-full h-full text-center text-white">
						<div className="flex flex-col justify-center items-center space-y-8">
							<div className="inline-flex justify-center items-center w-32 h-32 rounded-3xl border shadow-2xl backdrop-blur-sm bg-white/10 border-white/20 dark:bg-gray-800/20 dark:border-gray-600/30">
								<img
									src="https://coc-studentinfo.net/images/cocLogo.png"
									alt="PHINMA Cagayan de Oro College Logo"
									className="object-contain w-20 h-20"
								/>
							</div>
							<div className="space-y-4">
								<h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-200 via-emerald-200 to-white dark:from-green-300 dark:via-emerald-300 dark:to-gray-100">
									PHINMA
								</h1>
								<h2 className="text-2xl font-semibold text-green-100 dark:text-green-200">
									Cagayan de Oro College
								</h2>
								<p className="text-lg text-green-200 dark:text-green-300">
									Social Media System
								</p>
							</div>

							<div className="max-w-sm">
								<div className="p-4 rounded-2xl border backdrop-blur-sm bg-white/5 border-white/10 dark:bg-gray-800/10 dark:border-gray-600/20">
									<div className="flex items-center mb-4 space-x-4">
										<Users className="w-8 h-8 text-green-300 dark:text-green-400" />
										<div className="text-left">
											<h3 className="text-lg font-semibold text-white dark:text-gray-100">
												College of Information Technology
											</h3>
											<p className="text-green-200 dark:text-green-300">
												Department
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Panel - Login Form */}
				<div className="flex flex-1 justify-center items-center p-6">
					<div className="w-full max-w-md">
						{/* Mobile Header */}
						<div className="mb-8 text-center lg:hidden">
							<div className="inline-flex justify-center items-center mb-6 w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl shadow-xl dark:from-green-500 dark:to-emerald-600">
								<img
									src="https://coc-studentinfo.net/images/cocLogo.png"
									alt="PHINMA Cagayan de Oro College Logo"
									className="object-contain w-12 h-12"
								/>
							</div>
							<h1 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-400 dark:via-emerald-400 dark:to-green-500">
								PHINMA
							</h1>
							<p className="text-green-600 dark:text-green-400">
								Cagayan de Oro College
							</p>
						</div>

						{/* Login Card */}
						<div className="p-6 bg-white rounded-3xl border border-green-100 shadow-2xl dark:bg-gray-800 dark:border-gray-700 sm:p-8">
							<div className="mb-8 text-center">
								<h2 className="mb-3 text-2xl font-bold text-green-900 dark:text-green-100 sm:text-3xl">
									Welcome Back
								</h2>
								<p className="text-sm text-green-600 dark:text-green-400 sm:text-md">
									Please sign in to your account
								</p>
							</div>

							{/* Error Message */}
							{error && (
								<div className="flex items-start p-4 mb-6 space-x-3 bg-red-50 rounded-2xl border border-red-200 dark:bg-red-900/20 dark:border-red-800">
									<AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-red-800 dark:text-red-300">
											Login Failed
										</p>
										<p className="text-sm text-red-700 dark:text-red-400">
											{error}
										</p>
									</div>
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="space-y-2">
									<Label
										htmlFor="username"
										className="text-sm font-semibold text-green-800 dark:text-green-300"
									>
										Username
									</Label>
									<div className="relative">
										<Input
											id="username"
											type="text"
											value={username}
											onChange={(e) => {
												setUsername(e.target.value);
												setError("");
											}}
											placeholder="Enter your username"
											className="px-4 py-4 pl-12 w-full placeholder-green-400 text-green-900 rounded-2xl border-2 border-green-200 transition-all duration-200 dark:placeholder-green-500 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 hover:border-green-300 dark:hover:border-gray-500"
											required
										/>
										<Mail className="absolute left-4 top-1/2 w-5 h-5 text-green-500 transform -translate-y-1/2 dark:text-green-400" />
									</div>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="password"
										className="text-sm font-semibold text-green-800 dark:text-green-300"
									>
										Password
									</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												setError("");
											}}
											placeholder="Enter your password"
											className="px-4 py-4 pr-12 pl-12 w-full placeholder-green-400 text-green-900 rounded-2xl border-2 border-green-200 transition-all duration-200 dark:placeholder-green-500 dark:text-green-100 dark:border-gray-600 bg-green-50/50 dark:bg-gray-700/50 focus:outline-none focus:ring-4 focus:ring-green-300/30 dark:focus:ring-green-500/30 focus:border-green-400 dark:focus:border-green-500 focus:bg-white dark:focus:bg-gray-700 hover:border-green-300 dark:hover:border-gray-500"
											required
										/>
										<LockKeyhole className="absolute left-4 top-1/2 w-5 h-5 text-green-500 transform -translate-y-1/2 dark:text-green-400" />
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-4 top-1/2 text-green-500 transition-colors transform -translate-y-1/2 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
										>
											{showPassword ? (
												<EyeOff className="w-5 h-5" />
											) : (
												<Eye className="w-5 h-5" />
											)}
										</button>
									</div>
								</div>

								{/* CAPTCHA Component */}
								{showCaptcha && (
									<div className="p-3 rounded-xl border-2 border-green-200 dark:border-gray-600 bg-green-50/30 dark:bg-gray-700/30">
										<Captcha
											onVerify={handleCaptchaVerify}
											error={captchaError}
										/>
									</div>
								)}

								<Button
									type="submit"
									className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-400/30 dark:focus:ring-green-500/30 ${
										showCaptcha && !captchaVerified
											? "bg-green-300 dark:bg-green-700 text-green-600 dark:text-green-300 cursor-not-allowed"
											: "bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 dark:from-green-600 dark:via-emerald-600 dark:to-green-700 text-white hover:from-green-800 hover:via-emerald-800 hover:to-green-900 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-green-800 shadow-xl hover:shadow-2xl"
									}`}
									disabled={isLoading || (showCaptcha && !captchaVerified)}
								>
									{isLoading ? (
										<div className="flex justify-center items-center space-x-3">
											<div className="w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent" />
											<span>Signing in...</span>
										</div>
									) : showCaptcha && !captchaVerified ? (
										"Complete CAPTCHA to Continue"
									) : showCaptcha && captchaVerified ? (
										<div className="flex justify-center items-center space-x-3">
											<span>Sign In</span>
											<ArrowRight className="w-4 h-4" />
										</div>
									) : (
										<div className="flex justify-center items-center space-x-3">
											<span>Sign In</span>
											<ArrowRight className="w-4 h-4" />
										</div>
									)}
								</Button>
							</form>

							<div className="mt-8 text-center">
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										setShowForgotPasswordModal(true);
									}}
									className="font-medium text-green-600 transition-colors dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline"
								>
									Forgot your password?
								</a>
							</div>
						</div>

						{/* Footer */}
						<div className="mt-8 text-center">
							<p className="text-sm text-green-600 dark:text-green-400">
								© 2025 PHINMA Cagayan de Oro College. All rights reserved.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Password Reset Modal for required reset */}
			{showPasswordResetModal && (
				<PasswordResetModal
					isOpen={showPasswordResetModal}
					onClose={() => {
						setShowPasswordResetModal(false);
						// Reset login form fields after password reset
						setUsername("");
						setPassword("");
						setError("");
						setShowCaptcha(false);
					}}
					username={username}
					isRequired={true}
				/>
			)}

			{/* Password Reset Modal for forgot password */}
			{showForgotPasswordModal && (
				<ForgotPasswordModal
					isOpen={showForgotPasswordModal}
					onClose={() => {
						setShowForgotPasswordModal(false);
						// Reset login form fields after password reset
						setUsername("");
						setPassword("");
						setError("");
					}}
					username={username}
					isRequired={false}
				/>
			)}
		</>
	);
}
