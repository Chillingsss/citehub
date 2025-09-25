import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
	getStudentsInTribe,
	getActivities,
	getActivityParticipants,
	addActivityParticipant,
	removeActivityParticipant,
	getFacultyTribeScores,
	getFacultyTribeInfo,
} from "../utils/faculty";

export const useTallyModal = (isOpen, facultyId) => {
	const [students, setStudents] = useState([]);
	const [activities, setActivities] = useState([]);
	const [selectedActivity, setSelectedActivity] = useState(null);
	const [participants, setParticipants] = useState([]);
	const [scores, setScores] = useState([]);
	const [tribeInfo, setTribeInfo] = useState(null);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(3);
	const [touchStart, setTouchStart] = useState(null);
	const [touchEnd, setTouchEnd] = useState(null);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (isOpen && facultyId) {
			fetchStudentsInTribe();
			fetchActivities();
			fetchTribeScores();
			fetchTribeInfo();
		}
	}, [isOpen, facultyId]);

	useEffect(() => {
		if (selectedActivity && facultyId) {
			fetchActivityParticipants();
		}
	}, [selectedActivity, facultyId]);

	// Update items per page based on screen size
	useEffect(() => {
		const updateItemsPerPage = () => {
			const isMobileDevice = window.innerWidth < 640;
			setIsMobile(isMobileDevice);

			if (isMobileDevice) {
				setItemsPerPage(1); // Mobile: 1 item
			} else if (window.innerWidth < 1024) {
				setItemsPerPage(2); // Tablet: 2 items
			} else {
				setItemsPerPage(3); // Desktop: 3 items
			}
		};

		updateItemsPerPage();
		window.addEventListener("resize", updateItemsPerPage);
		return () => window.removeEventListener("resize", updateItemsPerPage);
	}, []);

	// Reset carousel when activities change
	useEffect(() => {
		setCurrentActivityIndex(0);
		// Auto-select first activity when activities load (mobile only)
		if (activities.length > 0 && isMobile) {
			setSelectedActivity(activities[0]);
		}
	}, [activities, isMobile]);

	// Helper function to get visible activities
	const getVisibleActivities = () => {
		return activities.slice(
			currentActivityIndex,
			currentActivityIndex + itemsPerPage
		);
	};

	// Auto-select first visible activity when navigating carousel (mobile only)
	useEffect(() => {
		if (isMobile) {
			const visibleActivities = getVisibleActivities();
			if (visibleActivities.length > 0) {
				setSelectedActivity(visibleActivities[0]);
			}
		}
	}, [currentActivityIndex, activities, itemsPerPage, isMobile]);

	const fetchStudentsInTribe = async () => {
		try {
			const result = await getStudentsInTribe(facultyId);
			if (result.success) {
				console.log("Fetched students:", result.students);
				setStudents(result.students);
			} else {
				console.warn("Failed to fetch students:", result);
				setStudents([]);
			}
		} catch (error) {
			console.error("Error fetching students:", error);
			setStudents([]);
		}
	};

	const fetchActivities = async () => {
		try {
			const result = await getActivities();
			if (result.success) {
				console.log("Fetched activities:", result.activities);
				setActivities(result.activities);
			} else {
				console.warn("Failed to fetch activities:", result);
				setActivities([]);
			}
		} catch (error) {
			console.error("Error fetching activities:", error);
			setActivities([]);
		}
	};

	const fetchActivityParticipants = async () => {
		if (!selectedActivity) return;

		try {
			const result = await getActivityParticipants(
				selectedActivity.activity_id,
				facultyId
			);
			if (result.success) {
				console.log("Fetched participants:", result.participants);
				setParticipants(result.participants);
			} else {
				console.warn("Failed to fetch participants:", result);
				setParticipants([]);
			}
		} catch (error) {
			console.error("Error fetching participants:", error);
			setParticipants([]);
		}
	};

	const fetchTribeScores = async () => {
		try {
			const result = await getFacultyTribeScores(facultyId);
			if (result.success) {
				console.log("Fetched tribe scores:", result.scores);
				setScores(result.scores);
			} else {
				console.warn("Failed to fetch tribe scores:", result);
				setScores([]);
			}
		} catch (error) {
			console.error("Error fetching tribe scores:", error);
			setScores([]);
		}
	};

	const fetchTribeInfo = async () => {
		try {
			const result = await getFacultyTribeInfo(facultyId);
			if (result.success) {
				console.log("Fetched tribe info:", result.tribeInfo);
				console.log("Special bonus:", result.tribeInfo.special_bonus);
				console.log("Display points:", result.tribeInfo.display_points);
				console.log("Total points:", result.tribeInfo.total_points);
				setTribeInfo(result.tribeInfo);
			} else {
				console.warn("Failed to fetch tribe info:", result);
				setTribeInfo(null);
			}
		} catch (error) {
			console.error("Error fetching tribe info:", error);
			setTribeInfo(null);
		}
	};

	const handleRefresh = () => {
		fetchStudentsInTribe();
		fetchActivities();
		fetchTribeScores();
		fetchTribeInfo();
		if (selectedActivity) {
			fetchActivityParticipants();
		}
		toast.success("Data refreshed successfully!", {
			duration: 2000,
		});
	};

	const handleAddParticipant = async (studentId) => {
		if (!selectedActivity) {
			toast.error("Please select an activity first");
			return;
		}

		setLoading(true);
		try {
			const result = await addActivityParticipant(
				facultyId,
				studentId,
				selectedActivity.activity_id
			);

			if (result.success) {
				const student = students.find((s) => s.user_id === studentId);
				const studentName = student
					? `${student.user_name}`
					: `Student ${studentId}`;

				toast.success(
					`${studentName} added to ${selectedActivity.activity_name}`,
					{
						duration: 1000,
					}
				);

				fetchActivityParticipants(); // Refresh participants list
			} else {
				toast.error(result.message || "Error adding participant", {
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error adding participant:", error);
			toast.error("Failed to add participant. Please try again.", {
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveParticipant = async (studentId) => {
		if (!selectedActivity) {
			toast.error("Please select an activity first");
			return;
		}

		setLoading(true);
		try {
			const result = await removeActivityParticipant(
				facultyId,
				studentId,
				selectedActivity.activity_id
			);

			if (result.success) {
				const student = students.find((s) => s.user_id === studentId);
				const studentName = student
					? `${student.user_name}`
					: `Student ${studentId}`;

				toast.success(
					`${studentName} removed from ${selectedActivity.activity_name}`,
					{
						duration: 1000,
					}
				);

				fetchActivityParticipants(); // Refresh participants list
			} else {
				toast.error(result.message || "Error removing participant", {
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error removing participant:", error);
			toast.error("Failed to remove participant. Please try again.", {
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	// Touch/swipe handlers for mobile
	const minSwipeDistance = 50;

	const onTouchStart = (e) => {
		setTouchEnd(null);
		setTouchStart(e.targetTouches[0].clientX);
	};

	const onTouchMove = (e) => {
		setTouchEnd(e.targetTouches[0].clientX);
	};

	const onTouchEnd = () => {
		if (!touchStart || !touchEnd) return;

		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > minSwipeDistance;
		const isRightSwipe = distance < -minSwipeDistance;
		const canGoPrevious = currentActivityIndex > 0;
		const canGoNext = currentActivityIndex + itemsPerPage < activities.length;

		if (isLeftSwipe && canGoNext) {
			const maxIndex = Math.max(0, activities.length - itemsPerPage);
			setCurrentActivityIndex((prev) =>
				Math.min(maxIndex, prev + itemsPerPage)
			);
		}
		if (isRightSwipe && canGoPrevious) {
			setCurrentActivityIndex((prev) => Math.max(0, prev - itemsPerPage));
		}
	};

	return {
		// State
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

		// Handlers
		handleRefresh,
		handleAddParticipant,
		handleRemoveParticipant,
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	};
};
