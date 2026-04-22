// src/app/api/admin/posts/manage/route.js
import connect from "@/lib/mongodb";
import Post from "@/models/Post"; 
import Notification from "@/models/Notification"; 
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
        const { postId, action, reason } = await req.json();

        if (!postId || !action) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (action === "delete") {
            // 1. Find the post FIRST so we know who to notify
            const post = await Post.findById(postId);
            if (!post) {
                return NextResponse.json({ message: "Post not found" }, { status: 404 });
            }

            const postTitle = post.title;
            const postAuthorId = post.userId;

            // 2. Delete the post
            await Post.findByIdAndDelete(postId);

            // 3. Send the automated notification to the user using the Nuclear Bypass
            if (postAuthorId) {
                await Notification.collection.insertOne({
                    recipientId: new mongoose.Types.ObjectId(postAuthorId),
                    senderId: new mongoose.Types.ObjectId(session.user.id),
                    type: "admin_warning",
                    title: "⚠️ Post Removed by Admin",
                    message: reason || `Your post "${postTitle}" was removed for violating community guidelines.`,
                    read: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            return NextResponse.json({ message: "Post deleted and user notified" }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Admin Post Action Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}