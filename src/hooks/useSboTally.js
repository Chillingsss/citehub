import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
	getSboActivities,
	getActivityPointRules,
	getActivityScores,
	addScore,
	removeScore,
	getAllTribes,
} from "../utils/sbo";

export const useSboTally = (isOpen, sboId) => {
	// Core state
	const [activities, setActivities] = useState([]);
	const [selectedActivity, setSelectedActivity] = useState(null);
	const [pointRules, setPointRules] = useState([]);
	const [scores, setScores] = useState([]);
	const [tribes, setTribes] = useState([]);
	const [loading, setLoading] = useState(false);

	// Scoring state
	const [selectedPointRule, setSelectedPointRule] = useState(null);
	const [selectedTribe, setSelectedTribe] = useState(null);
	const [showTribeSelector, setShowTribeSelector] = useState(false);
	const [selectedTribesForParticipation, setSelectedTribesForParticipation] =
		useState([]);

	// Confirmation dialog state
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [scoreToDelete, setScoreToDelete] = useState(null);

	// Carousel state
	const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(3);
	const [touchStart, setTouchStart] = useState(null);
	const [touchEnd, setTouchEnd] = useState(null);
	const [isMobile, setIsMobile] = useState(false);

	// Initialize data when modal opens
	useEffect(() => {
		if (isOpen && sboId) {
			fetchActivities();
			fetchTribes();
		}
	}, [isOpen, sboId]);

	// Fetch activity data when selected activity changes
	useEffect(() => {
		if (selectedActivity) {
			fetchActivityData();
		}
	}, [selectedActivity]);

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
		if (activities.length > 0) {
			// On mobile, automatically select the first activity
			// On desktop, let user manually select
			if (isMobile || !selectedActivity) {
				setSelectedActivity(activities[0]);
			}
		}
	}, [activities, isMobile]);

	// Auto-select activity on mobile when carousel index changes
	useEffect(() => {
		if (isMobile && activities.length > 0) {
			const visibleActivities = getVisibleActivities();
			if (visibleActivities.length > 0) {
				setSelectedActivity(visibleActivities[0]);
			}
		}
	}, [currentActivityIndex, isMobile, activities]);

	// API functions
	const fetchActivities = async () => {
		try {
			const result = await getSboActivities(sboId);
			if (result.success) {
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

	const fetchTribes = async () => {
		try {
			const result = await getAllTribes();
			if (result.success) {
				setTribes(result.tribes);
			} else {
				console.warn("Failed to fetch tribes:", result);
				setTribes([]);
			}
		} catch (error) {
			console.error("Error fetching tribes:", error);
			setTribes([]);
		}
	};

	const fetchActivityData = async () => {
		if (!selectedActivity) return;

		setLoading(true);
		try {
			const [pointRulesResult, scoresResult] = await Promise.all([
				getActivityPointRules(selectedActivity.activity_id),
				getActivityScores(selectedActivity.activity_id),
			]);

			if (pointRulesResult.success) {
				setPointRules(pointRulesResult.pointRules);
			} else {
				setPointRules([]);
			}

			if (scoresResult.success) {
				setScores(scoresResult.scores);
			} else {
				setScores([]);
			}
		} catch (error) {
			console.error("Error fetching activity data:", error);
			setPointRules([]);
			setScores([]);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		try {
			const loadingToast = toast.loading("Refreshing tally data...");

			await Promise.all([fetchActivities(), fetchTribes()]);

			if (selectedActivity) {
				await fetchActivityData();
			}

			toast.dismiss(loadingToast);
			toast.success("Tally data refreshed successfully!", {
				duration: 2000,
			});
		} catch (error) {
			console.error("Error refreshing data:", error);
			toast.error("Failed to refresh tally data", { duration: 3000 });
		}
	};

	// Scoring functions
	const handleAddScore = async (
		tribe = selectedTribe,
		pointRule = selectedPointRule
	) => {
		if (!pointRule || !tribe) {
			toast.error("Please select both a place and a tribe");
			return;
		}

		// Handle multiple tribe selection differently - just add to selected list
		if (allowsMultipleTribes(pointRule)) {
			// For participation scoring, we need to be more careful about which tribes to exclude
			// We should exclude tribes that have REGULAR placement scores (1st, 2nd, 3rd, etc.)
			// But allow tribes that only have participation scores to be selected again

			// Get tribes that have regular placement scores (exclude participation)
			const tribesWithRegularScores = scores
				.filter((score) => {
					// Find the point rule for this score
					const pointRule = pointRules.find(
						(pr) => pr.pointrules_id === score.score_pointruleId
					);
					// Exclude if this is a participation score (pointrules_all = 1)
					return (
						pointRule &&
						pointRule.pointrules_all !== 1 &&
						pointRule.pointrules_all !== true
					);
				})
				.map((score) => score.score_tribeId);

			// Check if this tribe has a regular score
			if (tribesWithRegularScores.includes(tribe.tribe_id)) {
				toast.error(
					`${tribe.tribe_name} already has a placement score for this activity and cannot receive participation points`
				);
				return;
			}

			// Check if already selected for multiple tribe scoring
			if (
				selectedTribesForParticipation.find(
					(t) => t.tribe_id === tribe.tribe_id
				)
			) {
				// Remove from selection if already selected
				setSelectedTribesForParticipation((prev) =>
					prev.filter((t) => t.tribe_id !== tribe.tribe_id)
				);
				toast.success(`${tribe.tribe_name} removed from selection`);
			} else {
				// Add to selection
				setSelectedTribesForParticipation((prev) => [...prev, tribe]);
				toast.success(`${tribe.tribe_name} added to selection`);
			}
			return;
		}

		// Handle regular scoring (single tribe selection)
		setLoading(true);
		try {
			const result = await addScore(
				sboId,
				selectedActivity.activity_id,
				tribe.tribe_id,
				pointRule.pointrules_id,
				false
			);

			if (result.success) {
				toast.success(result.message || "Score recorded successfully!");
				setShowTribeSelector(false);
				setSelectedPointRule(null);
				setSelectedTribe(null);
				await fetchActivityData();
			} else {
				toast.error(result.message || "Failed to record score");
			}
		} catch (error) {
			console.error("Error adding score:", error);
			toast.error("Failed to record score. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveScore = async (scoreId) => {
		setScoreToDelete(scoreId);
		setShowConfirmDialog(true);
	};

	const confirmRemoveScore = async () => {
		if (!scoreToDelete) return;

		setLoading(true);
		try {
			const result = await removeScore(sboId, scoreToDelete);

			if (result.success) {
				toast.success(result.message || "Score removed successfully!");
				setShowConfirmDialog(false);
				setScoreToDelete(null);
				await fetchActivityData();
			} else {
				toast.error(result.message || "Failed to remove score");
			}
		} catch (error) {
			console.error("Error removing score:", error);
			toast.error("Failed to remove score. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const cancelRemoveScore = () => {
		setShowConfirmDialog(false);
		setScoreToDelete(null);
	};

	const handleSaveParticipationScores = async () => {
		if (selectedTribesForParticipation.length === 0) {
			toast.error("Please select at least one tribe for scoring");
			return;
		}

		console.log("🚀 STARTING MULTIPLE TRIBE SAVE:");
		console.log(
			"Selected tribes:",
			selectedTribesForParticipation.map((t) => ({
				id: t.tribe_id,
				name: t.tribe_name,
			}))
		);
		console.log(
			"Current scores:",
			scores.map((s) => ({
				tribeId: s.score_tribeId,
				tribeName: s.tribe_name,
				place: s.pointrules_place,
			}))
		);

		setLoading(true);
		try {
			// Store the original selected tribes for error reporting
			const originalSelectedTribes = [...selectedTribesForParticipation];

			// CRITICAL: Get fresh data from backend before filtering
			console.log("🔄 Getting fresh scores data before save...");

			// Add a small delay to ensure backend has processed any recent changes
			await new Promise((resolve) => setTimeout(resolve, 500));

			const freshScoresResult = await getActivityScores(
				selectedActivity.activity_id
			);
			let currentScores = scores; // fallback to current scores

			if (freshScoresResult.success) {
				currentScores = freshScoresResult.scores;
				console.log(
					"✅ Fresh scores loaded:",
					currentScores.map((s) => ({
						tribeId: s.score_tribeId,
						tribeName: s.tribe_name,
						place: s.pointrules_place,
					}))
				);
			} else {
				console.log("⚠️ Failed to get fresh scores, using current scores");
			}

			// Filter out tribes that already have scores using FRESH data
			const tribesWithAnyScore = currentScores.map(
				(score) => score.score_tribeId
			);
			const validTribes = selectedTribesForParticipation.filter(
				(tribe) => !tribesWithAnyScore.includes(tribe.tribe_id)
			);

			console.log("🔍 FILTERING RESULTS (with fresh data):");
			console.log("Tribes with any score (IDs):", tribesWithAnyScore);
			console.log(
				"Valid tribes after filtering:",
				validTribes.map((t) => ({ id: t.tribe_id, name: t.tribe_name }))
			);

			// Debug each selected tribe individually
			selectedTribesForParticipation.forEach((tribe) => {
				const hasScore = tribesWithAnyScore.includes(tribe.tribe_id);
				console.log(
					`🔍 Tribe ${tribe.tribe_name} (ID: ${tribe.tribe_id}): ${
						hasScore ? "❌ HAS SCORE" : "✅ NO SCORE"
					}`
				);
			});

			if (validTribes.length === 0) {
				toast.error(
					"All selected tribes already have scores for this activity"
				);
				setSelectedTribesForParticipation([]);
				setShowTribeSelector(false);
				setSelectedPointRule(null);
				setSelectedTribe(null);
				setLoading(false);
				return;
			}

			if (validTribes.length < originalSelectedTribes.length) {
				const invalidTribes = originalSelectedTribes.filter(
					(tribe) => !validTribes.includes(tribe)
				);
				console.log(
					"⚠️ Invalid tribes being skipped:",
					invalidTribes.map((t) => t.tribe_name)
				);
				toast.warning(
					`Skipping ${invalidTribes
						.map((t) => t.tribe_name)
						.join(", ")} - already have scores`
				);
			}

			// Use the selected point rule's ID and the multiple tribes flag
			const pointRuleId = selectedPointRule.pointrules_id;
			const isMultipleTribeRule = allowsMultipleTribes(selectedPointRule);

			console.log("🎯 SCORING FLAGS:");
			console.log("Point rule ID:", pointRuleId);
			console.log("Is multiple tribe rule:", isMultipleTribeRule);
			console.log("Point rule place:", selectedPointRule.pointrules_place);

			const promises = validTribes.map((tribe) =>
				addScore(
					sboId,
					selectedActivity.activity_id,
					tribe.tribe_id,
					pointRuleId,
					isMultipleTribeRule
				)
			);

			const results = await Promise.all(promises);
			const successful = results.filter((result) => result.success);
			const failed = results.filter((result) => !result.success);

			console.log("📊 SAVE RESULTS:");
			console.log("Successful saves:", successful.length);
			console.log("Failed saves:", failed.length);
			console.log("Failed details:", failed);

			// Log detailed error messages for failed saves
			if (failed.length > 0) {
				failed.forEach((failedResult, index) => {
					const tribeIndex = results.indexOf(failedResult);
					const tribeName =
						validTribes[tribeIndex]?.tribe_name || `Unknown Tribe ${index}`;
					console.log(
						`❌ Failed to save ${tribeName}: ${
							failedResult.message || "No error message"
						}`
					);
				});
			}

			// Reset selection and close selector FIRST
			setSelectedTribesForParticipation([]);
			setShowTribeSelector(false);
			setSelectedPointRule(null);
			setSelectedTribe(null);

			// Refresh data to get the latest scores - CRITICAL: Wait for this to complete
			console.log("🔄 Refreshing activity data...");
			await fetchActivityData();
			console.log("✅ Activity data refreshed");

			// Show success/error messages AFTER data refresh
			if (successful.length > 0) {
				toast.success(
					`${successful.length} score${
						successful.length > 1 ? "s" : ""
					} saved successfully!`
				);
			}

			if (failed.length > 0) {
				// Map failed results to tribe names correctly
				const failedTribeNames = [];
				failed.forEach((failedResult) => {
					const failedIndex = results.indexOf(failedResult);
					if (failedIndex !== -1 && validTribes[failedIndex]) {
						failedTribeNames.push(validTribes[failedIndex].tribe_name);
					}
				});

				if (failedTribeNames.length > 0) {
					toast.error(
						`Failed to save scores for: ${failedTribeNames.join(", ")}`
					);
				} else {
					toast.error(`${failed.length} scores failed to save`);
				}
			}
		} catch (error) {
			console.error("Error saving multiple tribe scores:", error);
			toast.error("Failed to save scores. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Utility functions
	const getAvailablePointRules = () => {
		const usedPointRuleIds = scores.map((score) => score.score_pointruleId);

		// Filter point rules, but handle participation rules differently
		return pointRules.filter((rule) => {
			// If this rule allows multiple tribes (participation), check if there are still tribes available
			if (rule.pointrules_all === 1 || rule.pointrules_all === true) {
				// For participation rules, check if there are still tribes available for participation
				const availableTribesForParticipation =
					getAvailableTribesForParticipation();
				return availableTribesForParticipation.length > 0;
			}

			// For regular placement rules, hide if already used
			return !usedPointRuleIds.includes(rule.pointrules_id);
		});
	};

	const getParticipationPointRule = () => {
		// Find rules that allow multiple tribes using the database flag
		return pointRules.find(
			(rule) => rule.pointrules_all === 1 || rule.pointrules_all === true
		);
	};

	// Helper function to check if a point rule allows multiple tribes
	const allowsMultipleTribes = (pointRule) => {
		if (!pointRule) return false;
		return pointRule.pointrules_all === 1 || pointRule.pointrules_all === true;
	};

	const hasAnyPointRules = () => {
		// Check if the activity has any point rules configured at all
		return pointRules.length > 0;
	};

	const getAvailableTribes = () => {
		const usedTribeIds = scores.map((score) => score.score_tribeId);
		return tribes.filter((tribe) => !usedTribeIds.includes(tribe.tribe_id));
	};

	const getAvailableTribesForParticipation = () => {
		// For participation scoring, we need to exclude tribes that:
		// 1. Have regular placement scores (1st, 2nd, 3rd, etc.)
		// 2. Already have participation scores

		// Get tribes that have regular placement scores (exclude participation)
		const tribesWithRegularScores = scores
			.filter((score) => {
				// Find the point rule for this score
				const pointRule = pointRules.find(
					(pr) => pr.pointrules_id === score.score_pointruleId
				);
				// Exclude if this is a participation score (pointrules_all = 1)
				return (
					pointRule &&
					pointRule.pointrules_all !== 1 &&
					pointRule.pointrules_all !== true
				);
			})
			.map((score) => score.score_tribeId);

		// Get tribes that already have participation scores
		const tribesWithParticipationScores = scores
			.filter((score) => {
				const pointRule = pointRules.find(
					(pr) => pr.pointrules_id === score.score_pointruleId
				);
				// Include if this is a participation score
				return (
					pointRule &&
					(pointRule.pointrules_all === 1 || pointRule.pointrules_all === true)
				);
			})
			.map((score) => score.score_tribeId);

		// For participation scoring, we want to show:
		// 1. Tribes with no scores at all
		// 2. Exclude tribes that have regular placement scores
		// 3. Exclude tribes that already have participation scores

		const availableTribes = tribes.filter((tribe) => {
			const hasRegularScore = tribesWithRegularScores.includes(tribe.tribe_id);
			const hasParticipationScore = tribesWithParticipationScores.includes(
				tribe.tribe_id
			);

			// Only include tribes with no scores at all
			return !hasRegularScore && !hasParticipationScore;
		});

		// Debug logging
		if (availableTribes.length === 0 && tribes.length > 0) {
			console.log("⚠️ No tribes available for participation");
			console.log(
				"All tribes:",
				tribes.map((t) => ({ id: t.tribe_id, name: t.tribe_name }))
			);
			console.log("Tribes with regular scores:", tribesWithRegularScores);
			console.log(
				"Tribes with participation scores:",
				tribesWithParticipationScores
			);
		}

		return availableTribes;
	};

	// Carousel navigation functions
	const goToPrevious = () => {
		setCurrentActivityIndex((prev) => Math.max(0, prev - itemsPerPage));
	};

	const goToNext = () => {
		const maxIndex = Math.max(0, activities.length - itemsPerPage);
		setCurrentActivityIndex((prev) => Math.min(maxIndex, prev + itemsPerPage));
	};

	const canGoPrevious = currentActivityIndex > 0;
	const canGoNext = currentActivityIndex + itemsPerPage < activities.length;

	const getVisibleActivities = () => {
		return activities.slice(
			currentActivityIndex,
			currentActivityIndex + itemsPerPage
		);
	};

	// Touch handlers for mobile swipe
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

		if (isLeftSwipe && canGoNext) {
			goToNext();
		}
		if (isRightSwipe && canGoPrevious) {
			goToPrevious();
		}
	};

	return {
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
	};
};
