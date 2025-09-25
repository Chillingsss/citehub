import React, { useState, useEffect } from "react";

const EventForm = ({
	eventForm,
	setEventForm,
	onSubmit,
	onCancel,
	isEditing = false,
}) => {
	const [errors, setErrors] = useState({});
	const [touched, setTouched] = useState({});

	// Validation function
	const validateForm = () => {
		const newErrors = {};

		// Title validation
		if (!eventForm.title?.trim()) {
			newErrors.title = "Event title is required";
		}

		// Start date validation
		if (!eventForm.startDate) {
			newErrors.startDate = "Start date is required";
		} else {
			const startDate = new Date(eventForm.startDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (startDate < today) {
				newErrors.startDate = "Start date cannot be in the past";
			}
		}

		// End date validation
		if (!eventForm.endDate) {
			newErrors.endDate = "End date is required";
		} else if (eventForm.startDate && eventForm.endDate) {
			const startDate = new Date(eventForm.startDate);
			const endDate = new Date(eventForm.endDate);

			if (endDate < startDate) {
				newErrors.endDate = "End date cannot be before start date";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle form submission
	const handleSubmit = (e) => {
		e.preventDefault();
		if (validateForm()) {
			onSubmit(e);
		}
	};

	// Handle input blur (mark as touched)
	const handleBlur = (field) => {
		setTouched((prev) => ({ ...prev, [field]: true }));
	};

	// Handle input change with validation
	const handleInputChange = (field, value) => {
		setEventForm({ ...eventForm, [field]: value });

		// Clear error when user starts typing/selecting
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	// Validate on form change
	useEffect(() => {
		if (Object.keys(touched).length > 0) {
			validateForm();
		}
	}, [eventForm, touched]);

	// Check if form is complete and valid
	const isFormValid = () => {
		return (
			eventForm.title?.trim() &&
			eventForm.startDate &&
			eventForm.endDate &&
			Object.keys(errors).length === 0
		);
	};

	// Get input border color based on validation state
	const getInputBorderColor = (field) => {
		if (errors[field] && touched[field]) {
			return "border-red-500 focus:border-red-500 focus:ring-red-500";
		}
		return "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500";
	};

	return (
		<form onSubmit={handleSubmit} className="mb-4 space-y-4">
			{/* Event Title */}
			<div className="space-y-1">
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Event Title <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					placeholder="Enter event title"
					value={eventForm.title || ""}
					onChange={(e) => handleInputChange("title", e.target.value)}
					onBlur={() => handleBlur("title")}
					className={`p-3 w-full rounded-lg border transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${getInputBorderColor(
						"title"
					)}`}
				/>
				{errors.title && touched.title && (
					<p className="text-sm text-red-500 flex items-center gap-1">
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						{errors.title}
					</p>
				)}
			</div>

			{/* Start Date */}
			<div className="space-y-1">
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Start Date <span className="text-red-500">*</span>
				</label>
				<div className="relative">
					<input
						type="date"
						value={eventForm.startDate || ""}
						onChange={(e) => handleInputChange("startDate", e.target.value)}
						onBlur={() => handleBlur("startDate")}
						min={new Date().toISOString().split("T")[0]} // Today's date as minimum
						step="1"
						className={`p-3 w-full rounded-lg border transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${getInputBorderColor(
							"startDate"
						)}`}
						placeholder="Select start date"
					/>
				</div>
				{errors.startDate && touched.startDate && (
					<p className="text-sm text-red-500 flex items-center gap-1">
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						{errors.startDate}
					</p>
				)}
				<p className="text-xs text-gray-500 dark:text-gray-400">
					Click to open calendar picker or type YYYY-MM-DD
				</p>
			</div>

			{/* End Date */}
			<div className="space-y-1">
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
					End Date <span className="text-red-500">*</span>
				</label>
				<div className="relative">
					<input
						type="date"
						value={eventForm.endDate || ""}
						onChange={(e) => handleInputChange("endDate", e.target.value)}
						onBlur={() => handleBlur("endDate")}
						min={eventForm.startDate || new Date().toISOString().split("T")[0]} // Start date or today as minimum
						step="1"
						className={`p-3 w-full rounded-lg border transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${getInputBorderColor(
							"endDate"
						)}`}
						placeholder="Select end date"
					/>
				</div>
				{errors.endDate && touched.endDate && (
					<p className="text-sm text-red-500 flex items-center gap-1">
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						{errors.endDate}
					</p>
				)}
				<p className="text-xs text-gray-500 dark:text-gray-400">
					Click to open calendar picker or type YYYY-MM-DD
				</p>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3 pt-2">
				<button
					type="submit"
					disabled={!isFormValid()}
					className={`flex-1 p-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
						isFormValid()
							? "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer"
							: "text-gray-400 bg-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500"
					}`}
				>
					{isEditing ? "Update Event" : "Add Event"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 p-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
				>
					Cancel
				</button>
			</div>
		</form>
	);
};

export default EventForm;
