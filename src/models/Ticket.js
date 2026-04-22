import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Open", "Resolved"], 
    default: "Open" 
  },
  adminReply: { 
    type: String, 
    default: null 
  },
  repliedAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;