import nodemailer from "nodemailer";

function generateOtp() {
	return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function createTransport() {
	const host = process.env.SMTP_HOST || "smtp.gmail.com";
	const port = Number(process.env.SMTP_PORT || 465);
	const secure = process.env.SMTP_SECURE
		? process.env.SMTP_SECURE === "true"
		: port === 465;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!user || !pass) {
		throw new Error("SMTP_USER and SMTP_PASS must be set");
	}
	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});
}

export default async function handler(req, res) {
	// Basic CORS to allow local dev to call the deployed API
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Vary", "Origin");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With"
	);
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	if (req.method !== "POST") {
		return res
			.status(405)
			.json({ status: "error", message: "Method Not Allowed" });
	}

	try {
		const { email, fullName } = req.body || {};

		// Debug logging
		console.log("Request received:", {
			email,
			fullName,
			origin: req.headers.origin,
		});

		if (!email)
			return res
				.status(400)
				.json({ status: "error", message: "Email is required" });

		const otp = generateOtp();

		// Check SMTP configuration
		if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
			console.error("SMTP configuration missing:", {
				SMTP_USER: !!process.env.SMTP_USER,
				SMTP_PASS: !!process.env.SMTP_PASS,
			});
			return res.status(500).json({
				status: "error",
				message: "Email service configuration error",
			});
		}

		const transporter = createTransport();

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-top: 4px solid #16a34a;">
          <h2 style="color: #15803d; margin: 0;">CiteHub Password Reset</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${fullName || "User"}</strong>,</p>
          <p>You have requested to reset your password for your CiteHub account. Please use the following OTP to complete your password reset:</p>
          <div style="background-color: #f0fdf4; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #16a34a; border-radius: 8px;">
            <h1 style="color: #16a34a; font-size: 32px; letter-spacing: 5px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 500;">Important Security Information:</p>
            <ul style="margin: 10px 0 0 0; color: #92400e;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
          </div>
          <p>Best regards,<br/>CiteHub System Administrator</p>
        </div>
        <div style="background-color: #f0fdf4; padding: 15px; text-align: center; font-size: 12px; color: #16a34a;">
          This is an automated message from CiteHub. Please do not reply.
        </div>
      </div>
    `;

		await transporter.sendMail({
			from: process.env.MAIL_FROM || "noreply@citehub.com",
			to: email,
			subject: "Password Reset OTP - CiteHub",
			html,
		});

		console.log("Email sent successfully to:", email);

		res.status(200).json({
			status: "success",
			message: "OTP sent successfully",
			otp: otp,
			email: email,
			timestamp: Date.now(),
		});
	} catch (err) {
		console.error("Error sending email:", err);
		res.status(500).json({
			status: "error",
			message: err.message || "Failed to send OTP email",
			error: process.env.NODE_ENV === "development" ? err.stack : undefined,
		});
	}
}
