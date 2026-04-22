// src/app/api/admin/broadcast/route.js
import connect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose"; // 🚨 ADDED: We need this for the bypass
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req) {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { message, type } = await req.json();

        if (!message) {
            return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
        }

        // Fetch all users except the admin who is sending the broadcast
        const allUsers = await User.find({ _id: { $ne: session.user.id } }).select("_id").lean();

        if (allUsers.length === 0) {
            return NextResponse.json({ message: "No users to broadcast to." }, { status: 400 });
        }

        // 🚨 FIX: Format IDs properly for the database bypass
        const bulkNotifications = allUsers.map(user => ({
            recipientId: new mongoose.Types.ObjectId(user._id),
            senderId: new mongoose.Types.ObjectId(session.user.id), 
            type: type || "admin_info", 
            message: message,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // 🚨 FIX: Use the Nuclear Bypass (.collection.insertMany) to skip Schema validation
        await Notification.collection.insertMany(bulkNotifications);

        return NextResponse.json({ 
            success: true, 
            message: `Broadcast successfully sent to ${bulkNotifications.length} users!` 
        }, { status: 200 });

    } catch (error) {
        console.error("Broadcast Error:", error);
        // 🚨 FIX: Changed 'error' to 'message' so the frontend can read the alert properly!
        return NextResponse.json({ message: `Server error: ${error.message}` }, { status: 500 });
    }
}