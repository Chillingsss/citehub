import React from "react";
import {
	Trophy,
	Calendar,
	MapPin,
	ChevronLeft,
	ChevronRight,
	Users,
	Clock,
} from "lucide-react";

const SboActivityCarousel = ({
	activities,
	selectedActivity,
	setSelectedActivity,
	currentActivityIndex,
	setCurrentActivityIndex,
	itemsPerPage,
	isMobile,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	goToPrevious,
	goToNext,
	canGoPrevious,
	canGoNext,
	getVisibleActivities,
	onManageStudents,
	onEventClick,
}) => {
	// Convert 24h time to 12h format for display
	const formatTime = (time24h) => {
		if (!time24h) return "";
		const [hours, minutes] = time24h.split(":");
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	};

	// Format time range for display
	const formatTimeRange = (startTime, endTime) => {
		if (!startTime && !endTime) return "";
		if (startTime && endTime) {
			return `${formatTime(startTime)} - ${formatTime(endTime)}`;
		}
		if (startTime) return `Start: ${formatTime(startTime)}`;
		if (endTime) return `End: ${formatTime(endTime)}`;
		return "";
	};
	return (
		<div className="p-3 bg-white rounded-xl shadow-sm sm:p-4 dark:bg-gray-700">
			{/* Header with Navigation */}
			<div className="flex gap-3 justify-between items-center mb-4">
				<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
					<Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div className="flex-1">
					<h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-200">
						{isMobile ? "Browse Activities" : "Select Activity"}
					</h3>
					{activities.length > 0 && (
						<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
							Showing {currentActivityIndex + 1}-
							{Math.min(currentActivityIndex + itemsPerPage, activities.length)}{" "}
							of {activities.length} activities
							{isMobile
								? " • Auto-managing scores"
								: " • Click to manage scores"}
						</p>
					)}
				</div>
				{/* Navigation Controls */}
				{activities.length > itemsPerPage && (
					<div className="flex gap-1 sm:gap-2">
						<button
							onClick={goToPrevious}
							disabled={!canGoPrevious}
							className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
								canGoPrevious
									? "text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
									: "text-gray-400 border-gray-200 cursor-not-allowed dark:border-gray-600 dark:text-gray-500"
							}`}
							title="Previous activities"
						>
							<ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
						</button>
						<button
							onClick={goToNext}
							disabled={!canGoNext}
							className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
								canGoNext
									? "text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
									: "text-gray-400 border-gray-200 cursor-not-allowed dark:border-gray-600 dark:text-gray-500"
							}`}
							title="Next activities"
						>
							<ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
						</button>
					</div>
				)}
			</div>

			{activities.length === 0 ? (
				<div className="flex flex-col gap-3 justify-center items-center py-6 text-center sm:py-8">
					<div className="p-3 bg-gray-100 rounded-full dark:bg-gray-600">
						<Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
					</div>
					<div>
						<h3 className="text-base font-medium text-gray-800 sm:text-lg dark:text-gray-200">
							No Activities Found
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							You are not assigned as a scorekeeper for any activities yet.
						</p>
					</div>
				</div>
			) : (
				<div>
					{/* Activity Grid */}
					<div
						className={`grid gap-3 ${
							itemsPerPage === 1
								? "grid-cols-1"
								: itemsPerPage === 2
								? "grid-cols-1 sm:grid-cols-2"
								: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
						}`}
						onTouchStart={onTouchStart}
						onTouchMove={onTouchMove}
						onTouchEnd={onTouchEnd}
					>
						{getVisibleActivities().map((activity, index) => (
							<div
								key={activity.activity_id}
								className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 relative ${
									selectedActivity?.activity_id === activity.activity_id
										? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
										: "border-gray-200 dark:border-gray-600"
								}`}
							>
								{/* Activity Header */}
								<div className="flex justify-between items-start gap-3 mb-2">
									<h4 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 truncate">
										{activity.activity_name}
									</h4>
									{/* Manage Students Button */}
									<button
										onClick={(e) => {
											e.stopPropagation();
											onManageStudents(activity);
										}}
										className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 whitespace-nowrap flex-shrink-0"
										title="Manage student participation"
									>
										<Users className="w-3 h-3" />
										<span className="hidden sm:inline">Students</span>
									</button>
								</div>

								{/* Activity Details */}
								<div
									onClick={
										!isMobile ? () => setSelectedActivity(activity) : undefined
									}
									className={`space-y-1 text-xs text-gray-600 sm:text-sm dark:text-gray-400 ${
										!isMobile ? "cursor-pointer" : ""
									}`}
								>
									<div className="flex gap-2 items-center">
										<Calendar className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
										<button
											className="truncate text-blue-600 hover:underline dark:text-blue-400"
											onClick={(e) => {
												e.stopPropagation();
												if (onEventClick) onEventClick(activity.event_title);
											}}
											title="Filter by this event"
										>
											{activity.event_title}
										</button>
									</div>
									<div className="flex gap-2 items-center">
										<MapPin className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
										<span className="truncate">
											{activity.activity_location}
										</span>
									</div>
									{/* Time Display */}
									{formatTimeRange(
										activity.activity_startTime,
										activity.activity_endTime
									) && (
										<div className="flex gap-2 items-center">
											<Clock className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
											<span className="truncate text-green-600 dark:text-green-400">
												{formatTimeRange(
													activity.activity_startTime,
													activity.activity_endTime
												)}
											</span>
										</div>
									)}
								</div>
								<p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
									{activity.activity_description}
								</p>
							</div>
						))}
					</div>

					{/* Mobile Navigation Dots */}
					{activities.length > itemsPerPage && itemsPerPage === 1 && (
						<div className="flex gap-2 justify-center mt-4">
							{Array.from({
								length: Math.ceil(activities.length / itemsPerPage),
							}).map((_, index) => (
								<button
									key={index}
									onClick={() => setCurrentActivityIndex(index * itemsPerPage)}
									className={`w-3 h-3 rounded-full transition-colors touch-manipulation ${
										Math.floor(currentActivityIndex / itemsPerPage) === index
											? "bg-blue-600 dark:bg-blue-400"
											: "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
									}`}
									aria-label={`Go to activity page ${index + 1}`}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default SboActivityCarousel;
