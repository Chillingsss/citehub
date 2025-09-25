import React from "react";

const TopThreeTribes = ({ tribes, eventTitle }) => {
	if (!tribes || tribes.length === 0) return null;

	const topThreeTribes = tribes.filter((tribe) => tribe.rank <= 3).slice(0, 3);

	if (topThreeTribes.length === 0) return null;

	return (
		<div className="mb-6">
			<div className="flex flex-col gap-1 mb-3">
				<h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
					🏆 Top 3 Tribes
				</h3>
				{eventTitle && (
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Event: {eventTitle}
					</p>
				)}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{topThreeTribes.map((tribe) => (
					<div
						key={tribe.tribe_id}
						className={`p-4 rounded-lg border shadow-sm ${
							tribe.rank === 1
								? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30"
								: tribe.rank === 2
								? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800/30"
								: "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
						}`}
					>
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-2">
								<span className="text-lg font-bold">
									{tribe.rank === 1 ? "🥇" : tribe.rank === 2 ? "🥈" : "🥉"}
								</span>
								<h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
									{tribe.tribe_name}
								</h4>
							</div>
							<div>
								<div className="text-xl font-bold text-green-600 dark:text-green-400">
									{tribe.display_points || tribe.total_points || 0} points
									{tribe.special_bonus > 0 && (
										<span className="ml-1 text-sm text-yellow-600 dark:text-yellow-400">
											(+{tribe.special_bonus} bonus)
										</span>
									)}
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									{tribe.total_scores || 0} activities
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TopThreeTribes;
