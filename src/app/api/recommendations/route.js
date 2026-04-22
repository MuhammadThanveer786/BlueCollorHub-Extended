import connect from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connect();

  try {
    const { requiredSkills } = await req.json();

    const pipeline = [
      // 1. Skill Match: Only get workers who have the required skills
      {
        $match: {
          skills: { $in: requiredSkills } 
        }
      },

      // 🚨 NEW: Peek into the "posts" database collection to find their work
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "portfolioItems"
        }
      },

      // 🚨 NEW: Kick them out of the recommendations if they have 0 posts!
      {
        $match: {
          "portfolioItems.0": { $exists: true } 
        }
      },

      // 2. Rating Math: Calculate their score based purely on quality
      {
        $addFields: {
          finalMatchScore: { $divide: [{ $ifNull: ["$averageRating", 0] }, 5] }
        }
      },
      
      // 3. Sort: Highest rated first
      { $sort: { finalMatchScore: -1 } },
      { $limit: 10 }
    ];

    // Using the User model normally again for this safe pipeline
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}), "users");
    const recommendedWorkers = await User.aggregate(pipeline);

    return NextResponse.json({ success: true, workers: recommendedWorkers });

  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    return NextResponse.json({ error: "Failed to generate matches" }, { status: 500 });
  }
}