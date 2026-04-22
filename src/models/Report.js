// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // 🛡️ FIX 1: Changed to false so the AI doesn't need an ID
  },
  reportedUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    // 🛡️ FIX 2: Added 'AI Content Filter' to the end of your enum list
    enum: ['Fake Profile', 'Harassment', 'Scam/Fraud', 'Inappropriate Content', 'Other', 'AI Content Filter']
  },
  description: { 
    type: String, 
    default: "" 
  },
  status: { 
    type: String, 
    enum: ['pending', 'action_taken', 'dismissed'], 
    default: 'pending' 
  }
}, { timestamps: true });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;