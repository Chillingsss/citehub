import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
	getTribes,
	addTribe,
	updateTribe,
	deleteTribe,
} from "../../utils/admin";
import ConfirmDialog from "../ui/ConfirmDialog";

// Add keyframe animation
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default function Tribe() {
	const [tribes, setTribes] = useState([]);
	const [isAddingTribe, setIsAddingTribe] = useState(false);
	const [isEditingTribe, setIsEditingTribe] = useState(false);
	const [selectedTribe, setSelectedTribe] = useState(null);
	const [tribeName, setTribeName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false,
		tribeId: null,
		tribeName: "",
	});

	useEffect(() => {
		fetchTribes();
	}, []);

	const fetchTribes = async () => {
		try {
			setLoading(true);
			const response = await getTribes();
			if (response.success) {
				setTribes(response.tribes);
			}
		} catch (error) {
			console.error("Error fetching tribes:", error);
			setError("Failed to fetch tribes");
		} finally {
			setLoading(false);
		}
	};

	const handleAddTribe = async () => {
		try {
			if (!tribeName.trim()) {
				setError("Tribe name is required");
				return;
			}

			const response = await addTribe({ tribeName: tribeName.trim() });
			if (response.success) {
				await fetchTribes();
				setTribeName("");
				setIsAddingTribe(false);
				setError("");
			} else {
				setError(response.message || "Failed to add tribe");
			}
		} catch (error) {
			console.error("Error adding tribe:", error);
			setError("Failed to add tribe");
		}
	};

	const handleUpdateTribe = async () => {
		try {
			if (!tribeName.trim()) {
				setError("Tribe name is required");
				return;
			}

			const response = await updateTribe({
				tribeId: selectedTribe.tribe_id,
				tribeName: tribeName.trim(),
			});

			if (response.success) {
				await fetchTribes();
				setTribeName("");
				setIsEditingTribe(false);
				setSelectedTribe(null);
				setError("");
			} else {
				setError(response.message || "Failed to update tribe");
			}
		} catch (error) {
			console.error("Error updating tribe:", error);
			setError("Failed to update tribe");
		}
	};

	const handleDeleteTribe = async (tribeId) => {
		const tribe = tribes.find((t) => t.tribe_id === tribeId);
		setConfirmDialog({
			isOpen: true,
			tribeId: tribeId,
			tribeName: tribe?.tribe_name || "",
		});
	};

	const confirmDeleteTribe = async () => {
		try {
			const response = await deleteTribe(confirmDialog.tribeId);
			if (response.success) {
				await fetchTribes();
				setConfirmDialog({ isOpen: false, tribeId: null, tribeName: "" });
			} else {
				setError(response.message || "Failed to delete tribe");
				setConfirmDialog({ isOpen: false, tribeId: null, tribeName: "" });
			}
		} catch (error) {
			console.error("Error deleting tribe:", error);
			setError("Failed to delete tribe");
			setConfirmDialog({ isOpen: false, tribeId: null, tribeName: "" });
		}
	};

	const cancelDeleteTribe = () => {
		setConfirmDialog({ isOpen: false, tribeId: null, tribeName: "" });
	};

	const startEdit = (tribe) => {
		setSelectedTribe(tribe);
		setTribeName(tribe.tribe_name);
		setIsEditingTribe(true);
		setError("");
	};

	const cancelEdit = () => {
		setIsAddingTribe(false);
		setIsEditingTribe(false);
		setSelectedTribe(null);
		setTribeName("");
		setError("");
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{/* Error Message */}
				{error && (
					<div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">
						{error}
					</div>
				)}

				{/* Add/Edit Form */}
				<div
					className={`transform transition-all duration-200 ${
						isAddingTribe || isEditingTribe
							? "opacity-100 translate-y-0 h-auto"
							: "opacity-0 -translate-y-4 h-0 overflow-hidden"
					}`}
				>
					<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div className="flex gap-2">
							<input
								type="text"
								value={tribeName}
								onChange={(e) => setTribeName(e.target.value)}
								placeholder="Enter tribe name"
								className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										isEditingTribe ? handleUpdateTribe() : handleAddTribe();
									}
								}}
							/>
							<button
								onClick={isEditingTribe ? handleUpdateTribe : handleAddTribe}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								{isEditingTribe ? "Update" : "Add"}
							</button>
							<button
								onClick={cancelEdit}
								className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>

				{/* Add Button */}
				{!isAddingTribe && !isEditingTribe && (
					<button
						onClick={() => setIsAddingTribe(true)}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform transition-all duration-200 hover:scale-[1.02]"
					>
						<Plus className="w-4 h-4" />
						Add New Tribe
					</button>
				)}

				{/* Tribes List */}
				<div className="space-y-2">
					{tribes.length === 0 ? (
						<div className="py-8 text-center text-gray-500 dark:text-gray-400">
							No tribes found. Add your first tribe to get started.
						</div>
					) : (
						tribes.map((tribe, index) => (
							<div
								key={tribe.tribe_id}
								className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
								style={{
									opacity: 0,
									animation: `fadeSlideIn 0.3s ease-out forwards ${
										index * 0.1
									}s`,
								}}
							>
								<div className="flex flex-col">
									<span className="text-gray-900 dark:text-gray-100 font-medium">
										{tribe.tribe_name}
									</span>
									{tribe.tribe_createdAt && (
										<span className="text-xs text-gray-500 dark:text-gray-400">
											Created:{" "}
											{new Date(tribe.tribe_createdAt).toLocaleDateString()}
										</span>
									)}
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => startEdit(tribe)}
										className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transform transition-all duration-200 hover:scale-110 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
										title="Edit tribe"
									>
										<Pencil className="w-4 h-4" />
									</button>
									<button
										onClick={() => handleDeleteTribe(tribe.tribe_id)}
										className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transform transition-all duration-200 hover:scale-110 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
										title="Delete tribe"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				onClose={cancelDeleteTribe}
				onConfirm={confirmDeleteTribe}
				type="danger"
				title="Delete Tribe"
				message={`Are you sure you want to delete the tribe "${confirmDialog.tribeName}"? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</>
	);
}
