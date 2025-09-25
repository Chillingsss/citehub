import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Calendar } from "lucide-react";
import AttendanceRecordsModal from "./AttendanceRecordsModal";

const QRCodeModal = ({ isOpen, onClose, userId, userProfile }) => {
	const canvasRef = useRef(null);
	const [qrDataUrl, setQrDataUrl] = useState("");
	const [showAttendanceRecords, setShowAttendanceRecords] = useState(false);

	useEffect(() => {
		if (isOpen && userId && canvasRef.current) {
			generateQRCode();
		}
	}, [isOpen, userId]);

	const generateQRCode = async () => {
		try {
			const canvas = canvasRef.current;
			const qrText = `student_id: ${userId}`;

			await QRCode.toCanvas(canvas, qrText, {
				width: 300,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#FFFFFF",
				},
			});

			const dataUrl = canvas.toDataURL("image/png");
			setQrDataUrl(dataUrl);
		} catch (error) {
			console.error("Error generating QR code:", error);
		}
	};

	const downloadQRCode = () => {
		if (qrDataUrl) {
			const link = document.createElement("a");
			const studentName = userProfile
				? `${userProfile.user_name}`
				: `Student_${userId}`;
			link.download = `${studentName}_Attendance_QR.png`;
			link.href = qrDataUrl;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50 backdrop-blur-md">
			<div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:max-w-md sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col mx-0 sm:mx-4">
				<div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
					<h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-gray-200">
						Attendance QR Code
					</h2>
					<button
						onClick={onClose}
						className="p-1 text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					{userProfile && (
						<div className="mb-4 text-center">
							<p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
								{userProfile.user_name}
							</p>
							<p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
								Student ID: {userId}
							</p>
						</div>
					)}

					<div className="mb-4">
						<div className="flex justify-end mb-2">
							<button
								onClick={downloadQRCode}
								className="flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:shadow-md hover:scale-105 active:scale-95 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:bg-emerald-800/30"
							>
								<Download className="w-3 h-3" />
								<span>Download QR Code</span>
							</button>
						</div>

						<div className="flex justify-center">
							<div className="p-3 bg-white rounded-lg shadow-inner sm:p-4 dark:bg-gray-700">
								<canvas
									ref={canvasRef}
									className="w-48 max-w-full h-auto sm:w-64 sm:h-64"
								/>
							</div>
						</div>
					</div>

					<p className="mb-4 text-xs text-center text-gray-600 sm:text-sm dark:text-gray-400">
						Show this QR code to your instructor for attendance verification
					</p>
				</div>

				<div className="flex flex-col gap-3 justify-center p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 sm:flex-row sm:gap-3">
					<button
						onClick={() => setShowAttendanceRecords(true)}
						className="flex relative flex-1 gap-2 justify-center items-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl border shadow-lg transition-all duration-300 group hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95 sm:text-base border-blue-400/20"
					>
						<div className="absolute inset-0 bg-gradient-to-r to-transparent rounded-xl opacity-0 transition-opacity duration-300 from-blue-400/20 group-hover:opacity-100"></div>
						<Calendar className="relative w-4 h-4 drop-shadow-sm sm:w-5 sm:h-5" />
						<span className="relative whitespace-nowrap drop-shadow-sm">
							View Records
						</span>
					</button>
					<button
						onClick={onClose}
						className="flex relative flex-1 gap-2 justify-center items-center px-4 py-3 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border shadow-lg transition-all duration-300 group hover:from-gray-200 hover:to-gray-300 hover:shadow-xl hover:scale-105 active:scale-95 sm:text-base border-gray-300/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-200 dark:border-gray-600/50 dark:hover:from-gray-600 dark:hover:to-gray-700"
					>
						<div className="absolute inset-0 bg-gradient-to-r to-transparent rounded-xl opacity-0 transition-opacity duration-300 from-gray-200/20 group-hover:opacity-100 dark:from-gray-600/20"></div>
						<span className="relative whitespace-nowrap">Close</span>
					</button>
				</div>
			</div>

			<AttendanceRecordsModal
				isOpen={showAttendanceRecords}
				onClose={() => setShowAttendanceRecords(false)}
				userId={userId}
			/>
		</div>
	);
};

export default QRCodeModal;
