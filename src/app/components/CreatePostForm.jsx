// src/app/dashboard/createpost/page.jsx (or wherever your CreatePostForm is located)
"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import "@uploadthing/react/styles.css";
import { toast } from "sonner";
import axios from "axios";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout";

export default function CreatePostForm() {
  // 🚨 ADDED: Initialize the translation function
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [files, setFiles] = useState([]); // uploaded files
  const [saving, setSaving] = useState(false);

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!title || !description || files.length === 0) {
      // 🚨 FIX: Translated error message
      toast.error(t("errReqFields"));
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        description,
        images: mediaType === "image" ? files.map((f) => f.url) : [],
        video: mediaType === "video" ? files[0]?.url : null,
      };

      const { data } = await axios.post("/api/post", body);

      if (data.success) {
        // 🚨 FIX: Translated success message
        toast.success(t("postCreatedSuccess"));
        setTitle("");
        setDescription("");
        setFiles([]);
        setMediaType("image");
      } else {
        // 🚨 FIX: Translated fallback error message
        toast.error(data.message || t("postCreateFail"));
      }
    } catch (err) {
      console.error(err);
      // 🚨 FIX: Translated server error message
      toast.error(t("serverErrCreatePost"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-300 mt-6">
      {/* 🚨 FIX: Translated Heading */}
      <h2 className="text-xl font-bold mb-4 text-black text-center">{t("createNewPost")}</h2>

      {/* Title */}
      <input
        type="text"
        // 🚨 FIX: Translated placeholder
        placeholder={t("postTitlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 border-b border-black mb-4 focus:outline-none"
      />

      {/* Description */}
      <textarea
        // 🚨 FIX: Translated placeholder
        placeholder={t("postDescPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 border-b border-black h-24 resize-none mb-4 focus:outline-none"
      />

      {/* Media Type Selector */}
      <select
        value={mediaType}
        onChange={(e) => {
          setMediaType(e.target.value);
          setFiles([]);
        }}
        className="w-full p-3 border-b border-black mb-4 focus:outline-none"
      >
        {/* 🚨 FIX: Translated Options */}
        <option value="image">{t("image")}</option>
        <option value="video">{t("video")}</option>
      </select>

      {/* Upload Button */}
      <UploadButton
        endpoint={mediaType === "image" ? "imageUploader" : "videoUploader"}
        onClientUploadComplete={(res) => {
          if (res?.length) {
            if (mediaType === "image") {
              setFiles((prev) => [...prev, ...res]);
            } else {
              setFiles([res[0]]);
            }
            // 🚨 FIX: Translated success message
            toast.success(t("fileUploadSuccess"));
          }
        }}
        // 🚨 FIX: Translated error prefix
        onUploadError={(error) => toast.error(`${t("uploadFailed")}: ${error.message}`)}
        multiple={mediaType === "image"}
      />

      {/* Display Uploaded Files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 mt-4">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm gap-2"
            >
              <span className="truncate max-w-xs">{file.name || file.url}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2 rounded-md text-white font-semibold transition ${
          saving ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
        }`}
      >
        {/* 🚨 FIX: Translated Button Text */}
        {saving ? t("saving") : t("createPostBtn")}
      </button>
    </div>
  );
}