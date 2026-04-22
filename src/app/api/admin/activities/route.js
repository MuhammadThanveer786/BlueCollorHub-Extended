import connect from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        // Fetch the 10 most recent activities
        const activities = await Activity.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("userId", "name profilePic")
            .lean();

        return NextResponse.json({ activities }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}