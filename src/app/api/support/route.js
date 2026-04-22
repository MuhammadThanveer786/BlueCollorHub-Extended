import connect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import Activity from "@/models/Activity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 1. THIS LETS THE USER FETCH THEIR PAST TICKETS AND REPLIES
export async function GET(req) {
    await connect();
    const session = await getServerSession(authOptions);
    
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Find only tickets belonging to the logged-in user
        const tickets = await Ticket.find({ userId: session.user.id })
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        return NextResponse.json({ tickets }, { status: 200 });
    } catch (error) {
        console.error("Fetch User Tickets Error:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// 2. THIS IS YOUR EXISTING CODE TO SUBMIT A TICKET
export async function POST(req) {
    await connect();
    const session = await getServerSession(authOptions);
    
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { subject, message } = await req.json();

        const ticket = await Ticket.create({
            userId: session.user.id,
            subject,
            message
        });

        await Activity.create({
            userId: session.user.id,
            action: "new_report",
            details: `${session.user.name} submitted a Support Ticket: "${subject}"`
        });

        return NextResponse.json({ success: true, ticket }, { status: 201 });
    } catch (error) {
        console.error("Support Ticket Error:", error);
        return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
    }
}