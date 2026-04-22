import connect from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    await connect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const tickets = await Ticket.find({})
            .populate("userId", "name email profilePic")
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json({ tickets }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}