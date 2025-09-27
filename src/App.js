import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/Login";
import { initializeApiUrl } from "./utils/apiConfig";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeLoader from "./components/ThemeLoader";
import SboDashboard from "./pages/sbo/SboDashboard";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
	useEffect(() => {
		initializeApiUrl();
	}, []);

	return (
		<ThemeProvider>
			<ThemeLoader>
				<div className="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
					<Routes>
						<Route path="/" element={<LoginPage />} />
						<Route
							path="/AdminDashboard"
							element={
								<PrivateRoute allowedRole="Admin">
									<AdminDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/AdminDashboard/:userId"
							element={
								<PrivateRoute allowedRole="Admin">
									<AdminDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/StudentDashboard"
							element={
								<PrivateRoute allowedRole="Student">
									<StudentDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/StudentDashboard/:userId"
							element={
								<PrivateRoute allowedRole="Student">
									<StudentDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/FacultyDashboard"
							element={
								<PrivateRoute allowedRole="Faculty">
									<FacultyDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/FacultyDashboard/:userId"
							element={
								<PrivateRoute allowedRole="Faculty">
									<FacultyDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/SboDashboard"
							element={
								<PrivateRoute allowedRole="SBO Officer">
									<SboDashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/SboDashboard/:userId"
							element={
								<PrivateRoute allowedRole="SBO Officer">
									<SboDashboard />
								</PrivateRoute>
							}
						/>
					</Routes>
				</div>
				<Analytics />
				<SpeedInsights />
			</ThemeLoader>
		</ThemeProvider>
	);
}

export default App;
