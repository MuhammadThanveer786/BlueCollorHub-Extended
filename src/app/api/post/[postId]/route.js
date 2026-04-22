import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connect from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET(request, { params }) {
    // FIX: Await params before accessing properties
    const resolvedParams = await params;
    const { postId } = resolvedParams;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
         return new NextResponse(JSON.stringify({ success: false, message: "Invalid Post ID" }), { status: 400 });
    }
  
    await connect();

    try {
        const post = await Post.findById(postId)
            .populate('userId', 'name profilePic title overallRating')
            .populate('comments.userId', 'name profilePic')
            .populate('ratings.userId', 'name'); 

        if (!post) {
            return new NextResponse(JSON.stringify({ success: false, message: "Post not found" }), { status: 404 });
        }

        return new NextResponse(JSON.stringify({ success: true, post }), { status: 200 });

    } catch (error) {
        console.error("Error fetching post:", error);
        return new NextResponse(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
    }
}

export async function PUT(request, { params }) {
    // FIX: Await params before accessing properties
    const resolvedParams = await params;
    const { postId } = resolvedParams;
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse(JSON.stringify({ message: "Not authenticated" }), { status: 401 });
    }

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return new NextResponse(JSON.stringify({ message: "Invalid Post ID" }), { status: 400 });
    }

    try {
        const body = await request.json();
        const { title, description } = body;

        if (!title || !description) {
            return new NextResponse(JSON.stringify({ message: "Title and description are required" }), { status: 400 });
        }

        await connect();
        
        const post = await Post.findById(postId);

        if (!post) {
            return new NextResponse(JSON.stringify({ message: "Post not found" }), { status: 404 });
        }

        // Only the owner can edit their post
        if (post.userId.toString() !== session.user.id) {
            return new NextResponse(JSON.stringify({ message: "Not authorized" }), { status: 403 });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { title, description },
            { new: true }
        ).populate('userId', 'name profilePic title overallRating');

        return new NextResponse(JSON.stringify({ success: true, post: updatedPost }), { status: 200 });

    } catch (error) {
        console.error("Error updating post:", error);
        return new NextResponse(JSON.stringify({ message: "Failed to update post" }), { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    // FIX: Await params before accessing properties
    const resolvedParams = await params;
    const { postId } = resolvedParams;
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse(JSON.stringify({ message: "Not authenticated" }), { status: 401 });
    }
    
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return new NextResponse(JSON.stringify({ message: "Invalid Post ID" }), { status: 400 });
    }

    await connect();

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return new NextResponse(JSON.stringify({ message: "Post not found" }), { status: 404 });
        }

        // <-- ADDED ADMIN MODERATION POWER: Admins can delete any post
        const isOwner = post.userId.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return new NextResponse(JSON.stringify({ message: "Not authorized" }), { status: 403 });
        }

        await Post.findByIdAndDelete(postId);

        return new NextResponse(JSON.stringify({ success: true, message: "Post deleted" }), { status: 200 });

    } catch (error) {
        console.error("Error deleting post:", error);
        return new NextResponse(JSON.stringify({ message: "Failed to delete post" }), { status: 500 });
    }
}