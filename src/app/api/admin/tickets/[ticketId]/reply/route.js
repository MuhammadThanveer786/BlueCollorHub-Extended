import connect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import Notification from "@/models/Notification"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
    await connect();
    const session = await getServerSession(authOptions);
    
    // 🛡️ SECURITY Check
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        // 🚨 NEXT.JS 15 FIX: We MUST await the params object!
        const resolvedParams = await params;
        const ticketId = resolvedParams.ticketId;
        
        const { replyMessage } = await req.json();

        // 1. Find and Update the Ticket
        const ticket = await Ticket.findByIdAndUpdate(
            ticketId,
            {
                adminReply: replyMessage,
                repliedAt: new Date(),
                status: "Resolved" 
            },
            { new: true } 
        );

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // 2. Alert the user they have a response (wrapped in try/catch just in case)
        try {
            await Notification.create({
                userId: ticket.userId, 
                type: "admin_info", 
                read: false,
                message: `Admin replied to your ticket: "${ticket.subject}".`
            });
        } catch (notifError) {
            console.error("Could not send notification, but ticket was saved:", notifError);
        }

        return NextResponse.json({ success: true, ticket }, { status: 200 });

    } catch (error) {
        console.error("Admin Ticket Reply Error:", error);
        return NextResponse.json({ error: "Server error submitting reply" }, { status: 500 });
    }
}