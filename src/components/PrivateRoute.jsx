import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const COOKIE_KEY = "cite_user";
const SECRET_KEY = "cite_secret_key";

export default function PrivateRoute({ children, allowedRole }) {
	const encrypted = Cookies.get(COOKIE_KEY);
	if (!encrypted) {
		return <Navigate to="/" replace />;
	}
	try {
		const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
		const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
		if (!user || user.userLevel !== allowedRole) {
			return <Navigate to="/" replace />;
		}
		return children;
	} catch (e) {
		return <Navigate to="/" replace />;
	}
}
