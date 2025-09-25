import React, { useState, useEffect } from "react";
import {
	X,
	Calendar,
	Plus,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	Edit,
	ArrowLeft,
	Trash2,
} from "lucide-react";
import {
	getEvents,
	addEvent,
	updateEvent,
	deleteEvent,
	getActivities,
	addActivity,
	updateActivity,
	deleteActivity,
	getPointRules,
	addPointRule,
	updatePointRule,
	deletePointRule,
	getScorekeepers,
} from "../../utils/admin";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import EventForm from "./EventForm";
import ActivityForm from "../ActivityForm";
import PointRuleForm from "./PointRuleForm";
import ActivityList from "../ActivityList";
import PointRuleList from "./PointRuleList";
import ConfirmDialog from "../ui/ConfirmDialog";

const EventManagementModal = ({ isOpen, onClose }) => {
	const [events, setEvents] = useState([]);
	const [activities, setActivities] = useState([]);
	const [pointRules, setPointRules] = useState([]);
	const [scorekeepers, setScorekeepers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedActivity, setSelectedActivity] = useState(null);
	const [expandedEvents, setExpandedEvents] = useState(new Set());

	// Mobile navigation state
	const [mobileView, setMobileView] = useState("events"); // "events" | "pointRules"

	// Form states
	const [showAddEventForm, setShowAddEventForm] = useState(false);
	const [showAddActivityForm, setShowAddActivityForm] = useState(false);
	const [showAddPointRuleForm, setShowAddPointRuleForm] = useState(false);

	// Edit states
	const [editingEvent, setEditingEvent] = useState(null);
	const [editingActivity, setEditingActivity] = useState(null);
	const [editingPointRule, setEditingPointRule] = useState(null);
	const [originalPointRuleData, setOriginalPointRuleData] = useState(null);

	// Delete confirmation states
	const [showDeleteActivityDialog, setShowDeleteActivityDialog] =
		useState(false);
	const [showDeletePointRuleDialog, setShowDeletePointRuleDialog] =
		useState(false);
	const [showDeleteEventDialog, setShowDeleteEventDialog] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState(null);
	const [pointRuleToDelete, setPointRuleToDelete] = useState(null);
	const [eventToDelete, setEventToDelete] = useState(null);

	const [eventForm, setEventForm] = useState({
		title: "",
		startDate: "",
		endDate: "",
	});

	const [activityForm, setActivityForm] = useState({
		name: "",
		description: "",
		location: "",
		scorekeeperId: "",
		isSpecial: false,
		startTime: "",
		endTime: "",
	});

	const [pointRuleForm, setPointRuleForm] = useState({
		place: "",
		points: "",
		allowsMultiple: false,
	});

	useEffect(() => {
		if (isOpen) {
			fetchEvents();
			fetchScorekeepers();
		}
	}, [isOpen]);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const result = await getEvents();
			if (result.success) {
				setEvents(result.events);
			} else {
				toast.error("Failed to fetch events");
				setEvents([]);
			}
		} catch (error) {
			console.error("Error fetching events:", error);
			toast.error("Error fetching events");
			setEvents([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchScorekeepers = async () => {
		try {
			const result = await getScorekeepers();
			if (result.success) {
				setScorekeepers(result.scorekeepers || []);
			}
		} catch (error) {
			console.error("Error fetching scorekeepers:", error);
		}
	};

	const fetchActivities = async (eventId) => {
		try {
			const result = await getActivities(eventId);
			if (result.success) {
				setActivities(result.activities);
			} else {
				setActivities([]);
			}
		} catch (error) {
			console.error("Error fetching activities:", error);
			setActivities([]);
		}
	};

	const fetchPointRules = async (activityId) => {
		try {
			const result = await getPointRules(activityId);
			if (result.success) {
				setPointRules(result.pointRules);
			} else {
				setPointRules([]);
			}
		} catch (error) {
			console.error("Error fetching point rules:", error);
			setPointRules([]);
		}
	};

	const handleAddEvent = async (e) => {
		e.preventDefault();
		if (!eventForm.title || !eventForm.startDate || !eventForm.endDate) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await addEvent(eventForm);
			if (result.success) {
				toast.success("Event added successfully");
				setEventForm({ title: "", startDate: "", endDate: "" });
				setShowAddEventForm(false);
				fetchEvents();
			} else {
				toast.error(result.message || "Failed to add event");
			}
		} catch (error) {
			console.error("Error adding event:", error);
			toast.error("Error adding event");
		}
	};

	const handleAddActivity = async (e) => {
		e.preventDefault();
		if (
			!activityForm.name ||
			!activityForm.location ||
			!activityForm.scorekeeperId
		) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await addActivity({
				...activityForm,
				eventId: selectedEvent.event_id,
			});
			if (result.success) {
				toast.success("Activity added successfully");
				setActivityForm({
					name: "",
					description: "",
					location: "",
					scorekeeperId: "",
					isSpecial: false,
					startTime: "",
					endTime: "",
				});
				setShowAddActivityForm(false);
				fetchActivities(selectedEvent.event_id);
			} else {
				toast.error(result.message || "Failed to add activity");
			}
		} catch (error) {
			console.error("Error adding activity:", error);
			toast.error("Error adding activity");
		}
	};

	const handleAddPointRule = async (e) => {
		e.preventDefault();
		if (!pointRuleForm.place || !pointRuleForm.points) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await addPointRule({
				...pointRuleForm,
				activityId: selectedActivity.activity_id,
			});
			if (result.success) {
				toast.success("Point rule added successfully");
				setPointRuleForm({ place: "", points: "", allowsMultiple: false });
				// Keep the form open, don't set setShowAddPointRuleForm(false)
				fetchPointRules(selectedActivity.activity_id);
			} else {
				toast.error(result.message || "Failed to add point rule");
			}
		} catch (error) {
			console.error("Error adding point rule:", error);
			toast.error("Error adding point rule");
		}
	};

	// Edit handlers
	const handleEditEvent = (event) => {
		setEditingEvent(event);
		setEventForm({
			title: event.event_title,
			startDate: event.event_startDate,
			endDate: event.event_endDate,
		});
		setShowAddEventForm(false);
	};

	const handleUpdateEvent = async (e) => {
		e.preventDefault();
		if (!eventForm.title || !eventForm.startDate || !eventForm.endDate) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await updateEvent({
				...eventForm,
				eventId: editingEvent.event_id,
			});
			if (result.success) {
				toast.success("Event updated successfully");
				setEventForm({ title: "", startDate: "", endDate: "" });
				setEditingEvent(null);
				fetchEvents();
			} else {
				toast.error(result.message || "Failed to update event");
			}
		} catch (error) {
			console.error("Error updating event:", error);
			toast.error("Error updating event");
		}
	};

	const handleEditActivity = (activity) => {
		setEditingActivity(activity);
		setActivityForm({
			name: activity.activity_name,
			description: activity.activity_description,
			location: activity.activity_location,
			scorekeeperId: activity.activity_scorekeeperId,
			isSpecial: activity.activity_isSpecial,
			startTime: activity.activity_startTime || "",
			endTime: activity.activity_endTime || "",
		});
		setShowAddActivityForm(false);
	};

	const handleUpdateActivity = async (e) => {
		e.preventDefault();
		if (
			!activityForm.name ||
			!activityForm.description ||
			!activityForm.location ||
			!activityForm.scorekeeperId
		) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await updateActivity({
				...activityForm,
				activityId: editingActivity.activity_id,
			});
			if (result.success) {
				toast.success("Activity updated successfully");
				setActivityForm({
					name: "",
					description: "",
					location: "",
					scorekeeperId: "",
					isSpecial: false,
					startTime: "",
					endTime: "",
				});
				setEditingActivity(null);
				fetchActivities(selectedEvent.event_id);
			} else {
				toast.error(result.message || "Failed to update activity");
			}
		} catch (error) {
			console.error("Error updating activity:", error);
			toast.error("Error updating activity");
		}
	};

	const handleEditPointRule = (pointRule) => {
		setEditingPointRule(pointRule);
		const originalData = {
			place: pointRule.pointrules_place,
			points: pointRule.pointrules_points.toString(),
			allowsMultiple:
				pointRule.pointrules_all === 1 || pointRule.pointrules_all === true,
		};
		setPointRuleForm(originalData);
		setOriginalPointRuleData(originalData); // Store original data
		setShowAddPointRuleForm(false);
	};

	const handleUpdatePointRule = async (e) => {
		e.preventDefault();
		if (!pointRuleForm.place || !pointRuleForm.points) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await updatePointRule({
				...pointRuleForm,
				pointRuleId: editingPointRule.pointrules_id,
			});
			if (result.success) {
				toast.success("Point rule updated successfully");
				setPointRuleForm({ place: "", points: "", allowsMultiple: false });
				setEditingPointRule(null);
				setOriginalPointRuleData(null); // Clear original data
				fetchPointRules(selectedActivity.activity_id);
			} else {
				toast.error(result.message || "Failed to update point rule");
			}
		} catch (error) {
			console.error("Error updating point rule:", error);
			toast.error("Error updating point rule");
		}
	};

	const cancelEdit = () => {
		setEditingEvent(null);
		setEditingActivity(null);
		setEditingPointRule(null);
		setOriginalPointRuleData(null); // Clear original data on cancel
		setEventForm({ title: "", startDate: "", endDate: "" });
		setActivityForm({
			name: "",
			description: "",
			location: "",
			scorekeeperId: "",
			isSpecial: false,
			startTime: "",
			endTime: "",
		});
		setPointRuleForm({ place: "", points: "", allowsMultiple: false });
	};

	const cancelAddForms = () => {
		setShowAddEventForm(false);
		setShowAddActivityForm(false);
		setShowAddPointRuleForm(false);
		setEventForm({ title: "", startDate: "", endDate: "" });
		setActivityForm({
			name: "",
			description: "",
			location: "",
			scorekeeperId: "",
			isSpecial: false,
			startTime: "",
			endTime: "",
		});
		setPointRuleForm({ place: "", points: "", allowsMultiple: false });
	};

	// Delete handlers
	const handleDeleteEvent = (event) => {
		setEventToDelete(event);
		setShowDeleteEventDialog(true);
	};

	const handleDeleteActivity = (activity) => {
		setActivityToDelete(activity);
		setShowDeleteActivityDialog(true);
	};

	const handleDeletePointRule = (pointRule) => {
		setPointRuleToDelete(pointRule);
		setShowDeletePointRuleDialog(true);
	};

	const confirmDeleteEvent = async () => {
		if (!eventToDelete) return;

		try {
			const result = await deleteEvent(eventToDelete.event_id);
			if (result.success) {
				toast.success("Event deleted successfully");
				// Clear the selected event if it was the one deleted
				if (selectedEvent?.event_id === eventToDelete.event_id) {
					setSelectedEvent(null);
					setSelectedActivity(null);
					setActivities([]);
					setPointRules([]);
				}
				// Refresh events
				fetchEvents();
			} else {
				toast.error(result.message || "Failed to delete event");
			}
		} catch (error) {
			console.error("Error deleting event:", error);
			toast.error("Error deleting event");
		} finally {
			setShowDeleteEventDialog(false);
			setEventToDelete(null);
		}
	};

	const confirmDeleteActivity = async () => {
		if (!activityToDelete) return;

		try {
			const result = await deleteActivity(activityToDelete.activity_id);
			if (result.success) {
				toast.success("Activity deleted successfully");
				// Clear the selected activity if it was the one deleted
				if (selectedActivity?.activity_id === activityToDelete.activity_id) {
					setSelectedActivity(null);
					setPointRules([]);
				}
				// Refresh activities
				fetchActivities(selectedEvent.event_id);
			} else {
				toast.error(result.message || "Failed to delete activity");
			}
		} catch (error) {
			console.error("Error deleting activity:", error);
			toast.error("Error deleting activity");
		} finally {
			setShowDeleteActivityDialog(false);
			setActivityToDelete(null);
		}
	};

	const confirmDeletePointRule = async () => {
		if (!pointRuleToDelete) return;

		try {
			const result = await deletePointRule(pointRuleToDelete.pointrules_id);
			if (result.success) {
				toast.success("Point rule deleted successfully");
				// Refresh point rules
				fetchPointRules(selectedActivity.activity_id);
			} else {
				toast.error(result.message || "Failed to delete point rule");
			}
		} catch (error) {
			console.error("Error deleting point rule:", error);
			toast.error("Error deleting point rule");
		} finally {
			setShowDeletePointRuleDialog(false);
			setPointRuleToDelete(null);
		}
	};

	const toggleEventExpansion = (eventId) => {
		const newExpanded = new Set(expandedEvents);
		if (newExpanded.has(eventId)) {
			newExpanded.delete(eventId);
		} else {
			newExpanded.add(eventId);
			const event = events.find((e) => e.event_id === eventId);
			if (event) {
				setSelectedEvent(event);
				fetchActivities(eventId);
			}
		}
		setExpandedEvents(newExpanded);
	};

	const handleActivityClick = (activity) => {
		setSelectedActivity(activity);
		fetchPointRules(activity.activity_id);
		// Switch to point rules view on mobile when activity is selected
		setMobileView("pointRules");
	};

	if (!isOpen) return null;

	return (
		<>
			<Toaster position="top-right" />
			<div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm bg-opacity-50">
				<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg w-full max-w-6xl h-full sm:h-[calc(95vh-2rem)] flex flex-col overflow-hidden">
					{/* Header */}
					<div className="flex justify-between items-center p-4 border-b sm:p-6 dark:border-gray-700">
						<div className="flex flex-1 gap-2 items-center min-w-0 sm:gap-3">
							{/* Back button for mobile point rules view */}
							{mobileView === "pointRules" && (
								<button
									onClick={() => setMobileView("events")}
									className="p-1 text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
								>
									<ArrowLeft className="w-5 h-5" />
								</button>
							)}
							<div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 flex-shrink-0">
								<Calendar className="w-4 h-4 text-blue-600 sm:w-5 sm:h-5 dark:text-blue-400" />
							</div>
							<div className="flex-1 min-w-0">
								<h2 className="text-sm font-semibold text-gray-800 sm:text-xl dark:text-gray-200">
									{mobileView === "pointRules" && selectedActivity ? (
										<span className="md:hidden">Point Rules</span>
									) : (
										"Event Management"
									)}
								</h2>
								<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
									{mobileView === "pointRules" && selectedActivity ? (
										<span className="md:hidden">
											for {selectedActivity.activity_name}
										</span>
									) : (
										"Manage events, activities, and point rules"
									)}
								</p>
							</div>
						</div>
						<div className="flex flex-shrink-0 gap-1 items-center sm:gap-2">
							<button
								onClick={fetchEvents}
								className="p-2 text-gray-600 bg-gray-100 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								title="Refresh"
							>
								<RefreshCw className="w-4 h-4" />
							</button>
							<button
								onClick={onClose}
								className="p-2 text-gray-600 bg-gray-100 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="flex overflow-hidden flex-1">
						{/* Desktop Layout - Two Columns */}
						<div className="hidden overflow-hidden flex-1 md:flex">
							{/* Left Panel - Events */}
							<div className="flex flex-col w-1/3 border-r dark:border-gray-700">
								<div className="p-4 border-b dark:border-gray-700">
									<div className="flex justify-between items-center mb-3">
										<h3 className="font-semibold text-gray-800 dark:text-gray-200">
											Events
										</h3>
										<button
											onClick={() => setShowAddEventForm(true)}
											className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
										>
											<Plus className="w-4 h-4" />
										</button>
									</div>

									{showAddEventForm && (
										<EventForm
											eventForm={eventForm}
											setEventForm={setEventForm}
											onSubmit={handleAddEvent}
											onCancel={cancelAddForms}
										/>
									)}

									{editingEvent && (
										<EventForm
											eventForm={eventForm}
											setEventForm={setEventForm}
											onSubmit={handleUpdateEvent}
											onCancel={cancelEdit}
											isEditing={true}
										/>
									)}
								</div>

								<div className="overflow-y-auto flex-1">
									{loading ? (
										<div className="p-4 text-center text-gray-500">
											Loading...
										</div>
									) : events.length === 0 ? (
										<div className="p-4 text-center text-gray-500">
											No events found
										</div>
									) : (
										events.map((event) => (
											<div
												key={event.event_id}
												className="border-b dark:border-gray-700"
											>
												<div
													onClick={() => toggleEventExpansion(event.event_id)}
													className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
												>
													<div>
														<h4 className="font-medium text-gray-800 dark:text-gray-200">
															{event.event_title}
														</h4>
														<p className="text-sm text-gray-500 dark:text-gray-400">
															{new Date(
																event.event_startDate
															).toLocaleDateString()}{" "}
															-{" "}
															{new Date(
																event.event_endDate
															).toLocaleDateString()}
														</p>
													</div>
													<div className="flex gap-2 items-center">
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleEditEvent(event);
															}}
															className="p-1.5 text-gray-500 rounded hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
															title="Edit Event"
														>
															<Edit className="w-5 h-5" />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteEvent(event);
															}}
															className="p-1.5 text-gray-500 rounded hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
															title="Delete Event"
														>
															<Trash2 className="w-5 h-5" />
														</button>
														{expandedEvents.has(event.event_id) ? (
															<ChevronUp className="w-4 h-4" />
														) : (
															<ChevronDown className="w-4 h-4" />
														)}
													</div>
												</div>

												{expandedEvents.has(event.event_id) && (
													<div className="px-4 pb-4">
														<div className="flex justify-between items-center mb-2">
															<div className="flex items-center gap-2">
																<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																	Activities
																</span>
																{activities.length > 0 && (
																	<div className="flex items-center gap-1 text-xs">
																		{activities.filter(
																			(a) => a.activity_isSpecial
																		).length > 0 && (
																			<span className="text-yellow-600 dark:text-yellow-400">
																				{
																					activities.filter(
																						(a) => a.activity_isSpecial
																					).length
																				}{" "}
																				Special
																			</span>
																		)}
																		<span className="text-gray-500 dark:text-gray-400">
																			({activities.length} total)
																		</span>
																	</div>
																)}
															</div>
															<button
																onClick={() => setShowAddActivityForm(true)}
																className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
															>
																<Plus className="w-4 h-4" />
															</button>
														</div>

														{showAddActivityForm &&
															selectedEvent?.event_id === event.event_id && (
																<ActivityForm
																	activityForm={activityForm}
																	setActivityForm={setActivityForm}
																	scorekeepers={scorekeepers}
																	onSubmit={handleAddActivity}
																	onCancel={cancelAddForms}
																/>
															)}

														{editingActivity && selectedEvent && (
															<ActivityForm
																activityForm={activityForm}
																setActivityForm={setActivityForm}
																scorekeepers={scorekeepers}
																onSubmit={handleUpdateActivity}
																onCancel={cancelEdit}
																isEditing={true}
															/>
														)}

														<ActivityList
															activities={activities}
															selectedActivity={selectedActivity}
															onActivityClick={handleActivityClick}
															onEditActivity={handleEditActivity}
															onDeleteActivity={handleDeleteActivity}
														/>
													</div>
												)}
											</div>
										))
									)}
								</div>
							</div>

							{/* Right Panel - Point Rules */}
							<div className="flex flex-col flex-1">
								<div className="p-4 border-b dark:border-gray-700">
									<div className="flex justify-between items-center mb-3">
										<h3 className="font-semibold text-gray-800 dark:text-gray-200">
											Point Rules
											{selectedActivity && (
												<span className="ml-2 text-sm font-normal text-gray-500">
													for {selectedActivity.activity_name}
												</span>
											)}
										</h3>
										{selectedActivity && (
											<button
												onClick={() => setShowAddPointRuleForm(true)}
												className="p-2 text-yellow-600 bg-yellow-100 rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
											>
												<Plus className="w-4 h-4" />
											</button>
										)}
									</div>

									{showAddPointRuleForm && selectedActivity && (
										<PointRuleForm
											pointRuleForm={pointRuleForm}
											setPointRuleForm={setPointRuleForm}
											onSubmit={handleAddPointRule}
											onCancel={() => setShowAddPointRuleForm(false)}
										/>
									)}

									{editingPointRule && selectedActivity && (
										<PointRuleForm
											pointRuleForm={pointRuleForm}
											setPointRuleForm={setPointRuleForm}
											onSubmit={handleUpdatePointRule}
											onCancel={cancelEdit}
											isEditing={true}
											originalData={originalPointRuleData}
										/>
									)}
								</div>

								<div className="overflow-y-auto flex-1 p-4">
									<PointRuleList
										pointRules={pointRules}
										selectedActivity={selectedActivity}
										onEditPointRule={handleEditPointRule}
										onDeletePointRule={handleDeletePointRule}
									/>
								</div>
							</div>
						</div>

						{/* Mobile Layout - Single Column with Navigation */}
						<div className="flex overflow-hidden flex-col flex-1 md:hidden">
							{/* Mobile Events View */}
							{mobileView === "events" && (
								<>
									<div className="p-4 border-b dark:border-gray-700">
										<div className="flex justify-between items-center mb-3">
											<h3 className="font-semibold text-gray-800 dark:text-gray-200">
												Events
											</h3>
											<button
												onClick={() => setShowAddEventForm(true)}
												className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
											>
												<Plus className="w-4 h-4" />
											</button>
										</div>

										{showAddEventForm && (
											<EventForm
												eventForm={eventForm}
												setEventForm={setEventForm}
												onSubmit={handleAddEvent}
												onCancel={cancelAddForms}
											/>
										)}

										{editingEvent && (
											<EventForm
												eventForm={eventForm}
												setEventForm={setEventForm}
												onSubmit={handleUpdateEvent}
												onCancel={cancelEdit}
												isEditing={true}
											/>
										)}
									</div>

									<div className="overflow-y-auto flex-1">
										{loading ? (
											<div className="p-4 text-center text-gray-500">
												Loading...
											</div>
										) : events.length === 0 ? (
											<div className="p-4 text-center text-gray-500">
												No events found
											</div>
										) : (
											events.map((event) => (
												<div
													key={event.event_id}
													className="border-b dark:border-gray-700"
												>
													<div
														onClick={() => toggleEventExpansion(event.event_id)}
														className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
													>
														<div>
															<h4 className="font-medium text-gray-800 dark:text-gray-200">
																{event.event_title}
															</h4>
															<p className="text-sm text-gray-500 dark:text-gray-400">
																{new Date(
																	event.event_startDate
																).toLocaleDateString()}{" "}
																-{" "}
																{new Date(
																	event.event_endDate
																).toLocaleDateString()}
															</p>
														</div>
														<div className="flex gap-2 items-center">
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleEditEvent(event);
																}}
																className="p-1.5 text-gray-500 rounded hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
																title="Edit Event"
															>
																<Edit className="w-5 h-5" />
															</button>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleDeleteEvent(event);
																}}
																className="p-1.5 text-gray-500 rounded hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
																title="Delete Event"
															>
																<Trash2 className="w-5 h-5" />
															</button>
															{expandedEvents.has(event.event_id) ? (
																<ChevronUp className="w-4 h-4" />
															) : (
																<ChevronDown className="w-4 h-4" />
															)}
														</div>
													</div>

													{expandedEvents.has(event.event_id) && (
														<div className="px-4 pb-4">
															<div className="flex justify-between items-center mb-2">
																<div className="flex items-center gap-2">
																	<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																		Activities
																	</span>
																	{activities.length > 0 && (
																		<div className="flex items-center gap-1 text-xs">
																			{activities.filter(
																				(a) => a.activity_isSpecial
																			).length > 0 && (
																				<span className="text-yellow-600 dark:text-yellow-400">
																					{
																						activities.filter(
																							(a) => a.activity_isSpecial
																						).length
																					}{" "}
																					Special
																				</span>
																			)}
																			<span className="text-gray-500 dark:text-gray-400">
																				({activities.length} total)
																			</span>
																		</div>
																	)}
																</div>
																<button
																	onClick={() => setShowAddActivityForm(true)}
																	className="p-1.5 text-green-600 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
																>
																	<Plus className="w-4 h-4" />
																</button>
															</div>

															{showAddActivityForm &&
																selectedEvent?.event_id === event.event_id && (
																	<ActivityForm
																		activityForm={activityForm}
																		setActivityForm={setActivityForm}
																		scorekeepers={scorekeepers}
																		onSubmit={handleAddActivity}
																		onCancel={cancelAddForms}
																	/>
																)}

															{editingActivity && selectedEvent && (
																<ActivityForm
																	activityForm={activityForm}
																	setActivityForm={setActivityForm}
																	scorekeepers={scorekeepers}
																	onSubmit={handleUpdateActivity}
																	onCancel={cancelEdit}
																	isEditing={true}
																/>
															)}

															<ActivityList
																activities={activities}
																selectedActivity={selectedActivity}
																onActivityClick={handleActivityClick}
																onEditActivity={handleEditActivity}
																onDeleteActivity={handleDeleteActivity}
															/>
														</div>
													)}
												</div>
											))
										)}
									</div>
								</>
							)}

							{/* Mobile Point Rules View */}
							{mobileView === "pointRules" && (
								<>
									<div className="p-4 border-b dark:border-gray-700">
										<div className="flex justify-between items-center mb-3">
											<h3 className="font-semibold text-gray-800 dark:text-gray-200">
												Point Rules
												{selectedActivity && (
													<span className="block text-sm font-normal text-gray-500">
														for {selectedActivity.activity_name}
													</span>
												)}
											</h3>
											{selectedActivity && (
												<button
													onClick={() => setShowAddPointRuleForm(true)}
													className="p-2 text-yellow-600 bg-yellow-100 rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
												>
													<Plus className="w-4 h-4" />
												</button>
											)}
										</div>

										{showAddPointRuleForm && selectedActivity && (
											<PointRuleForm
												pointRuleForm={pointRuleForm}
												setPointRuleForm={setPointRuleForm}
												onSubmit={handleAddPointRule}
												onCancel={() => setShowAddPointRuleForm(false)}
											/>
										)}

										{editingPointRule && selectedActivity && (
											<PointRuleForm
												pointRuleForm={pointRuleForm}
												setPointRuleForm={setPointRuleForm}
												onSubmit={handleUpdatePointRule}
												onCancel={cancelEdit}
												isEditing={true}
												originalData={originalPointRuleData}
											/>
										)}
									</div>

									<div className="overflow-y-auto flex-1 p-4">
										<PointRuleList
											pointRules={pointRules}
											selectedActivity={selectedActivity}
											onEditPointRule={handleEditPointRule}
											onDeletePointRule={handleDeletePointRule}
										/>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialogs */}
			<ConfirmDialog
				isOpen={showDeleteEventDialog}
				onClose={() => {
					setShowDeleteEventDialog(false);
					setEventToDelete(null);
				}}
				onConfirm={confirmDeleteEvent}
				title="Delete Event"
				message={`Are you sure you want to delete "${eventToDelete?.event_title}"? This action cannot be undone and will also remove all associated activities, point rules, and scores.`}
				confirmText="Delete Event"
				cancelText="Cancel"
				type="danger"
			/>

			<ConfirmDialog
				isOpen={showDeleteActivityDialog}
				onClose={() => {
					setShowDeleteActivityDialog(false);
					setActivityToDelete(null);
				}}
				onConfirm={confirmDeleteActivity}
				title="Delete Activity"
				message={`Are you sure you want to delete "${activityToDelete?.activity_name}"? This action cannot be undone and will also remove all associated point rules and scores.`}
				confirmText="Delete Activity"
				cancelText="Cancel"
				type="danger"
			/>

			<ConfirmDialog
				isOpen={showDeletePointRuleDialog}
				onClose={() => {
					setShowDeletePointRuleDialog(false);
					setPointRuleToDelete(null);
				}}
				onConfirm={confirmDeletePointRule}
				title="Delete Point Rule"
				message={`Are you sure you want to delete the "${pointRuleToDelete?.pointrules_place}" point rule (${pointRuleToDelete?.pointrules_points} points)? This action cannot be undone and will also remove all associated scores.`}
				confirmText="Delete Point Rule"
				cancelText="Cancel"
				type="danger"
			/>
		</>
	);
};

export default EventManagementModal;
