// src/app/api/admin/posts/route.js
import connect from "@/lib/mongodb";
import Post from "@/models/Post"; 
import User from "@/models/User"; // Need this to populate the userId
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; 

export async function GET(req) {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized Access" }, { status: 403 });
    }

    try {
        // 🚨 FIX: Changed .populate("author") to .populate("userId") to match your schema!
        const posts = await Post.find({})
            .populate("userId", "name email") 
            .sort({ createdAt: -1 })
            .lean();
            
        return NextResponse.json({ posts }, { status: 200 });
    } catch (error) {
        console.error("Admin Fetch Posts Error:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}