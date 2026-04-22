import connect from "../../../../lib/mongodb";
import Post from "../../../../models/Post";
import User from "../../../../models/User";

export async function GET(req) {
  await connect();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    
    const rawCategory = searchParams.get("category");
    const category = (rawCategory === "All Categories" || rawCategory === "null" || !rawCategory) 
      ? "" 
      : decodeURIComponent(rawCategory);

    const rawSkill = searchParams.get("skill");
    const skill = (rawSkill === "null" || !rawSkill) 
      ? "" 
      : decodeURIComponent(rawSkill);

    // 🛡️ INITIAL FILTER: Always exclude Admins from search results
    const userFilter = {
        role: { $ne: "admin" }
    };

    // 🗺️ Location filters
    if (state && state !== "Select State") {
      userFilter["location.state"] = new RegExp(`^${state}$`, "i");
    }
    if (district && district !== "Select District") {
      userFilter["location.district"] = new RegExp(`^${district}$`, "i");
    }

    // 🧰 Category and skill filters
    if (category) {
      userFilter.skillCategories = { $in: [new RegExp(category, "i")] };
    }
    if (skill) {
      userFilter.skills = { $in: [new RegExp(skill, "i")] };
    }

    // 🔍 Query filter (Search by Username OR Skills)
    if (query) {
      const regex = new RegExp(query, "i");
      // This ensures we find the user if their name matches OR if they have the skill
      userFilter.$or = [
        { name: regex }, 
        { skills: { $in: [regex] } }
      ];
    }

    // 1. Find matching Users who are NOT admins
    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, posts: [] }), { status: 200 });
    }

    // 2. Find Posts belonging to those specific users
    const posts = await Post.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "name email profilePic title location skills skillCategories")
      .populate("likes", "name profilePic")
      .populate("comments.userId", "name profilePic")
      .populate("ratings.userId", "name profilePic");

    const postsWithStats = posts.map((post) => {
      const likesCount = post.likes?.length || 0;
      const avgRating = post.ratings?.length > 0
          ? (post.ratings.reduce((sum, r) => sum + r.value, 0) / post.ratings.length).toFixed(1)
          : 0;

      return {
        ...post.toObject(),
        likesCount,
        averageRating: parseFloat(avgRating),
      };
    });

    return new Response(JSON.stringify({ success: true, posts: postsWithStats }), { status: 200 });
  } catch (error) {
    console.error("❌ Error in filtered search:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
}