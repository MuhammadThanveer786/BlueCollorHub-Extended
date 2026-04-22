// src/app/api/reports/route.js
import connect from "@/lib/mongodb";
import Report from "../../../models/Report";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req) {
    await connect();
    const session = await getServerSession(authOptions);

    // SECURITY: Must be logged in to send a report (prevents spam)
    if (!session) {
        return NextResponse.json({ message: "You must be logged in to report a user." }, { status: 401 });
    }

    try {
        const { reportedUserId, reason, description } = await req.json();

        if (!reportedUserId || !reason) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Create the report in the database
        await Report.create({
            reporterId: session.user.id,
            reportedUserId,
            reason,
            description: description || ""
        });

        return NextResponse.json({ message: "Report submitted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Submit Report Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}