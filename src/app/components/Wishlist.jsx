"use client";
import { useState } from "react";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout";

export default function Wishlist() {
  // 🚨 ADDED: Initialize the translation function
  const { t } = useLanguage();

  const [items, setItems] = useState([
    { id: 1 }, // Removed hardcoded names, we will translate them dynamically below!
    { id: 2 },
  ]);

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      {items.length === 0 ? (
        // 🚨 FIX: Translated empty wishlist message
        <p className="text-gray-500">{t("emptyWishlist")}</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-md shadow-sm flex justify-between items-center"
          >
            {/* 🚨 FIX: Dynamically translating the item name for the mock data */}
            <span className="font-semibold">{t("wishlistItem")} {item.id}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              {/* 🚨 FIX: Reusing the Remove button translation */}
              {t("removeBtn")}
            </button>
          </div>
        ))
      )}
    </div>
  );
}