import connect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connect();
    const session = await getServerSession(authOptions);

    // 🚨 SECURITY: Double-check that ONLY admins can fetch this data
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized Access" }, { status: 403 });
    }

    try {
        // Fetch all users, but exclude their passwords for security
        // We include location and skills for better admin oversight
        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();
        
        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error("Admin Fetch Users Error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}