import React from "react";
import { ChevronDown, ChevronUp, Award, Users, Calendar } from "lucide-react";

const CompleteTribeRankings = ({
	tribes,
	selectedTribeIds,
	onTribeClick,
	tribeActivities,
	loadingActivities,
	eventTitle,
}) => {
	const getRankText = (rank) => {
		if (rank === 1) return "1st Place";
		if (rank === 2) return "2nd Place";
		if (rank === 3) return "3rd Place";
		return `${rank}${
			rank === 11 || rank === 12 || rank === 13
				? "th"
				: rank % 10 === 1
				? "st"
				: rank % 10 === 2
				? "nd"
				: rank % 10 === 3
				? "rd"
				: "th"
		} Place`;
	};

	// Check if tribes have no scores (no ranking data)
	const hasNoScores = tribes.length > 0 && tribes[0].rank === null;

	return (
		<div>
			<div className="flex flex-col gap-1 mb-4">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
					📊 Complete Tribe Rankings
				</h3>
				{eventTitle && (
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Event: {eventTitle}
					</p>
				)}
			</div>

			{hasNoScores ? (
				<div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
					<div className="p-8 text-center">
						<div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
							<Users className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
							No Rankings Available
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mb-6">
							There are currently no scores recorded in the system. Rankings
							will appear once activities are scored.
						</p>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-800">
									<tr>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
											Tribe Name
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
											Status
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
									{tribes.map((tribe) => (
										<React.Fragment key={tribe.tribe_id}>
											<tr
												onClick={() => onTribeClick(tribe.tribe_id)}
												className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<div className="text-sm font-medium text-gray-900 dark:text-gray-200">
															{tribe.tribe_name}
														</div>
														{selectedTribeIds.has(tribe.tribe_id) ? (
															<ChevronUp className="w-4 h-4 text-gray-500" />
														) : (
															<ChevronDown className="w-4 h-4 text-gray-500" />
														)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<Users className="mr-2 w-4 h-4 text-gray-400" />
														<span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
															No Scores
														</span>
													</div>
												</td>
											</tr>
											{selectedTribeIds.has(tribe.tribe_id) && (
												<tr>
													<td
														colSpan="2"
														className="px-6 py-4 bg-gray-50 dark:bg-gray-800"
													>
														<div className="space-y-4">
															<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
																Activity History
															</h4>
															{loadingActivities[tribe.tribe_id] ? (
																<div className="flex justify-center py-4">
																	<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
																</div>
															) : !tribeActivities[tribe.tribe_id] ||
															  tribeActivities[tribe.tribe_id].length === 0 ? (
																<p className="text-sm text-gray-500 dark:text-gray-400">
																	No activities found for this tribe.
																</p>
															) : (
																<div className="space-y-3">
																	{tribeActivities[tribe.tribe_id].map(
																		(activity, index) => (
																			<div
																				key={index}
																				className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
																			>
																				<div className="flex justify-between items-start">
																					<div>
																						<h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
																							{activity.activity_name}
																						</h5>
																						<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
																							{activity.activity_description}
																						</p>
																					</div>
																					<div className="text-right">
																						<div className="text-sm font-semibold text-green-600 dark:text-green-400">
																							{activity.pointrules_points} pts
																						</div>
																						<div className="text-xs text-gray-500 dark:text-gray-400">
																							{activity.pointrules_place === 1
																								? "1st"
																								: activity.pointrules_place ===
																								  2
																								? "2nd"
																								: activity.pointrules_place ===
																								  3
																								? "3rd"
																								: `${activity.pointrules_place}`}{" "}
																						</div>
																					</div>
																				</div>
																				<div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
																					<Calendar className="mr-1 w-3 h-3" />
																					{new Date(
																						activity.score_createdAt
																					).toLocaleDateString()}
																				</div>
																			</div>
																		)
																	)}
																</div>
															)}
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			) : (
				<div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 dark:bg-gray-800">
								<tr>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
										Rank
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
										Tribe Name
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
										Total Points (with Bonus)
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
										Activities
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
								{tribes.map((tribe) => (
									<React.Fragment key={tribe.tribe_id}>
										<tr
											onClick={() => onTribeClick(tribe.tribe_id)}
											className={`hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer ${
												tribe.rank <= 3
													? "bg-gray-50 dark:bg-gray-800"
													: "bg-gray-50 dark:bg-gray-800"
											}`}
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<span className="font-medium text-gray-900 dark:text-gray-200">
														{getRankText(tribe.rank)}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<div className="text-sm font-medium text-gray-900 dark:text-gray-200">
														{tribe.tribe_name}
													</div>
													{selectedTribeIds.has(tribe.tribe_id) ? (
														<ChevronUp className="w-4 h-4 text-gray-500" />
													) : (
														<ChevronDown className="w-4 h-4 text-gray-500" />
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-bold text-green-600 dark:text-green-400">
													{tribe.display_points || tribe.total_points || 0} pts
													{tribe.special_bonus > 0 && (
														<span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">
															(+{tribe.special_bonus} bonus)
														</span>
													)}
												</div>
												{tribe.tied_with && tribe.tied_with.length > 0 && (
													<div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
														On the same score as: {tribe.tied_with.join(", ")}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-500 dark:text-gray-400">
													{tribe.total_scores || 0} activities
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													{tribe.rank <= 3 ? (
														<Award className="mr-2 w-4 h-4 text-yellow-500" />
													) : (
														<Users className="mr-2 w-4 h-4 text-gray-400" />
													)}
													<span
														className={`text-xs font-medium px-2 py-1 rounded-full ${
															tribe.rank === 1
																? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
																: tribe.rank === 2
																? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
																: tribe.rank === 3
																? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
																: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
														}`}
													>
														{tribe.rank === 1
															? "Champion"
															: tribe.rank === 2
															? "Runner-up"
															: tribe.rank === 3
															? "3rd Place"
															: "Competing"}
													</span>
												</div>
											</td>
										</tr>
										{selectedTribeIds.has(tribe.tribe_id) && (
											<tr>
												<td
													colSpan="5"
													className="px-6 py-4 bg-gray-50 dark:bg-gray-800"
												>
													<div className="space-y-4">
														<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
															Activity History
														</h4>
														{loadingActivities[tribe.tribe_id] ? (
															<div className="flex justify-center py-4">
																<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
															</div>
														) : !tribeActivities[tribe.tribe_id] ||
														  tribeActivities[tribe.tribe_id].length === 0 ? (
															<p className="text-sm text-gray-500 dark:text-gray-400">
																No activities found for this tribe.
															</p>
														) : (
															<div className="space-y-3">
																{tribeActivities[tribe.tribe_id].map(
																	(activity, index) => (
																		<div
																			key={index}
																			className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
																		>
																			<div className="flex justify-between items-start">
																				<div>
																					<h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
																						{activity.activity_name}
																					</h5>
																					<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
																						{activity.activity_description}
																					</p>
																				</div>
																				<div className="text-right">
																					<div className="text-sm font-semibold text-green-600 dark:text-green-400">
																						{activity.pointrules_points} pts
																					</div>
																					<div className="text-xs text-gray-500 dark:text-gray-400">
																						{activity.pointrules_place === 1
																							? "1st"
																							: activity.pointrules_place === 2
																							? "2nd"
																							: activity.pointrules_place === 3
																							? "3rd"
																							: `${activity.pointrules_place}`}{" "}
																					</div>
																				</div>
																			</div>
																			<div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
																				<Calendar className="mr-1 w-3 h-3" />
																				{new Date(
																					activity.score_createdAt
																				).toLocaleDateString()}
																			</div>
																		</div>
																	)
																)}
															</div>
														)}
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
};

export default CompleteTribeRankings;
