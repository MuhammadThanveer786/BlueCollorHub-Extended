import connect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification"; // 🚨 ADDED: Important to import the Notification model!
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
    await connect();
    
    try {
        const { bookingId } = params;
        const { status } = await req.json();

        // Find the booking and update its status
        // We use .populate() to get the worker's data so we can use their ID/Name in the notification
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status },
            { new: true }
        ).populate("workerId", "name _id"); 

        if (!updatedBooking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // 🚨 HERE IS WHERE YOUR SNIPPET GOES! 🚨
        // Create the automatic notification for the customer if accepted or declined
        if (status === "accepted" || status === "declined") {
            await Notification.create({
                recipientId: updatedBooking.customerId, // The user receiving the alert
                senderId: updatedBooking.workerId._id,  // The worker accepting/declining
                type: status === "accepted" ? "job_accepted" : "job_declined",
                bookingId: updatedBooking._id,
                message: status === "accepted" 
                    ? `Great news! Your job request was accepted.` 
                    : `Your job request was declined.`,
                link: `/dashboard/profile/${updatedBooking.workerId._id}`
            });
        }

        return NextResponse.json({ success: true, booking: updatedBooking });

    } catch (error) {
        console.error("Update Booking Error:", error);
        return NextResponse.json({ error: "Failed to update booking status." }, { status: 500 });
    }
}