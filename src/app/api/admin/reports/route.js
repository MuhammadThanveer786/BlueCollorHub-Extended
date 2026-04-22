// src/app/api/admin/reports/route.js
import connect from "@/lib/mongodb";
import Report from "@/models/Report";
import User from "@/models/User"; // Need this to populate the names
import Post from "@/models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        // Fetch reports and populate the actual names and emails of the users involved
        const reports = await Report.find({})
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
            
        return NextResponse.json({ reports }, { status: 200 });
    } catch (error) {
        console.error("Fetch Reports Error:", error);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}

// POST request to update the status of a report (Dismiss or Action Taken)
// POST request to update the status of a report (Dismiss or Action Taken)
export async function POST(req) {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { reportId, status } = await req.json();

        // 1. Find the report FIRST so we know exactly who the bad user is
        const report = await Report.findById(reportId);
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // 2. Update the report's paperwork to turn your admin badge green
        report.status = status;
        await report.save();

        // 🚨 3. THE TERMINATOR LOGIC 🚨
        // If you clicked "Terminate Access" (which sends the status 'action_taken')
        if (status === "action_taken") {
            const badUserId = report.reportedUserId;

            // A. Delete the spammer's account entirely
            await User.findByIdAndDelete(badUserId);

            // B. Scrub the platform clean by deleting all posts created by that user
            await Post.deleteMany({ userId: badUserId });
        }

        return NextResponse.json({ message: "Report updated and action executed" }, { status: 200 });

    } catch (error) {
        console.error("Report Action Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}