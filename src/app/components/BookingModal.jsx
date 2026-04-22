"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FaTimes, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";

export default function BookingModal({ workerId, workerName, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    proposedBudget: "",
    scheduledDate: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await axios.post("/api/bookings", {
        workerId,
        ...formData
      });

      if (data.success) {
        toast.success(`Booking request sent to ${workerName}!`);
        onClose(); // Close the modal on success
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-black">Request Service</h2>
            <p className="text-slate-400 text-sm font-medium">Booking {workerName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Job Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Fix leaking kitchen pipe" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium text-black"
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Description</label>
            <textarea 
              required
              rows="3" 
              placeholder="Describe what needs to be done..." 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium resize-none text-black"
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Proposed Budget</label>
              <div className="relative">
                <FaRupeeSign className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  required
                  type="number" 
                  min="1"
                  placeholder="0" 
                  className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium text-black"
                  onChange={e => setFormData({...formData, proposedBudget: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Requested Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  required
                  type="date" 
                  className="w-full p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-600"
                  onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Sending Request..." : "Submit Job Request"}
          </button>
        </form>
      </div>
    </div>
  );
}