import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If an admin did the action
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  // The user involved
  action: { 
    type: String, 
    required: true, 
    enum: ["new_user", "new_post", "user_verified", "user_banned", "new_report"] 
  },
  details: { type: String }, // e.g., "Muhammad joined the platform"
}, { timestamps: true });

const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
export default Activity;