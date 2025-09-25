import React from "react";
import { Trophy, Users } from "lucide-react";

const TribeSummaryStats = ({ tribes }) => {
	const totalActivities = tribes.reduce(
		(sum, tribe) => sum + (tribe.total_scores || 0),
		0
	);

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
				<div className="flex items-center">
					<div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
						<Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Total Tribes
						</p>
						<p className="text-2xl font-semibold text-gray-900 dark:text-gray-200">
							{tribes.length}
						</p>
					</div>
				</div>
			</div>
			<div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
				<div className="flex items-center">
					<div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
						<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
					</div>
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Total Activities
						</p>
						<p className="text-2xl font-semibold text-gray-900 dark:text-gray-200">
							{totalActivities}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TribeSummaryStats;
