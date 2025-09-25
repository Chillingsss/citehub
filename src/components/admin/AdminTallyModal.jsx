import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { X, Trophy, Users, RefreshCwIcon } from "lucide-react";
import {
	getAllTribesRanking,
	getTribeActivities,
	getEvents,
} from "../../utils/admin";
import TopThreeTribes from "./TopThreeTribes";
import CompleteTribeRankings from "./CompleteTribeRankings";
import TribeSummaryStats from "./TribeSummaryStats";

const AdminTallyModal = ({ isOpen, onClose }) => {
	const [tribes, setTribes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTribeIds, setSelectedTribeIds] = useState(new Set());
	const [tribeActivities, setTribeActivities] = useState({});
	const [loadingActivities, setLoadingActivities] = useState({});
	const [selectedEventTitle, setSelectedEventTitle] = useState(null);
	const [eventTitles, setEventTitles] = useState([]);

	// Fetch events when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchEvents();
		}
	}, [isOpen]);

	// Fetch events
	const fetchEvents = async () => {
		try {
			const response = await getEvents();
			if (response.success) {
				const titles = response.events.map((event) => event.event_title);
				setEventTitles(titles);
				if (titles.length > 0) {
					setSelectedEventTitle(titles[0]);
				}
			}
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	// Fetch rankings when event changes or on initial load
	useEffect(() => {
		if (isOpen) {
			fetchTribesRanking();
		}
	}, [isOpen, selectedEventTitle]);

	const fetchTribesRanking = async () => {
		try {
			setLoading(true);
			const response = await getAllTribesRanking(selectedEventTitle);
			if (response.success) {
				setTribes(response.tribes);
			}
		} catch (error) {
			console.error("Error fetching tribes ranking:", error);
		} finally {
			setLoading(false);
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

	const filteredTribes = tribes.filter((tribe) =>
		tribe.tribe_name.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm bg-opacity-50">
				<div className="bg-gray-100 dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-6xl h-full sm:h-[calc(105vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex flex-col flex-shrink-0 gap-3 p-4 border-b sm:flex-row sm:justify-between sm:items-center sm:gap-0 sm:p-6 dark:border-gray-700">
						<div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
							<div className="flex justify-between items-center">
								<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
									Tribe Rankings & Points Overview
								</h2>
								<div className="flex gap-2 items-center sm:hidden">
									<button
										onClick={fetchTribesRanking}
										className="flex gap-2 items-center p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
										title="Refresh data"
									>
										<RefreshCwIcon className="w-4 h-4" />
									</button>
									<button
										onClick={onClose}
										className="p-1 text-2xl text-gray-500 rounded-full transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<X className="w-6 h-6" />
									</button>
								</div>
							</div>
							<div className="flex gap-2 justify-start items-center px-3 py-2 mt-2 sm:mt-0 bg-blue-100 rounded-lg dark:bg-blue-900/30 sm:rounded-full sm:px-3 sm:py-1">
								<Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-medium text-blue-800 dark:text-blue-300">
									Total Tribes: {tribes.length}
								</span>
							</div>
						</div>
						<div className="hidden sm:flex gap-2 items-center">
							<button
								onClick={fetchTribesRanking}
								className="flex gap-2 items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								title="Refresh data"
							>
								<RefreshCwIcon className="w-4 h-4" />
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

					{/* Search Bar */}
					<div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
						<div className="relative max-w-md">
							<input
								type="text"
								placeholder="Search tribes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="py-2 pr-4 pl-10 w-full text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
							/>
							<Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
						</div>
					</div>

					{/* Event Tabs */}
					<div className="flex-shrink-0 p-4 border-b dark:border-gray-700">
						<div className="flex gap-2 overflow-x-auto">
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

					{/* Scrollable Content Area */}
					<div className="overflow-y-auto flex-1">
						<div className="p-4 space-y-6 sm:p-6">
							{loading ? (
								<div className="flex justify-center items-center py-12">
									<div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
								</div>
							) : filteredTribes.length === 0 ? (
								<div className="py-8 text-center">
									<Trophy className="mx-auto mb-2 w-8 h-8 text-gray-400" />
									<p className="text-gray-600 dark:text-gray-400">
										{searchQuery
											? "No tribes found matching your search."
											: "No Events found."}
									</p>
								</div>
							) : (
								<>
									{/* Top 3 Tribes Highlight */}
									<TopThreeTribes
										tribes={filteredTribes}
										eventTitle={selectedEventTitle}
									/>

									{/* All Tribes Ranking Table */}
									<CompleteTribeRankings
										tribes={filteredTribes}
										selectedTribeIds={selectedTribeIds}
										onTribeClick={handleTribeClick}
										tribeActivities={tribeActivities}
										loadingActivities={loadingActivities}
										eventTitle={selectedEventTitle}
									/>

									{/* Summary Statistics */}
									<TribeSummaryStats tribes={tribes} />
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default AdminTallyModal;
