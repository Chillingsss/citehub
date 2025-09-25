import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState("light");
	const [isLoaded, setIsLoaded] = useState(false);

	// Initialize theme from localStorage or system preference
	useEffect(() => {
		const savedTheme = localStorage.getItem("sociatrack-theme");

		if (savedTheme) {
			setTheme(savedTheme);
		} else {
			// Check system preference
			const systemPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)"
			).matches;
			setTheme(systemPrefersDark ? "dark" : "light");
		}

		setIsLoaded(true);
	}, []);

	// Apply theme to document and save to localStorage
	useEffect(() => {
		if (isLoaded) {
			const root = document.documentElement;

			if (theme === "dark") {
				root.classList.add("dark");
			} else {
				root.classList.remove("dark");
			}

			localStorage.setItem("sociatrack-theme", theme);
		}
	}, [theme, isLoaded]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
	};

	const setLightTheme = () => setTheme("light");
	const setDarkTheme = () => setTheme("dark");

	const value = {
		theme,
		toggleTheme,
		setLightTheme,
		setDarkTheme,
		isDark: theme === "dark",
		isLight: theme === "light",
		isLoaded,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};
