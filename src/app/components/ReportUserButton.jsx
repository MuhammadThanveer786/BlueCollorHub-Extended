// src/components/ReportUserButton.jsx
"use client";

import { useState } from "react";
import { FaFlag } from "react-icons/fa";
import { toast } from "sonner";
// 🚨 ADDED: Import the language context!
import { useLanguage } from "@/app/dashboard/layout";

export default function ReportUserButton({ reportedUserId, reportedUserName }) {
  // 🚨 ADDED: Initialize the translation function
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("Fake Profile");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Must match your Database Schema enums!
  const reportReasons = [
    "Fake Profile",
    "Harassment",
    "Scam/Fraud",
    "Inappropriate Content",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description
        }),
      });

      if (res.ok) {
        // 🚨 FIX: Translated success message
        toast.success(t("reportSubmitted"));
        setIsOpen(false);
        setDescription(""); // Reset form
      } else {
        const data = await res.json();
        // 🚨 FIX: Translated error message
        toast.error(`${t("reportSubmitFail")} ${data.message}`);
      }
    } catch (error) {
      // 🚨 FIX: Translated general error
      toast.error(t("reportError"));
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      {/* The Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition"
        // 🚨 FIX: Translated title attribute
        title={`${t("report")} ${reportedUserName}`}
      >
        <FaFlag size={14} />
        {/* 🚨 FIX: Translated button text */}
        <span>{t("reportUser")}</span>
      </button>

      {/* The Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              {/* 🚨 FIX: Translated header */}
              <h3 className="font-bold text-gray-800">{t("report")} {reportedUserName}</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                {/* 🚨 FIX: Translated label */}
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("reasonForReporting")}</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {reportReasons.map(r => (
                    // 🚨 FIX: Value stays English for DB, but displayed text is translated
                    <option key={r} value={r}>{t(r)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                {/* 🚨 FIX: Translated label */}
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("additionalDetails")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  // 🚨 FIX: Translated placeholder
                  placeholder={t("reportContextPlaceholder")}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-black"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 transition"
                >
                  {/* 🚨 FIX: Reused cancelBtn translation */}
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  {/* 🚨 FIX: Translated submit states */}
                  {isSubmitting ? t("submitting") : t("submitReport")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}