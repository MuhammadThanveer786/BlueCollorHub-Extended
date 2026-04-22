import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  profilePic: { type: String, default: null },
  title: { type: String, default: null },
  skills: { type: [String], default: [] },
  skillCategories: { type: [String], default: [] },
  phone: { type: String, default: null },
  whatsappNo: { type: String, default: null },
  coverImage: { type: String, default: null },
  
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  connectionRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectionRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  
  overallRating: {
    distribution: {
      '1': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '5': { type: Number, default: 0 }
    },
    totalRatings: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    state: { type: String, default: null },
    district: { type: String, default: null },
    town: { type: String, default: null }
  },

  // 🚨 ADMIN & MODERATION FIELDS
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },
  isVerified: { type: Boolean, default: false },
  deactivatedUntil: { type: Date, default: null } 

}, { timestamps: true });

// Important for searching nearby workers later
userSchema.index({ location: "2dsphere" });

// 🚨 Force Next.js to delete the old, broken cached model
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// 🚨 Rebuild it from scratch and strictly lock it to "users"
export default mongoose.model("User", userSchema, "users");