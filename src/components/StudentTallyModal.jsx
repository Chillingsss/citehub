import React, { useState, useEffect } from "react";
import { X, RefreshCw, Trophy, Users, Calendar, BarChart3 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import {
	getStudentActivities,
	getStudentTribeScores,
	getStudentTribeInfo,
	getStudentTeamActivities,
	formatTimeAgo,
} from "../utils/student";
import { getEvents } from "../utils/admin";
import { getAllTribesRanking, getTribeActivities } from "../utils/admin";
import TopThreeTribes from "./admin/TopThreeTribes";
import CompleteTribeRankings from "./admin/CompleteTribeRankings";

const StudentTallyModal = ({ isOpen, onClose, studentId, studentProfile }) => {
	const [activities, setActivities] = useState([]);
	const [teamActivities, setTeamActivities] = useState([]);
	const [scores, setScores] = useState([]);
	const [tribeInfo, setTribeInfo] = useState(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("activity");

	// Event filter state
	const [selectedEventTitle, setSelectedEventTitle] = useState(null);
	const [eventTitles, setEventTitles] = useState([]);
	const [loadingEvents, setLoadingEvents] = useState(false);

	// Fetch events
	const fetchEvents = async () => {
		setLoadingEvents(true);
		try {
			const response = await getEvents();
			if (response.success) {
				const titles = response.events.map((event) => event.event_title);
				console.log("Fetched events:", titles);
				setEventTitles(titles);
				if (titles.length > 0 && !selectedEventTitle) {
					setSelectedEventTitle(titles[0]);
				}
			}
		} catch (error) {
			console.error("Error fetching events:", error);
		} finally {
			setLoadingEvents(false);
		}
	};

	// Ensure a default selected event when activities load/change
	useEffect(() => {
		if (eventTitles.length > 0) {
			if (!selectedEventTitle || !eventTitles.includes(selectedEventTitle)) {
				setSelectedEventTitle(eventTitles[0]);
			}
		}
	}, [eventTitles]);

	// Rankings state
	const [tribeRankings, setTribeRankings] = useState([]);
	const [selectedTribeIds, setSelectedTribeIds] = useState(new Set());
	const [tribeActivities, setTribeActivities] = useState({});
	const [loadingActivities, setLoadingActivities] = useState({});
	const [loadingRankings, setLoadingRankings] = useState(false);
	const [currentTribeRanking, setCurrentTribeRanking] = useState(null);

	useEffect(() => {
		if (isOpen && studentId) {
			fetchData();
			fetchEvents();
		}
	}, [isOpen, studentId]);

	// Fetch tribe rankings when rankings tab is selected
	useEffect(() => {
		if (isOpen && activeTab === "rankings" && selectedEventTitle) {
			fetchTribesRanking();
		}
	}, [isOpen, activeTab, selectedEventTitle]);

	// Also load rankings on open so Tribe Scores can use special-bonus-applied totals
	useEffect(() => {
		if (isOpen && tribeRankings.length === 0) {
			fetchTribesRanking();
		}
	}, [isOpen]);

	// Set current tribe ranking after rankings or tribeInfo is available
	useEffect(() => {
		if (tribeInfo && tribeRankings.length > 0) {
			const current = tribeRankings.find(
				(tribe) => tribe.tribe_id === tribeInfo.tribe_id
			);
			setCurrentTribeRanking(current || null);
		}
	}, [tribeRankings, tribeInfo]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [
				activitiesResult,
				teamActivitiesResult,
				scoresResult,
				tribeInfoResult,
			] = await Promise.all([
				getStudentActivities(studentId),
				getStudentTeamActivities(studentId),
				getStudentTribeScores(studentId),
				getStudentTribeInfo(studentId),
			]);

			if (activitiesResult.success) {
				console.log("Activities:", activitiesResult.activities);
				console.log(
					"Activities events:",
					activitiesResult.activities.map((a) => a.event_title)
				);
				setActivities(activitiesResult.activities);
			}

			if (teamActivitiesResult.success) {
				console.log("Team Activities:", teamActivitiesResult.activities);
				console.log(
					"Team Activities events:",
					teamActivitiesResult.activities.map((a) => a.event_title)
				);
				setTeamActivities(teamActivitiesResult.activities);
			}

			if (scoresResult.success) {
				console.log("Scores:", scoresResult.scores);
				console.log(
					"Scores events:",
					scoresResult.scores.map((s) => s.event_title)
				);
				setScores(scoresResult.scores);
			}

			if (tribeInfoResult.success) {
				console.log("Student Tribe Info:", tribeInfoResult.tribeInfo);
				console.log("Special bonus:", tribeInfoResult.tribeInfo.special_bonus);
				console.log(
					"Display points:",
					tribeInfoResult.tribeInfo.display_points
				);
				console.log("Total points:", tribeInfoResult.tribeInfo.total_points);
				setTribeInfo(tribeInfoResult.tribeInfo);
			}
		} catch (error) {
			console.error("Error fetching tally data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = () => {
		if (activeTab === "rankings") {
			fetchTribesRanking();
		} else {
			fetchData();
		}
		fetchEvents();
	};

	const fetchTribesRanking = async () => {
		try {
			setLoadingRankings(true);
			const response = await getAllTribesRanking(selectedEventTitle);
			if (response.success) {
				setTribeRankings(response.tribes);
				setSelectedTribeIds(new Set());
				setTribeActivities({});
			}
		} catch (error) {
			console.error("Error fetching tribes ranking:", error);
		} finally {
			setLoadingRankings(false);
		}
	};

	const fetchTribeActivities = async (tribeId) => {
		try {
			setLoadingActivities((prev) => ({ ...prev, [tribeId]: true }));
			const response = await getTribeActivities(tribeId);
			if (response.success) {
				setTribeActivities((prev) => ({
					...prev,
					[tribeId]: response.activities,
				}));
			}
		} catch (error) {
			console.error("Error fetching tribe activities:", error);
			setTribeActivities((prev) => ({
				...prev,
				[tribeId]: [],
			}));
		} finally {
			setLoadingActivities((prev) => ({ ...prev, [tribeId]: false }));
		}
	};

	const handleTribeClick = (tribeId) => {
		const newSelectedTribeIds = new Set(selectedTribeIds);
		if (selectedTribeIds.has(tribeId)) {
			newSelectedTribeIds.delete(tribeId);
			setSelectedTribeIds(newSelectedTribeIds);
			const newTribeActivities = { ...tribeActivities };
			delete newTribeActivities[tribeId];
			setTribeActivities(newTribeActivities);
		} else {
			newSelectedTribeIds.add(tribeId);
			setSelectedTribeIds(newSelectedTribeIds);
			fetchTribeActivities(tribeId);
		}
	};

	// Group scores by activity and filter by selected event
	const scoresByActivity = scores
		.filter(
			(score) => !selectedEventTitle || score.event_title === selectedEventTitle
		)
		.reduce((acc, score) => {
			if (!acc[score.score_activityId]) {
				acc[score.score_activityId] = {
					activity: {
						id: score.score_activityId,
						name: score.activity_name,
						description: score.activity_description,
						location: score.activity_location,
						event_title: score.event_title,
					},
					scores: [],
				};
			}
			acc[score.score_activityId].scores.push(score);
			return acc;
		}, {});

	const getTotalPoints = () => {
		// Calculate total points from filtered scores
		const totalPoints = Object.values(scoresByActivity).reduce(
			(total, activity) => {
				return (
					total +
					activity.scores.reduce((activityTotal, score) => {
						return activityTotal + (score.pointrules_points || 0);
					}, 0)
				);
			},
			0
		);
		return totalPoints;
	};

	const getSpecialBonus = () => {
		if (currentTribeRanking) {
			return currentTribeRanking.special_bonus || 0;
		}
		return tribeInfo?.special_bonus || 0;
	};

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-col flex-shrink-0 gap-3 p-4 border-b sm:flex-row sm:justify-between sm:items-center sm:gap-0 sm:p-6 dark:border-gray-700">
						<div className="flex justify-between items-center sm:justify-start sm:gap-4">
							<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
								Tally Dashboard
							</h2>
							<div className="flex gap-2 items-center sm:hidden">
								<button
									onClick={handleRefresh}
									disabled={loading || loadingRankings}
									className="flex items-center p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
									title="Refresh tally data"
								>
									<RefreshCw
										className={`w-4 h-4 ${
											loading || loadingRankings ? "animate-spin" : ""
										}`}
									/>
								</button>
								<button
									onClick={onClose}
									className="p-1 text-xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>

						{tribeInfo && (
							<div className="flex gap-2 justify-center items-center px-3 py-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 sm:rounded-full sm:px-3 sm:py-1">
								<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-medium text-blue-800 dark:text-blue-300">
									{tribeInfo.tribe_name}
								</span>
								<div className="flex gap-1 items-center ml-2">
									<Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
									<span className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
										{getTotalPoints()} pts
									</span>
								</div>
							</div>
						)}

						<div className="hidden gap-2 items-center sm:flex">
							<button
								onClick={handleRefresh}
								disabled={loading || loadingRankings}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
								title="Refresh tally data"
							>
								<RefreshCw
									className={`w-4 h-4 ${
										loading || loadingRankings ? "animate-spin" : ""
									}`}
								/>
								<span>Refresh</span>
							</button>
							<button
								onClick={onClose}
								className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
					</div>

					{/* Tab Navigation */}
					<div className="flex-shrink-0 border-b dark:border-gray-700">
						<div className="flex">
							<button
								onClick={() => setActiveTab("activity")}
								className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
									activeTab === "activity"
										? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50"
								}`}
							>
								<div className="flex items-center justify-center gap-2">
									<Trophy className="w-4 h-4" />
									<span>Activity</span>
								</div>
							</button>
							<button
								onClick={() => setActiveTab("rankings")}
								className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
									activeTab === "rankings"
										? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50"
								}`}
							>
								<div className="flex items-center justify-center gap-2">
									<BarChart3 className="w-4 h-4" />
									<span>Rankings</span>
								</div>
							</button>
						</div>
					</div>

					{/* Event Tabs */}
					<div className="flex-shrink-0 border-b dark:border-gray-700">
						<div className="px-4 py-2">
							<div className="flex gap-2 overflow-x-auto">
								{loadingEvents ? (
									<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-1">
										<RefreshCw className="w-4 h-4 animate-spin" />
										<span>Loading events...</span>
									</div>
								) : eventTitles.length > 0 ? (
									eventTitles.map((title) => (
										<button
											key={title}
											onClick={() => setSelectedEventTitle(title)}
											className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors ${
												selectedEventTitle === title
													? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
													: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
											}`}
										>
											{title}
										</button>
									))
								) : (
									<div className="text-sm text-gray-500 dark:text-gray-400 py-1">
										No events available
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1 p-4 sm:p-6">
						{activeTab === "rankings" ? (
							<div className="space-y-6">
								<div className="text-center">
									<h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
										Tribe Rankings
									</h3>
									<p className="text-gray-600 dark:text-gray-400">
										View current tribe standings and performance
									</p>
								</div>

								{loadingRankings ? (
									<div className="flex justify-center items-center py-12">
										<div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
									</div>
								) : tribeRankings.length === 0 ? (
									<div className="py-8 text-center">
										<Trophy className="mx-auto mb-2 w-8 h-8 text-gray-400" />
										<p className="text-gray-600 dark:text-gray-400">
											No tribe rankings found.
										</p>
									</div>
								) : (
									<>
										<TopThreeTribes tribes={tribeRankings} />
										<CompleteTribeRankings
											tribes={tribeRankings}
											selectedTribeIds={selectedTribeIds}
											onTribeClick={handleTribeClick}
											tribeActivities={tribeActivities}
											loadingActivities={loadingActivities}
										/>
									</>
								)}
							</div>
						) : loading ? (
							<div className="flex justify-center items-center h-64">
								<div className="text-center">
									<RefreshCw className="mx-auto mb-4 w-8 h-8 text-blue-500 animate-spin" />
									<p className="text-gray-600 dark:text-gray-400">
										Loading tally data...
									</p>
								</div>
							</div>
						) : eventTitles.length === 0 ? (
							<div className="py-12 text-center">
								<Calendar className="mx-auto mb-4 w-12 h-12 text-gray-400" />
								<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
									No Events Available
								</h3>
								<p className="text-gray-600 dark:text-gray-400">
									There are no events available at the moment. Check back later
									for updates.
								</p>
							</div>
						) : (
							<div className="space-y-8">
								{/* My Activities Section */}
								<div>
									<h3 className="flex gap-2 items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
										<Users className="w-5 h-5 text-blue-500" />
										My Activities
									</h3>
									<div className="space-y-4">
										{/* Filter activities by selected event */}
										{activities.filter(
											(a) =>
												!selectedEventTitle ||
												a.event_title === selectedEventTitle
										).length === 0 ? (
											<div className="py-8 text-center">
												<Calendar className="mx-auto mb-2 w-8 h-8 text-gray-400" />
												<p className="text-gray-600 dark:text-gray-400">
													You are not registered for any activities yet.
												</p>
											</div>
										) : (
											activities
												.filter(
													(a) =>
														!selectedEventTitle ||
														a.event_title === selectedEventTitle
												)
												.map((activity) => (
													<div
														key={activity.activity_id}
														className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600"
													>
														<div className="flex justify-between items-start mb-2">
															<h4 className="font-semibold text-gray-800 dark:text-gray-200">
																{activity.activity_name}
															</h4>
															<span
																className={`px-2 py-1 text-xs font-medium rounded-full ${
																	activity.participation_status === 1
																		? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
																		: activity.participation_status === 0
																		? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
																		: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
																}`}
															>
																{activity.status_text}
															</span>
														</div>
														<p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
															{activity.activity_description}
														</p>
														<div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
															{activity.event_title && (
																<span className="px-2 py-1 bg-blue-100 rounded dark:bg-blue-900/30">
																	📅 {activity.event_title}
																</span>
															)}
															<span className="px-2 py-1 bg-gray-100 rounded dark:bg-gray-600">
																📍 {activity.activity_location}
															</span>
															{activity.scorekeeper_firstname && (
																<span className="px-2 py-1 bg-purple-100 rounded dark:bg-purple-900/30">
																	👤 {activity.scorekeeper_firstname}{" "}
																	{activity.scorekeeper_lastname}
																</span>
															)}
														</div>
														{activity.participation_date && (
															<div className="pt-2 mt-2 border-t dark:border-gray-600">
																<p className="text-xs text-gray-500 dark:text-gray-400">
																	Registered:{" "}
																	{formatTimeAgo(activity.participation_date)}
																</p>
															</div>
														)}
													</div>
												))
										)}
									</div>
								</div>

								{/* Team Activities Section */}
								<div>
									<h3 className="flex gap-2 items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
										<Users className="w-5 h-5 text-green-500" />
										Team Activities
										{tribeInfo && (
											<span className="text-sm font-normal text-gray-500 dark:text-gray-400">
												({tribeInfo.tribe_name} members)
											</span>
										)}
									</h3>
									<div className="space-y-4">
										{teamActivities.filter(
											(a) =>
												!selectedEventTitle ||
												a.event_title === selectedEventTitle
										).length === 0 ? (
											<div className="py-8 text-center">
												<Users className="mx-auto mb-2 w-8 h-8 text-gray-400" />
												<p className="text-gray-600 dark:text-gray-400">
													No other team members are registered for activities
													yet.
												</p>
											</div>
										) : (
											teamActivities
												.filter(
													(a) =>
														!selectedEventTitle ||
														a.event_title === selectedEventTitle
												)
												.map((activity) => (
													<div
														key={`team-${activity.activity_id}`}
														className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 dark:from-green-900/20 dark:to-blue-900/20 dark:border-green-700"
													>
														<h4 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">
															{activity.activity_name}
														</h4>
														<p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
															{activity.activity_description}
														</p>
														<div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
															{activity.event_title && (
																<span className="px-2 py-1 bg-blue-100 rounded dark:bg-blue-900/30">
																	📅 {activity.event_title}
																</span>
															)}
															<span className="px-2 py-1 bg-gray-100 rounded dark:bg-gray-600">
																📍 {activity.activity_location}
															</span>
															{activity.scorekeeper_firstname && (
																<span className="px-2 py-1 bg-purple-100 rounded dark:bg-purple-900/30">
																	👤 {activity.scorekeeper_firstname}{" "}
																	{activity.scorekeeper_lastname}
																</span>
															)}
														</div>
														<div className="pt-2 border-t border-green-200 dark:border-green-700">
															<p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
																Team Members:
															</p>
															<p className="text-xs text-gray-600 dark:text-gray-400">
																{activity.team_participants}
															</p>
														</div>
													</div>
												))
										)}
									</div>
								</div>

								{/* Scores Section */}
								<div>
									<h3 className="flex gap-2 items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
										<Trophy className="w-5 h-5 text-yellow-500" />
										Tribe Scores
										{selectedEventTitle && (
											<span className="text-sm font-normal text-gray-500 dark:text-gray-400">
												• {selectedEventTitle}
											</span>
										)}
									</h3>
									<div className="space-y-4">
										{Object.keys(scoresByActivity).length === 0 ? (
											<div className="py-8 text-center">
												<Trophy className="mx-auto mb-2 w-8 h-8 text-gray-400" />
												<p className="text-gray-600 dark:text-gray-400">
													Your tribe hasn't earned any scores yet.
												</p>
											</div>
										) : (
											Object.values(scoresByActivity).map((activityGroup) => (
												<div
													key={activityGroup.activity.id}
													className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600"
												>
													<h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
														{activityGroup.activity.name}
													</h4>
													<div className="space-y-2">
														{activityGroup.scores.map((score) => (
															<div
																key={score.score_id}
																className="flex justify-between items-center p-2 bg-gray-50 rounded dark:bg-gray-600"
															>
																<span className="text-sm text-gray-700 dark:text-gray-300">
																	{score.pointrules_place}
																</span>
																<span className="font-bold text-green-600 dark:text-green-400">
																	+{score.pointrules_points} pts
																</span>
															</div>
														))}
													</div>
												</div>
											))
										)}

										{/* Total Score - Only show if there are scores for the selected event */}
										{tribeInfo && Object.keys(scoresByActivity).length > 0 && (
											<div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
												<div className="text-center">
													<div className="flex justify-center items-center mb-3">
														<Trophy className="mr-3 w-8 h-8 text-yellow-500" />
														<h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
															{tribeInfo.tribe_name} Total
															{selectedEventTitle && (
																<span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
																	{selectedEventTitle}
																</span>
															)}
														</h4>
													</div>
													<div className="text-3xl font-bold text-green-600 dark:text-green-400">
														{getTotalPoints()} points
													</div>
													{getSpecialBonus() > 0 && (
														<div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
															+{getSpecialBonus()} bonus point for tie-breaking
														</div>
													)}
													{tribeInfo.tied_with &&
														tribeInfo.tied_with.length > 0 && (
															<div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
																On the same score as:{" "}
																{tribeInfo.tied_with.join(", ")}
															</div>
														)}
													<div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
														Total accumulated points
														{getSpecialBonus() > 0 && " (with bonus)"}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default StudentTallyModal;
