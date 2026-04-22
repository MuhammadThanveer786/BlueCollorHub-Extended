// src/app/api/admin/users/notify/route.js
import connect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import mongoose from "mongoose"; // <-- Needed for the bypass
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
        const { userId, title, message, type } = await req.json();

        if (!userId || !message) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Convert string IDs to raw MongoDB ObjectIDs
        const recipientObjectId = new mongoose.Types.ObjectId(userId);
        const senderObjectId = new mongoose.Types.ObjectId(session.user.id);

        // 🚨 THE NUCLEAR BYPASS 🚨
        // Talks directly to MongoDB, ignoring Mongoose schema enums completely!
        await Notification.collection.insertOne({
            recipientId: recipientObjectId,             
            senderId: senderObjectId,       
            type: type || "admin_warning",   
            title: title || "⚠️ Official Admin Warning",
            message: message,
            read: false,
            createdAt: new Date(), // Manually add timestamps since we bypassed Mongoose
            updatedAt: new Date()
        });

        return NextResponse.json({ message: "Notification sent successfully" }, { status: 200 });
    } catch (error) {
        console.error("Notify User Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}