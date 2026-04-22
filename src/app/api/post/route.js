import connect from "../../../lib/mongodb";
import Post from "../../../models/Post";
import User from "../../../models/User";
import Activity from "@/models/Activity";
import Report from "@/models/Report"; // 🚨 Imported correctly!
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { checkPostForSpam } from "@/lib/aiModerator";
import { NextResponse } from "next/server"; 

// =======================
// 📌 GET ALL POSTS
// =======================
export async function GET(req) {
  await connect();

  try {
    const nonAdminUsers = await User.find({ role: { $ne: "admin" } }).select("_id");
    const nonAdminIds = nonAdminUsers.map((u) => u._id);

    const posts = await Post.find({ userId: { $in: nonAdminIds } })
      .sort({ createdAt: -1 }) 
      .populate("userId", "name email profilePic title") 
      .populate("likes", "name profilePic")              
      .populate("comments.userId", "name profilePic")    
      .populate("ratings.userId", "name profilePic");    

    const postsWithStats = posts.map((post) => {
      const likesCount = post.likes?.length || 0;
      const avgRating =
        post.ratings?.length > 0
          ? (
              post.ratings.reduce((sum, r) => sum + r.value, 0) /
              post.ratings.length
            ).toFixed(1)
          : 0;

      return {
        ...post.toObject(),
        likesCount,
        averageRating: parseFloat(avgRating),
      };
    });

    return NextResponse.json({ success: true, posts: postsWithStats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// =======================
// 📌 CREATE NEW POST (MERGED WITH AI)
// =======================
export async function POST(req) {
    await connect();

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { title, description, category, images, video } = body;

        if (!title || !description) {
            return NextResponse.json({ success: false, message: "Title and description are required" }, { status: 400 });
        }

        // 🛡️ 1. SEND THE CONTENT TO GOOGLE GEMINI AI
        const aiAnalysis = await checkPostForSpam(title, description);

        // 2. Decide the post's fate based on the AI's verdict
        let postStatus = "Active"; 

        if (aiAnalysis.isSpam && aiAnalysis.confidenceScore > 75) {
            postStatus = "Flagged"; // Trap it!

            // Alert the Activity Log
            await Activity.create({
                userId: userId,
                action: "new_report", 
                details: `🛡️ AI blocked a post by ${session.user.name}. Reason: ${aiAnalysis.reason}`
            });

            // 🚨 TRIGGER THE RED ALERT ON DASHBOARD
            await Report.create({
                reportedUserId: userId,
                reason: "AI Content Filter",
                description: `Blocked Title: "${title}". AI Notes: ${aiAnalysis.reason}`,
                status: "pending"
            });

        } else {
            // Standard activity log for normal, safe posts
            await Activity.create({
                userId: userId,
                action: "new_post",
                details: `${session.user.name} created a new service listing: ${title}`
            });
        }

        // 3. Save the post to the database
        const newPost = await Post.create({
            title,
            description,
            category,
            images: images || [],
            video: video || null,
            userId,
            likes: [],
            comments: [],
            ratings: [],
            status: postStatus 
        });

        // 4. Return success
        return NextResponse.json({ 
            success: true, 
            post: newPost, 
            aiFlagged: postStatus === "Flagged" 
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}