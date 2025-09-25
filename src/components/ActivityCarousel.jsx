import React from "react";
import {
	Trophy,
	Calendar,
	MapPin,
	User,
	ChevronLeft,
	ChevronRight,
	AlertTriangle,
	Clock,
} from "lucide-react";

const ActivityCarousel = ({
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

	// Carousel navigation functions
	const goToPrevious = () => {
		setCurrentActivityIndex((prev) => Math.max(0, prev - itemsPerPage));
	};

	const goToNext = () => {
		const maxIndex = Math.max(0, activities.length - itemsPerPage);
		setCurrentActivityIndex((prev) => Math.min(maxIndex, prev + itemsPerPage));
	};

	const canGoPrevious = currentActivityIndex > 0;
	const canGoNext = currentActivityIndex + itemsPerPage < activities.length;

	const getVisibleActivities = () => {
		return activities.slice(
			currentActivityIndex,
			currentActivityIndex + itemsPerPage
		);
	};

	return (
		<div className="p-3 bg-white rounded-xl shadow-sm sm:p-4 dark:bg-gray-700">
			<div className="flex gap-3 items-center mb-3 sm:mb-4">
				<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
					<Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div className="flex-1">
					<h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-200">
						{isMobile ? "Activities" : "Activities"}
					</h3>
					{activities.length > 0 && (
						<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
							Showing {currentActivityIndex + 1}-
							{Math.min(currentActivityIndex + itemsPerPage, activities.length)}{" "}
							of {activities.length} activities
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
					<AlertTriangle className="w-10 h-10 text-yellow-500 sm:w-12 sm:h-12" />
					<div>
						<p className="font-medium text-gray-700 dark:text-gray-300">
							No Activities Available
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Activities will appear here when they are created by
							administrators
						</p>
					</div>
				</div>
			) : (
				<div className="relative">
					{/* Swipe hint for mobile */}
					{itemsPerPage === 1 && activities.length > 1 && (
						<div className="mb-3 text-center">
							<p className="text-xs text-gray-500 dark:text-gray-400">
								👆 Swipe left or right to manage different activities
							</p>
						</div>
					)}

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
								onClick={
									!isMobile ? () => setSelectedActivity(activity) : undefined
								}
								className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 relative ${
									selectedActivity?.activity_id === activity.activity_id
										? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
										: "border-gray-200 dark:border-gray-600"
								} ${
									!isMobile
										? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-500"
										: ""
								}`}
							>
								{selectedActivity?.activity_id === activity.activity_id &&
									isMobile && (
										<div className="absolute top-2 right-2">
											<div className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
												<div className="w-1.5 h-1.5 bg-white rounded-full"></div>
												Managing
											</div>
										</div>
									)}
								<h4
									className={`mb-2 text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 ${
										selectedActivity?.activity_id === activity.activity_id &&
										isMobile
											? "pr-20"
											: ""
									}`}
								>
									{activity.activity_name}
								</h4>
								<div className="space-y-1 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
									<div className="flex gap-2 items-center">
										<Calendar className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
										<span className="truncate">{activity.event_title}</span>
									</div>
									<div className="flex gap-2 items-center">
										<MapPin className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
										<span className="truncate">
											{activity.activity_location}
										</span>
									</div>
									{(activity.activity_startTime ||
										activity.activity_endTime) && (
										<div className="flex gap-2 items-center">
											<Clock className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
											<span className="truncate">
												{activity.activity_startTime &&
												activity.activity_endTime
													? `${formatTime(
															activity.activity_startTime
													  )} - ${formatTime(activity.activity_endTime)}`
													: activity.activity_startTime
													? `Starts at ${formatTime(
															activity.activity_startTime
													  )}`
													: `Ends at ${formatTime(activity.activity_endTime)}`}
											</span>
										</div>
									)}
									<div className="flex gap-2 items-center">
										<User className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
										<span className="truncate">{activity.user_name}</span>
									</div>
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

export default ActivityCarousel;
