import React from "react";

const PointRuleForm = ({
	pointRuleForm,
	setPointRuleForm,
	onSubmit,
	onCancel,
	isEditing = false,
	originalData = null, // Add this prop to track original values for comparison
}) => {
	// Check if form has changes
	const hasChanges = () => {
		if (!isEditing) {
			// For adding: check if any field has content
			return (
				pointRuleForm.place.trim() !== "" ||
				pointRuleForm.points.trim() !== "" ||
				pointRuleForm.allowsMultiple !== false
			);
		} else {
			// For editing: compare with original data
			if (!originalData) return false;
			return (
				pointRuleForm.place !== originalData.place ||
				pointRuleForm.points !== originalData.points ||
				pointRuleForm.allowsMultiple !== originalData.allowsMultiple
			);
		}
	};

	// Check if form is valid (all required fields filled)
	const isFormValid = () => {
		return (
			pointRuleForm.place.trim() !== "" && pointRuleForm.points.trim() !== ""
		);
	};

	const shouldDisableButton = !isFormValid() || (!hasChanges() && isEditing);

	return (
		<form onSubmit={onSubmit} className="mb-4 space-y-3">
			<input
				type="text"
				placeholder="Place (e.g., 1st Place, 2nd Place, Participation)"
				value={pointRuleForm.place}
				onChange={(e) =>
					setPointRuleForm({
						...pointRuleForm,
						place: e.target.value,
					})
				}
				className="p-2 w-full rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
			/>
			<input
				type="number"
				placeholder="Points"
				value={pointRuleForm.points}
				onChange={(e) =>
					setPointRuleForm({
						...pointRuleForm,
						points: e.target.value,
					})
				}
				className="p-2 w-full rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
			/>

			{/* Allow Multiple Tribes Toggle */}
			<div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-700 dark:border-gray-600">
				<div className="flex justify-between items-center">
					<div className="flex-1">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
							Allow Multiple Tribes
						</label>
						<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Enable this for rules like "Participation" where multiple tribes
							can receive the same score
						</p>
					</div>
					<div className="ml-4">
						<label className="inline-flex relative items-center cursor-pointer">
							<input
								type="checkbox"
								checked={pointRuleForm.allowsMultiple || false}
								onChange={(e) =>
									setPointRuleForm({
										...pointRuleForm,
										allowsMultiple: e.target.checked,
									})
								}
								className="sr-only peer"
							/>
							<div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
						</label>
					</div>
				</div>

				{/* Visual indicator */}
				<div className="flex items-center mt-2 text-xs">
					{pointRuleForm.allowsMultiple ? (
						<>
							<span className="inline-block mr-2 w-2 h-2 bg-gray-400 rounded-full"></span>
							<span className="text-gray-600 dark:text-gray-400">
								This rule will appear as a gray card and allow selecting
								multiple tribes
							</span>
						</>
					) : (
						<>
							<span className="inline-block mr-2 w-2 h-2 bg-green-500 rounded-full"></span>
							<span className="text-gray-600 dark:text-gray-400">
								This rule will appear as a green card for single tribe selection
							</span>
						</>
					)}
				</div>
			</div>

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={shouldDisableButton}
					className={`flex-1 p-2 rounded-lg font-medium transition-colors ${
						shouldDisableButton
							? "text-gray-500 bg-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
							: "text-white bg-yellow-600 hover:bg-yellow-700"
					}`}
					title={
						!isFormValid()
							? "Please fill in all required fields"
							: !hasChanges() && isEditing
							? "No changes to save"
							: ""
					}
				>
					{isEditing ? "Update" : "Add Rule"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 p-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200"
				>
					Cancel
				</button>
			</div>
		</form>
	);
};

export default PointRuleForm;
