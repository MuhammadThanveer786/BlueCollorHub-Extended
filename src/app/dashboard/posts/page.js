"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { FaImage } from "react-icons/fa";
// 🚨 1. Added the import for your new Recommendation Engine
import RecommendedWorkers from "../../components/RecommendedWorkers"; 

function PostGridItem({ post }) {
  return (
    <Link
      href={`/dashboard/post/${post._id}`}
      className="relative aspect-square rounded-lg overflow-hidden group shadow-md bg-gray-200 block"
    >
      {post.images?.[0] ? (
        <img
          src={post.images[0]}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FaImage className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute bottom-3 left-3 text-white p-1">
        <h3 className="font-semibold text-sm truncate">{post.title}</h3>
        <p className="text-xs text-gray-200 truncate">
          by {post.userId?.name || "User"}
        </p>
      </div>
    </Link>
  );
}

function PostsContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const query = searchParams.get("query") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";
  const category = searchParams.get("category") || "";
  const skill = searchParams.get("skill") || "";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const finalCategory = (category === "All Categories") ? "" : category;

        const { data } = await axios.get("/api/post/search", {
          params: { query, state, district, category: finalCategory, skill },
        });

        if (data.success) {
          setPosts(data.posts || []);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error(err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query, state, district, category, skill]);

  if (loading) return <div className="text-center py-10 text-gray-500">Loading posts...</div>;

  // 🚨 2. Updated the return to stack the Smart Matches ABOVE your standard grid!
  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* --- TOP SECTION: THE ALGORITHM --- */}
      <div className="w-full">
        <RecommendedWorkers />
      </div>

      {/* --- BOTTOM SECTION: THE STANDARD FEED --- */}
      <div className="w-full">
        {posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No posts found matching your criteria.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <PostGridItem key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading posts...</div>}>
      <PostsContent />
    </Suspense>
  );
}