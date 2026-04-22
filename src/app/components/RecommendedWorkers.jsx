"use client";

import { useState, useEffect } from "react";
import { FaStar, FaMapMarkerAlt, FaUserCheck, FaBolt, FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";
import axios from "axios";

export default function RecommendedWorkers({ requiredSkills = ["Plumber", "Electrician", "Carpenter", "Handyman"] }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("Locating you...");
  const [errorMessage, setErrorMessage] = useState(null); // 🚨 Added to catch errors!

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus("Found you! Crunching the algorithm...");
          fetchRecommendations(longitude, latitude);
        },
        (error) => {
          console.warn("Location blocked.");
          fetchRecommendations(78.4747, 17.3616); 
        }
      );
    }
  }, []);

  const fetchRecommendations = async (lng, lat) => {
    try {
      // 🚨 Switched to Axios for better timeout/error catching
      const { data } = await axios.post("/api/recommendations", {
        userLng: lng,
        userLat: lat,
        requiredSkills: requiredSkills
      });
      
      if (data.success) {
        setWorkers(data.workers);
      } else {
        setErrorMessage(data.error || "Unknown API Error");
      }
    } catch (err) {
      console.error("Algorithm Error:", err);
      // Force the error to show on the screen
      setErrorMessage(err.response?.data?.error || err.message || "Failed to reach backend.");
    } finally {
      setLoading(false); // Force loading to stop!
    }
  };

  if (loading) {
    return (
      <div className="py-10 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
        <FaBolt className="text-blue-500 animate-pulse text-3xl mb-3" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{locationStatus}</p>
      </div>
    );
  }

  // 🚨 Show the exact error if it crashed
  if (errorMessage) {
    return (
      <div className="py-6 px-4 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-4 text-red-600">
        <FaExclamationTriangle className="text-2xl" />
        <div>
          <h4 className="font-bold uppercase tracking-widest text-[10px]">Algorithm Crash</h4>
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // 🚨 Show a message if it worked, but found no matching users
  if (workers.length === 0) {
    return (
      <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm font-medium">
        Algorithm finished, but 0 workers matched. <br/>
        (Did you add the skill "Plumber" to your dummy user in Atlas?)
      </div>
    );
  }

  return (
    <div className="my-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl shadow-lg shadow-orange-200">
          <FaStar />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Matches Near You</h2>
          <p className="text-sm text-slate-500 font-medium">Ranked by skill, distance, and platform trust.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div key={worker._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <img src={worker.profilePic || '/profile.jpg'} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-lg font-black text-xs">
                  <FaStar size={10} /> {worker.averageRating?.toFixed(1) || "New"}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 mt-2 flex items-center gap-1">
                  <FaMapMarkerAlt /> {(worker.distanceToUser / 1000).toFixed(1)} km away
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              {worker.name} {worker.isVerified && <FaUserCheck className="text-blue-500 text-sm" />}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
              {worker.skills?.slice(0, 3).map(skill => (
                <span key={skill} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {skill}
                </span>
              ))}
            </div>

            <Link href={`/dashboard/profile/${worker._id}`} className="block w-full py-3 bg-slate-900 text-white text-center rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-200">
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}