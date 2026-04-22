"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FaCheck, FaTimes, FaRupeeSign, FaCalendarAlt, FaUserCircle } from "react-icons/fa";
import Link from "next/link";

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
);

export default function JobRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data } = await axios.get("/api/bookings");
        if (data.success) {
            setRequests(data.requests);
        }
      } catch (err) {
        toast.error("Failed to load your job requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
        // Make sure you created the PUT route at: app/api/bookings/[bookingId]/route.js
        const { data } = await axios.put(`/api/bookings/${bookingId}`, { status: newStatus });
        
        if (data.success) {
            toast.success(`Job ${newStatus} successfully!`);
            // Update the UI to reflect the new status without refreshing
            setRequests(requests.map(req => 
                req._id === bookingId ? { ...req, status: newStatus } : req
            ));
        }
    } catch (err) {
        toast.error("Failed to update status.");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-scroll">
      <h1 className="text-3xl font-bold mb-6">Incoming Job Requests</h1>
      
      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center text-gray-500">
            <p>You have no pending job requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req._id} className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              
              {/* Customer Info & Job Details */}
              <div className="flex gap-4 items-start w-full">
                
                {/* 🚨 ADDED: Link wrapper for the Profile Picture */}
                <Link href={`/dashboard/profile/${req.customerId?._id}`}>
                    {req.customerId?.profilePic ? (
                        <img 
                            src={req.customerId.profilePic} 
                            alt="Customer" 
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition" 
                        />
                    ) : (
                        <FaUserCircle className="w-12 h-12 text-gray-300 cursor-pointer hover:text-blue-500 transition" />
                    )}
                </Link>
                
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-black">{req.title}</h3>
                    
                    {/* 🚨 ADDED: Link wrapper for the Customer's Name */}
                    <p className="text-sm text-gray-500 mb-2">
                        Requested by{" "}
                        <Link 
                            href={`/dashboard/profile/${req.customerId?._id}`} 
                            className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                        >
                            {req.customerId?.name || "Unknown User"}
                        </Link>
                    </p>
                    
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">{req.description}</p>
                    
                    <div className="flex gap-4 mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-green-600">
                            <FaRupeeSign /> {req.proposedBudget}
                        </span>
                        <span className="flex items-center gap-1">
                            <FaCalendarAlt /> {new Date(req.scheduledDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
              </div>

              {/* Action Buttons based on Status */}
              <div className="w-full md:w-auto flex md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                {req.status === "pending" ? (
                    <>
                        <button 
                            onClick={() => handleUpdateStatus(req._id, "accepted")}
                            className="flex-1 md:w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition"
                        >
                            <FaCheck /> Accept
                        </button>
                        <button 
                            onClick={() => handleUpdateStatus(req._id, "declined")}
                            className="flex-1 md:w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-lg transition"
                        >
                            <FaTimes /> Decline
                        </button>
                    </>
                ) : (
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold text-center uppercase tracking-widest ${
                        req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        req.status === 'declined' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {req.status}
                    </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}