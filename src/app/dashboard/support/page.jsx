"use client";

import { useState, useEffect } from "react";
import { FaHeadset, FaPaperPlane, FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [myTickets, setMyTickets] = useState([]);

  // Fetch the user's past tickets when the page loads
  const fetchMyTickets = async () => {
    try {
      const { data } = await axios.get("/api/support");
      setMyTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return toast.warn("Please fill out all fields.");
    
    setLoading(true);
    try {
      const { data } = await axios.post("/api/support", { subject, message });
      if (data.success) {
        toast.success("Message sent! An Admin will review it shortly.");
        setSubject("");
        setMessage("");
        // Instantly add the new ticket to the top of the list!
        setMyTickets([data.ticket, ...myTickets]);
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 space-y-8">
      
      {/* SECTION 1: THE SUBMISSION FORM */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-6">
          <div className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl">
            <FaHeadset size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Help & Support</h1>
            <p className="text-sm text-slate-500 font-medium">Send a direct message to the BlueCollorHub Admin.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E.g., Issue with booking a worker" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">How can we help?</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your issue in detail..." 
              rows="4"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-all"
            ></textarea>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Sending..." : <><FaPaperPlane /> Send to Admin</>}
          </button>
        </form>
      </div>

      {/* SECTION 2: MY TICKET HISTORY */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-black text-slate-800 mb-6">My Support History</h2>
        
        {myTickets.length === 0 ? (
          <div className="text-center p-8 text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            You have no past support requests.
          </div>
        ) : (
          <div className="space-y-4">
            {myTickets.map(ticket => (
              <div key={ticket._id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Original User Message */}
                <div className="p-5 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{ticket.subject}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {ticket.status === 'Resolved' ? <FaCheckCircle/> : <FaHourglassHalf/>} {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 italic mb-2">"{ticket.message}"</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Admin Reply Area (Only shows if Admin replied) */}
                {ticket.adminReply && (
                  <div className="bg-indigo-50 border-t border-indigo-100 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <FaHeadset size={10} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-800">Admin Resolution</span>
                    </div>
                    <p className="text-sm font-medium text-indigo-900 ml-8 leading-relaxed">
                      {ticket.adminReply}
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}