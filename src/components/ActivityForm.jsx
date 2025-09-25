import React from "react";
import { Select } from "./ui/select";

const ActivityForm = ({
	activityForm,
	setActivityForm,
	scorekeepers,
	onSubmit,
	onCancel,
	isEditing = false,
}) => {
	// Convert time to HTML time input format (HH:mm)
	const toTimeInputFormat = (time24h) => {
		if (!time24h) return "";

		// Remove any leading/trailing whitespace
		time24h = time24h.trim();

		// If empty after trim, return empty string
		if (!time24h) return "";

		try {
			// Extract just the HH:mm part if it's a full datetime string
			const timeMatch = time24h.match(/(\d{1,2}):(\d{2})/);
			if (timeMatch) {
				const [_, hours, minutes] = timeMatch;
				const formattedHours = hours.toString().padStart(2, "0");
				const formattedMinutes = minutes.toString().padStart(2, "0");
				return `${formattedHours}:${formattedMinutes}`;
			}
			return "";
		} catch (error) {
			console.error("Error formatting time:", error);
			return "";
		}
	};

	// Handle time change
	const handleTimeChange = (type, timeValue) => {
		// Ensure the time value is in HH:mm format
		const formattedTime = timeValue
			? timeValue.match(/\d{2}:\d{2}/)?.[0] || ""
			: "";

		setActivityForm((prev) => ({
			...prev,
			[type]: formattedTime,
		}));
	};

	return (
		<form onSubmit={onSubmit} className="mb-3 space-y-2">
			<input
				type="text"
				placeholder="Activity Name"
				value={activityForm.name}
				onChange={(e) =>
					setActivityForm({
						...activityForm,
						name: e.target.value,
					})
				}
				className="p-2 w-full text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
			/>
			<textarea
				placeholder="Description"
				value={activityForm.description}
				onChange={(e) =>
					setActivityForm({
						...activityForm,
						description: e.target.value,
					})
				}
				className="p-2 w-full text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
				rows="2"
			/>
			<input
				type="text"
				placeholder="Location"
				value={activityForm.location}
				onChange={(e) =>
					setActivityForm({
						...activityForm,
						location: e.target.value,
					})
				}
				className="p-2 w-full text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
			/>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
						Start Time
					</label>
					<input
						type="time"
						value={toTimeInputFormat(activityForm.startTime) || ""}
						onChange={(e) => handleTimeChange("startTime", e.target.value)}
						className="p-2 w-full text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
						End Time
					</label>
					<input
						type="time"
						value={toTimeInputFormat(activityForm.endTime) || ""}
						onChange={(e) => handleTimeChange("endTime", e.target.value)}
						className="p-2 w-full text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
					/>
				</div>
			</div>
			<Select
				value={activityForm.scorekeeperId}
				onValueChange={(value) =>
					setActivityForm({
						...activityForm,
						scorekeeperId: value,
					})
				}
				options={scorekeepers.map((scorekeeper) => ({
					value: scorekeeper.user_id,
					label: scorekeeper.user_name,
				}))}
				placeholder="Select Scorekeeper"
				searchPlaceholder="Search scorekeepers..."
			/>

			{/* Special Activity Toggle */}
			<div className="flex items-center justify-between p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
						Special Activity
					</span>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						(Receives bonus points for tie-breaking)
					</span>
				</div>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						checked={activityForm.isSpecial || false}
						onChange={(e) =>
							setActivityForm({
								...activityForm,
								isSpecial: e.target.checked,
							})
						}
						className="sr-only peer"
					/>
					<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
				</label>
			</div>

			<div className="flex gap-2">
				<button
					type="submit"
					className="flex-1 p-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
				>
					{isEditing ? "Update" : "Add"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 p-2 text-sm text-gray-700 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
				>
					Cancel
				</button>
			</div>
		</form>
	);
};

export default ActivityForm;
