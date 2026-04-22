"use client";

import { UploadButton } from "@uploadthing/react";
import "@uploadthing/react/styles.css";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout"; 

export default function FileUploader() {
  // 🚨 ADDED: Initialize the translation function
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      {/* 🚨 FIX: Translated Heading */}
      <h2 className="text-lg font-bold">{t("uploadFiles")}</h2>

      {/* For Images */}
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Image uploaded:", res);
          // 🚨 FIX: Translated Alert
          alert(t("uploadCompleted"));
        }}
        onUploadError={(error) => {
          // 🚨 FIX: Translated Error Prefix
          alert(`${t("errorPrefix")} ${error.message}`);
        }}
      />

      {/* For Videos */}
      <UploadButton
        endpoint="videoUploader"
        onClientUploadComplete={(res) => {
          console.log("Video uploaded:", res);
        }}
        onUploadError={(error) => {
          // 🚨 FIX: Reusing the uploadFailed translation from earlier!
          alert(`${t("uploadFailed")}: ${error.message}`);
        }}
      />
    </div>
  );
}