// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    type: {
      type: String,
      required: true,
      enum: [
        "like",
        "comment",
        "rating",
        "connect_request",
        "connect_accept",
        "admin_warning", 
        "admin_info",
        // 🚨 ADDED: New types to support the booking system
        "job_request",
        "job_accepted",
        "job_declined"
      ],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    // 🚨 ADDED: Link the notification directly to the booking details
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    // 🚨 ADDED: Optional link so clicking the notification takes them to the right page
    link: {
      type: String,
    },
    title: {
      type: String, 
    },
    message: {
      type: String, 
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🚨 CACHE KILLER: Prevents Mongoose from memorizing old schema rules during development
if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Notification;
}

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);