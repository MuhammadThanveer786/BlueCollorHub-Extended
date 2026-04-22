"use client";
import { useState } from "react";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout"; 

export default function Posts() {
  // 🚨 ADDED: Initialize the translation function
  const { t } = useLanguage();

  const [posts, setPosts] = useState([
    { id: 1, liked: false },
    { id: 2, liked: false },
    { id: 3, liked: false },
  ]);

  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked } : p))
    );
  };

  return (
    <div className="p-4 space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="p-4 border rounded-md shadow-sm flex justify-between items-center"
        >
          {/* 🚨 FIX: Dynamically translating the word "Post" with its ID */}
          <h2 className="font-semibold">{t("postWord")} {post.id}</h2>
          
          <button
            onClick={() => toggleLike(post.id)}
            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {/* 🚨 FIX: Translated the Like/Liked text */}
            {post.liked ? `❤️ ${t("likedBtn")}` : `♡ ${t("likeBtn")}`}
          </button>
        </div>
      ))}
    </div>
  );
}