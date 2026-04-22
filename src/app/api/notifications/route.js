// src/app/api/notifications/route.js
import connect from "@/lib/mongodb"; 
import Notification from "@/models/Notification"; 
import User from "@/models/User";
import Post from "@/models/Post";
import Booking from "@/models/Booking"; // 🚨 ADDED: Import the Booking model to populate it
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route"; 
import mongoose from "mongoose";

export async function GET(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch notifications for the user, newest first
    // Populate sender details (name, profilePic)
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 }) 
      .limit(50) 
      .populate({
         path: 'senderId',
         select: 'name profilePic' 
      })
      .populate({ 
         path: 'postId',
         select: 'title'
      })
      // 🚨 ADDED: Populate the booking details if this notification is for a job
      .populate({
         path: 'bookingId',
         select: 'title status scheduledDate'
      });

    // Optionally, count unread notifications separately if needed
    // const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

    return new Response(JSON.stringify(notifications), { status: 200 });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}