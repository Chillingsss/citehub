import { User, Lock } from "lucide-react";

export const profileTabs = [
	{
		id: "details",
		name: "Profile Details",
		icon: User,
		description: "View and edit your profile information",
	},
	{
		id: "password",
		name: "Change Password",
		icon: Lock,
		description: "Change your password with OTP verification",
	},
];
