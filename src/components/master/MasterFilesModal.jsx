import React, { useState } from "react";
import { X, Users, User } from "lucide-react";
import Tribe from "./Tribe";
import UserLevel from "./UserLevel";

const tabs = [
	{
		id: "tribes",
		name: "Tribes",
		icon: Users,
		description: "Manage tribe information",
	},
	{
		id: "userlevels",
		name: "User Levels",
		icon: User,
		description: "Manage user level information",
	},
	// Add more tabs here as needed
	// {
	//   id: "yearlevel",
	//   name: "Year Levels",
	//   icon: GraduationCap,
	//   description: "Manage year level information"
	// },
];

export default function MasterFilesModal({ isOpen, onClose }) {
	const [activeTab, setActiveTab] = useState("tribes");

	const renderTabContent = () => {
		switch (activeTab) {
			case "tribes":
				return <Tribe />;
			case "userlevels":
				return <UserLevel />;
			// Add more cases here for other components
			// case "yearlevel":
			//   return <YearLevel />;
			default:
				return <Tribe />;
		}
	};

	return (
		<div
			className={`fixed inset-0 z-50 transition-opacity duration-300 ${
				isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
		>
			{/* Backdrop with blur effect */}
			<div
				className={`absolute inset-0 bg-black/50 backdrop-blur-sm`}
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className={`fixed inset-y-0 right-0 flex flex-col w-full max-w-xl bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{/* Header */}
				<div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Master Files
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 p-4 border-b dark:border-gray-700 overflow-x-auto">
					{tabs.map((tab) => {
						const IconComponent = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
									activeTab === tab.id
										? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
										: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
								}`}
								title={tab.description}
							>
								<IconComponent className="w-4 h-4" />
								{tab.name}
							</button>
						);
					})}
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
			</div>
		</div>
	);
}
