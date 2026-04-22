import { NextResponse } from "next/server";
import connect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request) {
    const { email } = await request.json();

    if (!email) {
        return new NextResponse(JSON.stringify({ message: "Email is required" }), { status: 400 });
    }

    try {
        await connect();
        const user = await User.findOne({ email });

        if (!user) {
            // DO NOT reveal that the user doesn't exist.
            // This prevents email enumeration attacks.
            console.log(`Password reset attempt for non-existent email: ${email}`);
            return new NextResponse(JSON.stringify({ message: "Reset link sent" }), { status: 200 });
        }

        // --- 1. Create Reset Token ---
        const resetToken = crypto.randomBytes(32).toString("hex");
        const passwordResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const passwordResetExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = passwordResetToken;
        user.resetPasswordExpires = passwordResetExpires;
        await user.save();

        // --- 2. Send Email ---
        // IMPORTANT: You must set up these environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
            secure: process.env.EMAIL_SERVER_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASS,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Your Password Reset Link (Valid for 1 hour)",
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${user.name},</p>
                    <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
                    <p>Please click on the link below to set a new password:</p>
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                        Reset Your Password
                    </a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <hr>
                    <p style="font-size: 0.9em; color: #777;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                    <p style="font-size: 0.9em; color: #333; word-break: break-all;">${resetUrl}</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return new NextResponse(JSON.stringify({ message: "Reset link sent" }), { status: 200 });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        // Generic error to avoid leaking info
        return new NextResponse(JSON.stringify({ message: "An error occurred" }), { status: 500 });
    }
}