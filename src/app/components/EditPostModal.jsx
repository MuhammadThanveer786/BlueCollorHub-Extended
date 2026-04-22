"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FaTimes } from "react-icons/fa";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout";

export default function EditPostModal({ post, isOpen, onClose, onUpdateSuccess }) {
    // 🚨 ADDED: Initialize the translation function
    const { t } = useLanguage();

    const [title, setTitle] = useState(post.title);
    const [description, setDescription] = useState(post.description);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setTitle(post.title);
        setDescription(post.description);
    }, [post]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            // 🚨 FIX: Translated error
            toast.error(t("errEmptyFields"));
            return;
        }
        setIsSubmitting(true);
        try {
            const { data } = await axios.put(`/api/post/${post._id}`, {
                title,
                description,
            });

            if (data.success) {
                // 🚨 FIX: Translated success message
                toast.success(t("postUpdateSuccess"));
                onUpdateSuccess(data.post);
                onClose();
            } else {
                // 🚨 FIX: Translated failure message
                toast.error(data.message || t("postUpdateFail"));
            }
        } catch (err) {
            console.error("Error updating post:", err);
            // 🚨 FIX: Translated general error
            toast.error(err.response?.data?.message || t("generalError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    {/* 🚨 FIX: Translated header */}
                    <h3 className="text-xl font-bold">{t("editPost")}</h3>
                    <button 
                        className="text-gray-500 hover:text-gray-800 transition" 
                        onClick={onClose} 
                        aria-label="Close modal"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            {/* 🚨 FIX: Translated label */}
                            {t("titleLabel")}
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            {/* 🚨 FIX: Translated label */}
                            {t("descLabel")}
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                            disabled={isSubmitting}
                        >
                            {/* 🚨 FIX: Translated cancel button */}
                            {t("cancelBtn")}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {/* 🚨 FIX: Translated save button (reused 'saving' from before) */}
                            {isSubmitting ? t("saving") : t("saveChangesBtn")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}