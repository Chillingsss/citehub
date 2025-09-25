import React from "react";
import { MapPin, Edit, Activity, Trash2, Clock } from "lucide-react";

// Convert 24h time to 12h format for display
const formatTime = (time24h) => {
	if (!time24h) return "";
	const [hours, minutes] = time24h.split(":");
	const hour = parseInt(hours);
	const ampm = hour >= 12 ? "PM" : "AM";
	const hour12 = hour % 12 || 12;
	return `${hour12}:${minutes} ${ampm}`;
};

const ActivityList = ({
	activities,
	selectedActivity,
	onActivityClick,
	onEditActivity,
	onDeleteActivity,
}) => {
	if (activities.length === 0) {
		return (
			<div className="flex flex-col justify-center items-center py-8 text-gray-500">
				<Activity className="mb-2 w-8 h-8" />
				<p className="text-sm text-center">No activities yet for this event</p>
				<p className="text-xs text-center text-gray-400">
					Click the + button above to add your first activity
				</p>
			</div>
		);
	}

	return (
		<>
			{activities.map((activity) => (
				<div
					key={activity.activity_id}
					className={`p-2 mb-1 rounded text-sm activity-item ${
						selectedActivity?.activity_id === activity.activity_id
							? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
							: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
					}`}
				>
					<div className="flex justify-between items-start">
						<div
							onClick={() => onActivityClick(activity)}
							className="flex-1 cursor-pointer"
						>
							<div className="flex items-center gap-2">
								<div className="font-medium">{activity.activity_name}</div>
								{activity.activity_isSpecial === 1 ? (
									<div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
										Special
									</div>
								) : (
									<div></div>
								)}
							</div>
							<div className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
								<MapPin className="w-3 h-3" />
								{activity.activity_location}
							</div>
							{(activity.activity_startTime || activity.activity_endTime) && (
								<div className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
									<Clock className="w-3 h-3" />
									{activity.activity_startTime && activity.activity_endTime
										? `${formatTime(
												activity.activity_startTime
										  )} - ${formatTime(activity.activity_endTime)}`
										: activity.activity_startTime
										? `Starts at ${formatTime(activity.activity_startTime)}`
										: `Ends at ${formatTime(activity.activity_endTime)}`}
								</div>
							)}
							<div className="text-xs text-gray-500 dark:text-gray-400">
								{activity.user_name}
							</div>
						</div>
						<div className="flex gap-1 items-center">
							<button
								onClick={(e) => {
									e.stopPropagation();
									onEditActivity(activity);
								}}
								className="p-1.5 text-gray-500 rounded hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
								title="Edit Activity"
							>
								<Edit className="w-4 h-4" />
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation();
									onDeleteActivity(activity);
								}}
								className="p-1.5 text-gray-500 rounded hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
								title="Delete Activity"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			))}
		</>
	);
};

export default ActivityList;
