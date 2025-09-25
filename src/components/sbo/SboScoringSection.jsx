import React from "react";
import { Trash2, X, Clock } from "lucide-react";

const SboScoringSection = ({
	selectedActivity,
	loading,
	scores,
	handleRemoveScore,
	getAvailablePointRules,
	getParticipationPointRule,
	hasAnyPointRules,
	setSelectedPointRule,
	setShowTribeSelector,
	showTribeSelector,
	selectedPointRule,
	setSelectedTribe,
	setSelectedTribesForParticipation,
	selectedTribesForParticipation,
	getAvailableTribesForParticipation,
	getAvailableTribes,
	handleAddScore,
	handleSaveParticipationScores,
	allowsMultipleTribes, // Add this prop
	pointRules, // Add this prop
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
		<div className="p-4 bg-white rounded-xl shadow-sm lg:p-6 dark:bg-gray-700">
			{/* Activity Header */}
			<div className="pb-4 mb-6 border-b dark:border-gray-600">
				<h3 className="text-lg font-bold text-gray-800 lg:text-xl dark:text-gray-200">
					{selectedActivity.activity_name}
				</h3>
				<p className="text-sm text-gray-600 lg:text-base dark:text-gray-400">
					{selectedActivity.activity_description}
				</p>
				<div className="flex flex-col gap-2 mt-2 text-sm text-gray-500 sm:flex-row sm:gap-4 dark:text-gray-400">
					<span>📍 {selectedActivity.activity_location}</span>
					<span>🎯 {selectedActivity.event_title}</span>
					{/* Time Display */}
					{formatTimeRange(
						selectedActivity.activity_startTime,
						selectedActivity.activity_endTime
					) && (
						<div className="flex gap-1 items-center">
							<Clock className="w-4 h-4" />
							<span className="text-green-600 dark:text-green-400">
								{formatTimeRange(
									selectedActivity.activity_startTime,
									selectedActivity.activity_endTime
								)}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Scores Content */}
			<div className="space-y-6">
				{loading ? (
					<div className="flex justify-center items-center h-32">
						<div className="text-gray-500 dark:text-gray-400">Loading...</div>
					</div>
				) : (
					<>
						{/* Current Scores */}
						{scores.length > 0 && (
							<div>
								<h4 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
									Current Scores
								</h4>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
									{scores.map((score) => {
										return (
											<div
												key={score.score_id}
												className="relative p-4 bg-green-50 rounded-lg border-2 border-green-200 shadow-sm dark:bg-gray-800 dark:border-gray-600"
											>
												<div className="flex justify-between items-start mb-3">
													<div className="flex flex-col gap-1">
														<div className="inline-block px-2 py-1 text-xs font-medium text-white bg-green-500 rounded dark:bg-green-700">
															{score.pointrules_place}
														</div>
														<div className="text-lg font-bold text-green-800 dark:text-gray-200">
															{score.pointrules_points} pts
														</div>
													</div>
													<button
														onClick={() => handleRemoveScore(score.score_id)}
														className="p-1.5 text-red-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/20"
														title="Remove score"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>

												<div className="mb-1 text-base font-semibold text-gray-800 dark:text-gray-200">
													{score.tribe_name}
												</div>
												<div className="text-xs text-gray-600 dark:text-gray-400">
													Scored by: {score.user_name}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Point Rules Selection */}
						<div>
							<h4 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
								Select Place to Score
							</h4>

							{/* Participation Scoring Summary */}
							{(() => {
								const participationRule = getParticipationPointRule();
								const availableTribesForParticipation =
									getAvailableTribesForParticipation();
								const tribesWithParticipationScores = scores.filter((score) => {
									const pointRule = pointRules?.find(
										(pr) => pr.pointrules_id === score.score_pointruleId
									);
									return (
										pointRule &&
										(pointRule.pointrules_all === 1 ||
											pointRule.pointrules_all === true)
									);
								});

								if (
									participationRule &&
									availableTribesForParticipation.length > 0
								) {
									return (
										<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
											<div className="flex items-center gap-2 mb-2">
												<span className="text-blue-600 dark:text-blue-400">
													📊
												</span>
												<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
													Participation Scoring Available
												</span>
											</div>
											<div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
												<p>
													<strong>
														{availableTribesForParticipation.length}
													</strong>{" "}
													tribes available for participation points
												</p>
												{tribesWithParticipationScores.length > 0 && (
													<p>
														<strong>
															{tribesWithParticipationScores.length}
														</strong>{" "}
														tribes already have participation scores
													</p>
												)}
												<p className="text-blue-600 dark:text-blue-400">
													💡 Only tribes with no scores can receive
													participation points
												</p>
											</div>
										</div>
									);
								}
								return null;
							})()}

							{!hasAnyPointRules() ? (
								/* No Point Rules Configured At All - Show Professional Notice */
								<div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
									<div className="flex gap-3 items-start">
										<div className="flex-shrink-0">
											<div className="flex justify-center items-center w-10 h-10 bg-amber-100 rounded-full dark:bg-amber-800/50">
												<svg
													className="w-5 h-5 text-amber-600 dark:text-amber-400"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
										</div>
										<div className="flex-1">
											<h5 className="mb-2 text-base font-semibold text-amber-800 dark:text-amber-200">
												No Point Rules Configured
											</h5>
											<p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
												This activity does not have any point rules set up for
												scoring. Point rules define the places (1st, 2nd, 3rd,
												etc.) and their corresponding point values.
											</p>
											<div className="p-3 bg-amber-100 rounded-md dark:bg-amber-800/30">
												<p className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-200">
													📋 Action Required:
												</p>
												<p className="text-sm text-amber-700 dark:text-amber-300">
													Please contact the{" "}
													<strong>Activity Management</strong> or{" "}
													<strong>System Administrator</strong> to configure
													point rules for "
													<strong>{selectedActivity.activity_name}</strong>"
													before scoring can begin.
												</p>
											</div>
										</div>
									</div>
								</div>
							) : getAvailablePointRules().length === 0 &&
							  getAvailableTribesForParticipation().length === 0 ? (
								/* All Point Rules Used and No Tribes Available for Participation */
								<div className="p-6 bg-green-50 rounded-lg border-2 border-green-200 dark:bg-green-900/20 dark:border-green-700">
									<div className="flex gap-3 items-start">
										<div className="flex-shrink-0">
											<div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-full dark:bg-green-800/50">
												<svg
													className="w-5 h-5 text-green-600 dark:text-green-400"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
										</div>
										<div className="flex-1">
											<h5 className="mb-2 text-base font-semibold text-green-800 dark:text-green-200">
												All Scoring Complete
											</h5>
											<p className="text-sm text-green-700 dark:text-green-300">
												All available point places have been assigned and all
												tribes have received scores for this activity. Scoring
												is complete!
											</p>
										</div>
									</div>
								</div>
							) : (
								/* Show Available Point Rules */
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
									{/* All Point Rules - no special treatment for participation */}
									{getAvailablePointRules().map((rule, index) => {
										// Use gray styling for multiple tribe rules, green for single tribe rules
										const isMultipleTribeRule = allowsMultipleTribes(rule);
										const cardStyle = isMultipleTribeRule
											? {
													bgColor: "bg-gray-50 hover:bg-gray-100",
													borderColor: "border-gray-200 hover:border-gray-300",
													textColor: "text-gray-800",
													badgeColor: "bg-gray-100 text-gray-800",
											  }
											: {
													bgColor: "bg-green-50 hover:bg-green-100",
													borderColor:
														"border-green-200 hover:border-green-300",
													textColor: "text-green-800",
													badgeColor: "bg-green-100 text-green-800",
											  };

										return (
											<button
												key={rule.pointrules_id}
												onClick={() => {
													console.log("Point rule selected:", rule);
													setSelectedPointRule(rule);
													setShowTribeSelector(true);
												}}
												className={`relative rounded-lg border-2 transition-all duration-200 hover:shadow-md ${cardStyle.bgColor} ${cardStyle.borderColor} dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500`}
											>
												<div className="p-4">
													{/* Content */}
													<div className="text-left">
														<div className="mb-2">
															<div
																className={`inline-block px-2 py-1 text-xs font-medium rounded ${cardStyle.badgeColor} dark:bg-gray-700 dark:text-gray-300`}
															>
																{rule.pointrules_place}
															</div>
														</div>

														<div
															className={`text-xl font-bold mb-1 ${cardStyle.textColor} dark:text-gray-200`}
														>
															{rule.pointrules_points} pts
														</div>

														<div className="text-xs text-gray-600 dark:text-gray-400">
															{isMultipleTribeRule
																? "Click to select multiple tribes"
																: "Click to assign to a tribe"}
														</div>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* Tribe Selector */}
						{showTribeSelector && (
							<div className="p-4 bg-white rounded-lg border shadow-lg dark:bg-gray-800 dark:border-gray-600">
								<div className="flex justify-between items-start mb-4">
									<div className="flex-1">
										<h4 className="text-base font-semibold text-gray-800 lg:text-lg dark:text-gray-200">
											Select Tribe for {selectedPointRule?.pointrules_place}
										</h4>
										{allowsMultipleTribes(selectedPointRule) && (
											<div className="mt-2 space-y-1">
												<p className="text-xs text-gray-600 lg:text-sm dark:text-gray-400">
													You can select multiple tribes for this scoring rule
												</p>
												<div className="p-2 bg-blue-50 rounded-md dark:bg-blue-900/20">
													<p className="text-xs text-blue-700 dark:text-blue-300">
														💡 <strong>Note:</strong> Tribes with participation
														scores cannot be selected again. Only tribes with no
														scores are available for participation points.
													</p>
												</div>
											</div>
										)}
									</div>
									<button
										onClick={() => {
											setShowTribeSelector(false);
											setSelectedPointRule(null);
											setSelectedTribe(null);
											setSelectedTribesForParticipation([]);
										}}
										className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
									>
										<X className="w-5 h-5" />
									</button>
								</div>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
									{(allowsMultipleTribes(selectedPointRule)
										? getAvailableTribesForParticipation()
										: getAvailableTribes()
									).map((tribe) => {
										// Check if this tribe is selected for multiple tribe rules
										const isSelectedForMultipleTribes =
											allowsMultipleTribes(selectedPointRule) &&
											selectedTribesForParticipation.some(
												(t) => t.tribe_id === tribe.tribe_id
											);

										// For participation scoring, check if tribe has regular scores (not participation)
										const hasRegularScore = allowsMultipleTribes(
											selectedPointRule
										)
											? scores.some((score) => {
													if (score.score_tribeId === tribe.tribe_id) {
														// Find the point rule for this score
														const pointRule = pointRules?.find(
															(pr) =>
																pr.pointrules_id === score.score_pointruleId
														);
														// Only consider it a "regular score" if it's NOT a participation score
														return (
															pointRule &&
															pointRule.pointrules_all !== 1 &&
															pointRule.pointrules_all !== true
														);
													}
													return false;
											  })
											: scores.some(
													(score) => score.score_tribeId === tribe.tribe_id
											  );

										return (
											<button
												key={tribe.tribe_id}
												onClick={() => {
													console.log("Tribe selected:", tribe);
													handleAddScore(tribe, selectedPointRule);
												}}
												className={`p-3 text-left rounded-lg border transition-all ${
													hasRegularScore
														? "text-green-800 bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
														: isSelectedForMultipleTribes
														? "text-blue-800 bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
														: "bg-gray-50 hover:bg-blue-50 hover:border-blue-500 dark:bg-gray-700 dark:hover:bg-blue-900/20 dark:hover:border-blue-500"
												}`}
												disabled={loading || hasRegularScore}
											>
												<div className="text-sm font-medium text-gray-800 lg:text-base dark:text-gray-200">
													{tribe.tribe_name}
													{hasRegularScore && (
														<span className="ml-2 text-xs text-green-600 dark:text-green-400">
															✓ Already Scored
														</span>
													)}
													{isSelectedForMultipleTribes && !hasRegularScore && (
														<span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
															✓ Selected
														</span>
													)}
												</div>
											</button>
										);
									})}
								</div>

								{/* Done button for multiple tribe rules */}
								{allowsMultipleTribes(selectedPointRule) && (
									<div className="flex flex-col gap-3 justify-between items-start mt-4 sm:flex-row sm:items-center">
										<div className="text-xs text-gray-600 lg:text-sm dark:text-gray-400">
											{selectedTribesForParticipation.length} tribes selected
										</div>
										<button
											onClick={handleSaveParticipationScores}
											className={`px-4 py-2 w-full sm:w-auto rounded-lg transition-colors font-medium ${
												loading || selectedTribesForParticipation.length === 0
													? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
													: "bg-green-600 text-white hover:bg-green-700"
											}`}
											disabled={
												loading || selectedTribesForParticipation.length === 0
											}
										>
											{loading
												? "Saving..."
												: selectedTribesForParticipation.length === 0
												? "Select Tribes"
												: "Done"}
										</button>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default SboScoringSection;
