import connect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import User from "@/models/User";

export async function GET(req) {
  await connect();
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all bookings where the current logged-in user is the hired WORKER
    const incomingRequests = await Booking.find({ workerId: session.user.id })
      .populate("customerId", "name profilePic email") // Get the customer's details
      .sort({ createdAt: -1 }); // Newest requests first

    return NextResponse.json({ success: true, requests: incomingRequests });

  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    return NextResponse.json({ error: "Failed to fetch incoming requests." }, { status: 500 });
  }
}

export async function POST(req) {
  await connect();
  
  // Check if the user is logged in
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to book a service." }, { status: 401 });
  }

  try {
    const customerId = session.user.id;
    const { workerId, title, description, proposedBudget, scheduledDate } = await req.json();

    // Prevent users from booking themselves
    if (customerId === workerId) {
      return NextResponse.json({ error: "You cannot book yourself!" }, { status: 400 });
    }

    // Create the new Job Ticket
    const newBooking = await Booking.create({
      customerId,
      workerId,
      title,
      description,
      proposedBudget,
      scheduledDate
    });

    // Note: Since you already have Socket.io running, this is where you could 
    // eventually trigger a "New Job Request!" notification to the worker!

    return NextResponse.json({ success: true, booking: newBooking });

  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}