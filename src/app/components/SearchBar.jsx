"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import indiaStatesWithDistricts from "@/data/southStatesWithDistricts";

// 🚨 Language context
import { useLanguage } from "@/app/dashboard/layout"; 

export default function SearchBar() {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const router = useRouter();

  // 🔥 LOAD SAVED LOCATION (VERY IMPORTANT)
  useEffect(() => {
    const savedState = localStorage.getItem("userState");
    const savedDistrict = localStorage.getItem("userDistrict");

    if (savedState) setState(savedState);
    if (savedDistrict) setDistrict(savedDistrict);
  }, []);

  // 🔍 SEARCH FUNCTION
  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.append("query", searchQuery);
    if (state) params.append("state", state);
    if (district) params.append("district", district);

    router.push(`/dashboard/posts?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 🔥 STATE CHANGE (SAVE TO LOCALSTORAGE)
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setState(selectedState);
    setDistrict("");

    localStorage.setItem("userState", selectedState);
    localStorage.setItem("userDistrict", ""); // reset district
  };

  return (
    <div className="flex items-center gap-4 w-full">
      
      {/* 📍 LOCATION SELECTORS */}
      <div className="flex items-center gap-2 bg-white border border-black rounded-lg p-2 shadow-sm flex-shrink-0">
        <FaMapMarkerAlt className="text-black text-lg ml-1" />

        {/* STATE DROPDOWN */}
        <select
          value={state}
          onChange={handleStateChange}
          className="px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-40 text-sm"
        >
          <option value="">{t("selectState")}</option>

          {Object.keys(indiaStatesWithDistricts).map((st) => (
            <option key={st} value={st}>
              {t(st)}
            </option>
          ))}
        </select>

        {/* DISTRICT DROPDOWN */}
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            localStorage.setItem("userDistrict", e.target.value); // 🔥 SAVE
          }}
          disabled={!state}
          className={`px-3 py-1 rounded-lg border border-black focus:outline-none focus:ring-1 focus:ring-black w-40 text-sm ml-2 ${
            !state ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        >
          <option value="">{t("selectDistrict")}</option>

          {state &&
            indiaStatesWithDistricts[state]?.map((dist) => (
              <option key={dist} value={dist}>
                {t(dist)}
              </option>
            ))}
        </select>
      </div>

      {/* 🔍 SEARCH INPUT */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full border border-gray-400 rounded-l-md pl-4 pr-12 py-2 text-gray-700 focus:outline-none placeholder-gray-500"
        />

        <button
          onClick={handleSearch}
          className="absolute right-0 top-0 h-full px-4 bg-black text-white rounded-r-md hover:bg-gray-800 transition cursor-pointer"
        >
          <FaSearch className="text-lg" />
        </button>
      </div>
    </div>
  );
}