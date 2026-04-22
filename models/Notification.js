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
        "admin_info"     
      ],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
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