import React from "react";
import { Trophy, Edit, Activity, Users, User, Trash2 } from "lucide-react";

const PointRuleList = ({
	pointRules,
	selectedActivity,
	onEditPointRule,
	onDeletePointRule,
}) => {
	if (!selectedActivity) {
		return (
			<div className="flex flex-col justify-center items-center h-full text-gray-500">
				<Activity className="mb-4 w-12 h-12" />
				<p>Select an activity to view point rules</p>
			</div>
		);
	}

	if (pointRules.length === 0) {
		return (
			<div className="flex flex-col justify-center items-center h-full text-gray-500">
				<Trophy className="mb-4 w-12 h-12" />
				<p>No point rules found for this activity</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{pointRules.map((rule) => {
				const allowsMultiple =
					rule.pointrules_all === 1 || rule.pointrules_all === true;

				return (
					<div
						key={rule.pointrules_id}
						className={`flex justify-between items-center p-4 rounded-lg border-2 ${
							allowsMultiple
								? "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
								: "bg-green-50 border-green-200 dark:bg-gray-700 dark:border-gray-600"
						}`}
					>
						<div className="flex gap-3 items-center">
							{/* Icon indicator */}
							<div
								className={`p-2 rounded-lg ${
									allowsMultiple
										? "text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
										: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
								}`}
							>
								{allowsMultiple ? (
									<Users className="w-4 h-4" />
								) : (
									<User className="w-4 h-4" />
								)}
							</div>

							<div>
								<h4 className="font-medium text-gray-800 dark:text-gray-200">
									{rule.pointrules_place}
								</h4>
								<p
									className={`text-xs ${
										allowsMultiple
											? "text-gray-500 dark:text-gray-400"
											: "text-green-600 dark:text-green-400"
									}`}
								>
									{allowsMultiple
										? "Multiple tribes allowed"
										: "Single tribe only"}
								</p>
							</div>
						</div>

						<div className="flex gap-3 items-center">
							<div className="text-right">
								<span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
									{rule.pointrules_points}
								</span>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									points
								</p>
							</div>
							<div className="flex gap-1 items-center">
								<button
									onClick={() => onEditPointRule(rule)}
									className="p-1 text-gray-500 rounded hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
									title="Edit Point Rule"
								>
									<Edit className="w-4 h-4" />
								</button>
								<button
									onClick={() => onDeletePointRule(rule)}
									className="p-1 text-gray-500 rounded hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
									title="Delete Point Rule"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default PointRuleList;
