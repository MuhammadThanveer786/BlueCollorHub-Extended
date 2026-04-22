import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profilePic: { type: String, default: null },
  title: { type: String, default: null },
  skills: { type: [String], default: [] },
  skillCategories: { type: [String], default: [] },
  phone: { type: String, default: null },
  whatsappNo: { type: String, default: null },
  coverImage: { type: String, default: null },
  followers: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  following: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  connectionRequestsSent: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  connectionRequestsReceived: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  wishlist: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  
  overallRating: {
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    totalRatings: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    state: { type: String, default: null },
    district: { type: String, default: null },
    town: { type: String, default: null }
  },

  // 🚨 ADMIN CONTROL FIELDS 🚨
  role: { type: String, default: "user" },
  isVerified: { type: Boolean, default: false },
  deactivatedUntil: { type: Date, default: null } 

}, { timestamps: true });

// Check if the model is already compiled to prevent Next.js overwrite errors
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;