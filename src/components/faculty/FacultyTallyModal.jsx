import React, { useRef, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
	X,
	ChevronUp,
	RefreshCw,
	Trophy,
	Users,
	BarChart3,
	Calendar,
} from "lucide-react";
import { useTallyModal } from "../../hooks/useTallyModal";
import ActivityCarousel from "../ActivityCarousel";
import ParticipantManager from "./ParticipantManager";
import TopThreeTribes from "../admin/TopThreeTribes";
import CompleteTribeRankings from "../admin/CompleteTribeRankings";
import { getAllTribesRanking, getTribeActivities } from "../../utils/admin";

const FacultyTallyModal = ({ isOpen, onClose, facultyId }) => {
	const [showScrollTop, setShowScrollTop] = useState(false);
	const scrollContainerRef = useRef(null);

	const {
		students,
		activities,
		selectedActivity,
		setSelectedActivity,
		participants,
		scores,
		tribeInfo,
		loading,
		searchQuery,
		setSearchQuery,
		currentActivityIndex,
		setCurrentActivityIndex,
		itemsPerPage,
		isMobile,
		handleRefresh,
		handleAddParticipant,
		handleRemoveParticipant,
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	} = useTallyModal(isOpen, facultyId);

	// Rankings/Tab state similar to StudentTallyModal
	const [activeTab, setActiveTab] = useState("activity");
	const [tribeRankings, setTribeRankings] = useState([]);
	const [selectedTribeIds, setSelectedTribeIds] = useState(new Set());
	const [tribeActivities, setTribeActivities] = useState({});
	const [loadingActivities, setLoadingActivities] = useState({});
	const [loadingRankings, setLoadingRankings] = useState(false);
	const [currentTribeRanking, setCurrentTribeRanking] = useState(null);

	// Event filter for activities and rankings
	const [selectedEventTitle, setSelectedEventTitle] = useState(null);
	const eventTitles = React.useMemo(() => {
		const titles = [];
		activities.forEach((a) => {
			if (a?.event_title && !titles.includes(a.event_title)) {
				titles.push(a.event_title);
			}
		});
		return titles;
	}, [activities]);

	// Ensure a default selected event when activities load/change
	useEffect(() => {
		if (eventTitles.length > 0) {
			if (!selectedEventTitle || !eventTitles.includes(selectedEventTitle)) {
				setSelectedEventTitle(eventTitles[0]);
			}
		}
	}, [eventTitles]);

	const filteredActivities = React.useMemo(() => {
		if (!selectedEventTitle) return activities;
		return activities.filter((a) => a?.event_title === selectedEventTitle);
	}, [activities, selectedEventTitle]);

	useEffect(() => {
		// reset carousel and selection if filter changes
		setCurrentActivityIndex(0);
		if (
			selectedActivity &&
			selectedEventTitle &&
			selectedActivity.event_title !== selectedEventTitle
		) {
			setSelectedActivity(filteredActivities[0] || null);
		}
	}, [selectedEventTitle]);

	// Helper function to format rank text consistently
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

	useEffect(() => {
		const handleScroll = () => {
			if (scrollContainerRef.current) {
				const { scrollTop } = scrollContainerRef.current;
				setShowScrollTop(scrollTop > 300);
			}
		};

		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, []);

	// Load rankings when switching to Rankings tab
	useEffect(() => {
		if (isOpen && activeTab === "rankings" && selectedEventTitle) {
			fetchTribesRanking();
		}
	}, [isOpen, activeTab, selectedEventTitle, loading]);

	// Load rankings when modal opens to get current tribe ranking for display
	useEffect(() => {
		if (isOpen && tribeInfo && tribeRankings.length === 0) {
			fetchTribesRanking();
		}
	}, [isOpen, tribeInfo]);

	// Update current tribe ranking when rankings are loaded or event changes
	useEffect(() => {
		if (tribeInfo && tribeRankings.length > 0) {
			const currentTribe = tribeRankings.find(
				(tribe) => tribe.tribe_id === tribeInfo.tribe_id
			);
			setCurrentTribeRanking(currentTribe || null);
		}
	}, [tribeRankings, tribeInfo, selectedEventTitle]);

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
			setTribeActivities((prev) => ({ ...prev, [tribeId]: [] }));
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

	const handleRefreshClick = () => {
		if (activeTab === "rankings") {
			fetchTribesRanking();
		} else {
			handleRefresh();
		}
	};

	const scrollToTop = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<style>
				{`
					.line-clamp-2 {
						display: -webkit-box;
						-webkit-line-clamp: 2;
						-webkit-box-orient: vertical;
						overflow: hidden;
					}
				`}
			</style>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-col flex-shrink-0 gap-3 p-4 border-b sm:flex-row sm:justify-between sm:items-center sm:gap-0 sm:p-6 dark:border-gray-700">
						<div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
							<div className="flex justify-between items-center">
								<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
									Activity Tally Management
								</h2>
								<div className="flex gap-2 items-center sm:hidden">
									<button
										onClick={handleRefreshClick}
										className="flex gap-2 items-center p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
										title="Refresh data"
									>
										<RefreshCw className="w-4 h-4" />
									</button>
									<button
										onClick={onClose}
										className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<X className="w-6 h-6" />
									</button>
								</div>
							</div>
							{tribeInfo ? (
								<div className="flex gap-2 justify-center items-center px-3 py-2 mt-2 sm:mt-0 bg-blue-100 rounded-lg dark:bg-blue-900/30 sm:rounded-full sm:px-3 sm:py-1">
									<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									<span className="text-sm font-medium text-blue-800 dark:text-blue-300">
										{tribeInfo.tribe_name}
									</span>
								</div>
							) : (
								<div className="flex gap-2 justify-center items-center px-3 py-2 mt-2 sm:mt-0 bg-yellow-100 rounded-lg dark:bg-yellow-900/30 sm:rounded-full sm:px-3 sm:py-1">
									<Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
									<span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
										No Tribe Assigned
									</span>
								</div>
							)}
						</div>
						<div className="hidden sm:flex gap-2 items-center">
							<button
								onClick={handleRefreshClick}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh data"
							>
								<RefreshCw className="w-4 h-4" />
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

					{/* Tab Navigation - Always show tabs regardless of tribe status */}
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

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1" ref={scrollContainerRef}>
						<div className="p-4 space-y-6 sm:p-6">
							{/* Event Tabs */}
							<div className="mb-3 overflow-x-auto">
								<div className="flex gap-2 min-w-max">
									{eventTitles.map((title) => (
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
									))}
								</div>
							</div>

							{/* Show no events message if no events available */}
							{eventTitles.length === 0 && activeTab === "activity" && (
								<div className="py-12 text-center">
									<Calendar className="mx-auto mb-4 w-12 h-12 text-gray-400" />
									<h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
										No Events Available
									</h3>
									<p className="text-gray-600 dark:text-gray-400">
										There are no events available at the moment. Check back
										later for updates.
									</p>
								</div>
							)}

							{/* Show no tribe message if faculty has no tribe and on Activity tab - only if events exist */}
							{!tribeInfo &&
								activeTab === "activity" &&
								eventTitles.length > 0 && (
									<div className="text-center py-8">
										<Users className="mx-auto mb-4 w-16 h-16 text-yellow-500" />
										<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
											No Tribe Assigned
										</h3>
										<p className="text-gray-600 dark:text-gray-400 mb-4">
											You don't have a tribe assigned yet. You can still view
											activities and their details.
										</p>
										<div className="inline-block p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
											<p className="text-sm text-yellow-800 dark:text-yellow-200">
												Contact an administrator to get assigned to a tribe for
												full functionality.
											</p>
										</div>
									</div>
								)}

							{/* Show Rankings tab content - Always show rankings regardless of tribe status */}
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

									{/* Show no tribe message if faculty has no tribe */}
									{!tribeInfo && (
										<div className="text-center py-6">
											<div className="inline-block p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
												<p className="text-sm text-yellow-800 dark:text-yellow-200">
													Note: You don't have a tribe assigned, but you can
													still view all tribe rankings.
												</p>
											</div>
										</div>
									)}

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
							) : activeTab === "activity" && eventTitles.length > 0 ? (
								<>
									{/* Activity Selection */}
									<ActivityCarousel
										activities={filteredActivities}
										selectedActivity={selectedActivity}
										setSelectedActivity={setSelectedActivity}
										currentActivityIndex={currentActivityIndex}
										setCurrentActivityIndex={setCurrentActivityIndex}
										itemsPerPage={itemsPerPage}
										isMobile={isMobile}
										onTouchStart={onTouchStart}
										onTouchMove={onTouchMove}
										onTouchEnd={onTouchEnd}
									/>

									{/* Student Management Section - Only show if faculty has a tribe */}
									{tribeInfo && (
										<ParticipantManager
											selectedActivity={selectedActivity}
											students={students}
											participants={participants}
											searchQuery={searchQuery}
											setSearchQuery={setSearchQuery}
											loading={loading}
											handleAddParticipant={handleAddParticipant}
											handleRemoveParticipant={handleRemoveParticipant}
										/>
									)}

									{/* Tribe Scores Section - Only show if faculty has a tribe */}
									{tribeInfo && (
										<div>
											<h3 className="flex gap-2 items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
												<Trophy className="w-5 h-5 text-yellow-500" />
												Tribe Scores
												{tribeInfo && (
													<span className="text-sm font-normal text-gray-500 dark:text-gray-400">
														({tribeInfo.tribe_name})
														{selectedEventTitle && <> • {selectedEventTitle}</>}
													</span>
												)}
											</h3>

											<div className="space-y-4">
												{/* Group scores by activity */}
												{(() => {
													// Filter scores by selected event
													const filteredScores = selectedEventTitle
														? scores.filter(
																(score) =>
																	score.event_title === selectedEventTitle
														  )
														: scores;

													const scoresByActivity = filteredScores.reduce(
														(acc, score) => {
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
														},
														{}
													);

													if (Object.keys(scoresByActivity).length === 0) {
														return (
															<div className="py-8 text-center">
																<Trophy className="mx-auto mb-2 w-8 h-8 text-gray-400" />
																<p className="text-gray-600 dark:text-gray-400">
																	Your tribe hasn't earned any scores yet.
																</p>
															</div>
														);
													}

													return (
														<>
															{Object.values(scoresByActivity).map(
																(activityGroup) => (
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
																)
															)}

															{/* Total Score - Updated to show ranking info */}
															{tribeInfo && currentTribeRanking && (
																<div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
																	<div className="text-center">
																		<div className="flex justify-center items-center mb-3">
																			<Trophy className="mr-3 w-8 h-8 text-yellow-500" />
																			<h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
																				{tribeInfo.tribe_name} Total
																			</h4>
																		</div>
																		<div className="text-3xl font-bold text-green-600 dark:text-green-400">
																			{currentTribeRanking.display_points ||
																				currentTribeRanking.total_points ||
																				0}{" "}
																			points
																			{currentTribeRanking.special_bonus >
																				0 && (
																				<span className="ml-2 text-lg text-yellow-600 dark:text-yellow-400">
																					(+{currentTribeRanking.special_bonus}{" "}
																					bonus)
																				</span>
																			)}
																		</div>
																		<div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
																			Total accumulated points (including bonus)
																		</div>
																		{currentTribeRanking.rank && (
																			<div className="p-2 mt-3 bg-blue-50 rounded-lg dark:bg-blue-900/30">
																				<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
																					Current Rank:{" "}
																					{currentTribeRanking.rank === 1
																						? "🥇 1st"
																						: currentTribeRanking.rank === 2
																						? "🥈 2nd"
																						: currentTribeRanking.rank === 3
																						? "🥉 3rd"
																						: getRankText(
																								currentTribeRanking.rank
																						  )}{" "}
																					out of {tribeRankings.length} tribes
																				</span>
																			</div>
																		)}
																	</div>
																</div>
															)}
														</>
													);
												})()}
											</div>
										</div>
									)}
								</>
							) : null}
						</div>
					</div>

					{/* Scroll to Top Button */}
					{showScrollTop && (
						<button
							onClick={scrollToTop}
							className="flex fixed right-6 bottom-6 justify-center items-center w-12 h-12 bg-blue-600 rounded-full shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl"
						>
							<ChevronUp className="w-6 h-6 text-white" />
						</button>
					)}
				</div>
			</div>
		</>
	);
};

export default FacultyTallyModal;
