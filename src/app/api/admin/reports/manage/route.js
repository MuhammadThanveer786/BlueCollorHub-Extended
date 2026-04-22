// src/app/api/admin/reports/route.js
import connect from "@/lib/mongodb";
import Report from "@/models/Report";
import User from "@/models/User"; // Need this to populate the names
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
export async function POST(req) {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { reportId, status } = await req.json();
        await Report.findByIdAndUpdate(reportId, { $set: { status: status } });
        return NextResponse.json({ message: "Report updated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}