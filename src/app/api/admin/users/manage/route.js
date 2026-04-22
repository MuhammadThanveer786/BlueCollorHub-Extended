import connect from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity"; // 🚨 ADDED
import mongoose from "mongoose";
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
        const { userId, action, days } = await req.json();
        if (!userId || !action) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

        const objectId = new mongoose.Types.ObjectId(userId);
        const targetUser = await User.findById(userId);

        if (action === "verify") {
            const newStatus = !targetUser.isVerified;
            await User.collection.updateOne({ _id: objectId }, { $set: { isVerified: newStatus } });
            
            // 🚨 LOG ACTIVITY
            await Activity.create({
                adminId: session.user.id,
                action: "user_verified",
                details: `Admin ${newStatus ? "verified" : "revoked verification for"} ${targetUser.name}`
            });
            return NextResponse.json({ message: "Verification toggled" }, { status: 200 });
        }

        if (action === "suspend") {
            if (days && days > 0) {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(days));
                await User.collection.updateOne({ _id: objectId }, { $set: { deactivatedUntil: date } });
                
                // 🚨 LOG ACTIVITY
                await Activity.create({
                    adminId: session.user.id,
                    action: "user_banned",
                    details: `Admin suspended ${targetUser.name} for ${days} days`
                });
            } else {
                await User.collection.updateOne({ _id: objectId }, { $unset: { deactivatedUntil: "" } });
                // 🚨 LOG ACTIVITY
                await Activity.create({
                    adminId: session.user.id,
                    action: "user_verified", // Reuse verified icon or create 'unbanned'
                    details: `Admin lifted the suspension for ${targetUser.name}`
                });
            }
            return NextResponse.json({ message: "Suspension updated" }, { status: 200 });
        }

        if (action === "delete") {
            const userName = targetUser.name;
            await User.collection.deleteOne({ _id: objectId });
            
            // 🚨 LOG ACTIVITY
            await Activity.create({
                adminId: session.user.id,
                action: "new_report", // Reuse icon
                details: `Admin permanently deleted the account of ${userName}`
            });
            return NextResponse.json({ message: "User deleted" }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}