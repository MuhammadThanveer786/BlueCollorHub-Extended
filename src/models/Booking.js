import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  // The customer requesting the job
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // The professional being hired
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Job Details
  title: { type: String, required: true },
  description: { type: String, required: true },
  proposedBudget: { type: Number, required: true },
  scheduledDate: { type: Date, required: true },

  // The Pipeline Status
  status: { 
    type: String, 
    enum: ["pending", "accepted", "declined", "completed"], 
    default: "pending" 
  }
}, { timestamps: true });

// Prevent caching issues by explicitly naming the collection "bookings"
export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema, "bookings");