import connect from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import Report from "@/models/Report";
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
        // Run all these count queries at the exact same time for maximum speed
        const [totalUsers, verifiedUsers, totalPosts, pendingReports] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }), // Exclude admins from user count
            User.countDocuments({ isVerified: true, role: { $ne: "admin" } }),
            Post.countDocuments(),
            Report.countDocuments({ status: "pending" })
        ]);

        return NextResponse.json({
            totalUsers,
            verifiedUsers,
            totalPosts,
            pendingReports
        }, { status: 200 });
    } catch (error) {
        console.error("Stats Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}