import React, { useState, useEffect } from "react";
import { X, RefreshCw, Trophy, BarChart3, Calendar } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useSboTally } from "../../hooks/useSboTally";
import {
	getAllTribesRanking,
	getTribeActivities,
	getEvents,
} from "../../utils/admin";
import SboActivityCarousel from "./SboActivityCarousel";
import SboScoringSection from "./SboScoringSection";
import SboStudentParticipationModal from "./SboStudentParticipationModal";
import TopThreeTribes from "../admin/TopThreeTribes";
import CompleteTribeRankings from "../admin/CompleteTribeRankings";

const SboTallyModal = ({ isOpen, onClose, sboId }) => {
	const [activeTab, setActiveTab] = useState("activity"); // "activity" or "rankings"
	const [tribeRankings, setTribeRankings] = useState([]);
	const [selectedTribeIds, setSelectedTribeIds] = useState(new Set());
	const [tribeActivities, setTribeActivities] = useState({});
	const [loadingActivities, setLoadingActivities] = useState({});
	const [loadingRankings, setLoadingRankings] = useState(false);

	// Student participation modal state
	const [showStudentParticipationModal, setShowStudentParticipationModal] =
		useState(false);
	const [
		selectedActivityForParticipation,
		setSelectedActivityForParticipation,
	] = useState(null);

	const {
		// State
		activities,
		selectedActivity,
		setSelectedActivity,
		pointRules,
		scores,
		tribes,
		loading,
		selectedPointRule,
		setSelectedPointRule,
		selectedTribe,
		setSelectedTribe,
		showTribeSelector,
		setShowTribeSelector,
		selectedTribesForParticipation,
		setSelectedTribesForParticipation,
		showConfirmDialog,
		scoreToDelete,

		// Carousel state
		currentActivityIndex,
		setCurrentActivityIndex,
		itemsPerPage,
		isMobile,

		// Functions
		handleRefresh,
		handleAddScore,
		handleRemoveScore,
		confirmRemoveScore,
		cancelRemoveScore,
		handleSaveParticipationScores,
		getAvailablePointRules,
		getParticipationPointRule,
		allowsMultipleTribes,
		hasAnyPointRules,
		getAvailableTribes,
		getAvailableTribesForParticipation,

		// Carousel functions
		goToPrevious,
		goToNext,
		canGoPrevious,
		canGoNext,
		getVisibleActivities,
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	} = useSboTally(isOpen, sboId);

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

	// Fetch events when modal opens
	useEffect(() => {
		if (isOpen && sboId) {
			fetchEvents();
		}
	}, [isOpen, sboId]);

	// Ensure a default selected event when activities load/change
	useEffect(() => {
		if (eventTitles.length > 0) {
			if (!selectedEventTitle || !eventTitles.includes(selectedEventTitle)) {
				setSelectedEventTitle(eventTitles[0]);
			}
		}
	}, [eventTitles]);

	const filteredActivities = React.useMemo(() => {
		if (!selectedEventTitle) return [];
		return (
			activities.filter((a) => a?.event_title === selectedEventTitle) || []
		);
	}, [activities, selectedEventTitle]);

	useEffect(() => {
		// reset carousel and selection if filter changes
		setCurrentActivityIndex(0);
		setSelectedActivity(null);

		// Only set selected activity if we have filtered activities
		if (filteredActivities.length > 0) {
			setSelectedActivity(filteredActivities[0]);
		}
	}, [selectedEventTitle, filteredActivities]);

	// Fetch tribe rankings when rankings tab is selected, event changes, or refresh is triggered
	useEffect(() => {
		if (isOpen) {
			if (activeTab === "rankings" && selectedEventTitle) {
				fetchTribesRanking();
			}
			fetchEvents();
		}
	}, [isOpen, activeTab, selectedEventTitle, loading]); // This will trigger when any of these dependencies change

	const fetchTribesRanking = async () => {
		try {
			setLoadingRankings(true);
			const response = await getAllTribesRanking(selectedEventTitle);
			if (response.success) {
				setTribeRankings(response.tribes);
				// Clear selected tribe activities to get fresh data
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
			// Remove activities for this tribe
			const newTribeActivities = { ...tribeActivities };
			delete newTribeActivities[tribeId];
			setTribeActivities(newTribeActivities);
		} else {
			newSelectedTribeIds.add(tribeId);
			setSelectedTribeIds(newSelectedTribeIds);
			fetchTribeActivities(tribeId);
		}
	};

	// Handle refresh - refresh both data and events
	const handleRefreshAll = () => {
		if (activeTab === "rankings") {
			fetchTribesRanking();
		} else {
			handleRefresh();
		}
		fetchEvents();
	};

	// Handle opening student participation modal
	const handleManageStudents = (activity) => {
		setSelectedActivityForParticipation(activity);
		setShowStudentParticipationModal(true);
	};

	// Handle closing student participation modal
	const handleCloseStudentParticipationModal = () => {
		setShowStudentParticipationModal(false);
		setSelectedActivityForParticipation(null);
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
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-4xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-shrink-0 justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
							SBO Tally System
						</h2>
						<div className="flex gap-2 items-center">
							<button
								onClick={handleRefreshAll}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh tally data"
							>
								<RefreshCw className="w-4 h-4" />
								<span className="hidden sm:inline">Refresh</span>
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

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1">
						<div className="p-4 space-y-6 sm:p-6">
							{activeTab === "activity" ? (
								<>
									{eventTitles.length === 0 ? (
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
									) : filteredActivities.length > 0 ? (
										<SboActivityCarousel
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
											goToPrevious={goToPrevious}
											goToNext={goToNext}
											canGoPrevious={currentActivityIndex > 0}
											canGoNext={
												currentActivityIndex + itemsPerPage <
												filteredActivities.length
											}
											getVisibleActivities={() =>
												filteredActivities.slice(
													currentActivityIndex,
													currentActivityIndex + itemsPerPage
												)
											}
											onManageStudents={handleManageStudents}
										/>
									) : (
										<div className="flex flex-col justify-center items-center py-12 text-center">
											<div className="p-4 mb-4 bg-gray-100 rounded-full dark:bg-gray-600">
												<Trophy className="w-12 h-12 text-gray-400 lg:w-16 lg:h-16 dark:text-gray-500" />
											</div>
											<h3 className="mb-2 text-lg font-medium text-gray-800 lg:text-xl dark:text-gray-200">
												No Activities Found
											</h3>
										</div>
									)}

									{/* Main Scoring Content */}
									{selectedActivity ? (
										<SboScoringSection
											selectedActivity={selectedActivity}
											loading={loading}
											scores={scores}
											handleRemoveScore={handleRemoveScore}
											getAvailablePointRules={getAvailablePointRules}
											getParticipationPointRule={getParticipationPointRule}
											hasAnyPointRules={hasAnyPointRules}
											setSelectedPointRule={setSelectedPointRule}
											setShowTribeSelector={setShowTribeSelector}
											showTribeSelector={showTribeSelector}
											selectedPointRule={selectedPointRule}
											setSelectedTribe={setSelectedTribe}
											setSelectedTribesForParticipation={
												setSelectedTribesForParticipation
											}
											selectedTribesForParticipation={
												selectedTribesForParticipation
											}
											getAvailableTribesForParticipation={
												getAvailableTribesForParticipation
											}
											getAvailableTribes={getAvailableTribes}
											handleAddScore={handleAddScore}
											handleSaveParticipationScores={
												handleSaveParticipationScores
											}
											allowsMultipleTribes={allowsMultipleTribes}
											pointRules={pointRules}
										/>
									) : eventTitles.length > 0 ? (
										<div className="flex flex-col justify-center items-center py-12 text-center">
											<div className="p-4 mb-4 bg-gray-100 rounded-full dark:bg-gray-600">
												<Trophy className="w-12 h-12 text-gray-400 lg:w-16 lg:h-16 dark:text-gray-500" />
											</div>
											<h3 className="mb-2 text-lg font-medium text-gray-800 lg:text-xl dark:text-gray-200">
												Select an Activity
											</h3>
										</div>
									) : null}
								</>
							) : (
								<>
									{/* Rankings Content */}
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
												{/* Top 3 Tribes */}
												<TopThreeTribes tribes={tribeRankings} />

												{/* Complete Rankings Table */}
												<CompleteTribeRankings
													tribes={tribeRankings}
													selectedTribeIds={selectedTribeIds}
													onTribeClick={handleTribeClick}
													tribeActivities={tribeActivities}
													loadingActivities={loadingActivities}
													selectedEventTitle={selectedEventTitle}
												/>
											</>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
					<div className="p-6 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
							Confirm Removal
						</h3>
						<p className="mt-2 text-sm text-gray-600 lg:text-base dark:text-gray-400">
							Are you sure you want to remove this score? This action cannot be
							undone.
						</p>
						<div className="flex flex-col gap-3 justify-end mt-4 sm:flex-row">
							<button
								onClick={cancelRemoveScore}
								className="px-4 py-2 w-full text-gray-700 bg-gray-200 rounded-lg sm:w-auto hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
							<button
								onClick={confirmRemoveScore}
								className="px-4 py-2 w-full text-red-600 bg-red-100 rounded-lg sm:w-auto hover:bg-red-200 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Student Participation Modal */}
			<SboStudentParticipationModal
				isOpen={showStudentParticipationModal}
				onClose={handleCloseStudentParticipationModal}
				activity={selectedActivityForParticipation}
				sboId={sboId}
			/>
		</>
	);
};

export default SboTallyModal;
