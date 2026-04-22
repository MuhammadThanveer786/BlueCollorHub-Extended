// src/app/admin/tickets/page.jsx
"use client";

import { useState, useEffect } from "react";
import { FaTicketAlt, FaReply, FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";

export default function AdminTicketsManager() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await axios.get("/api/admin/tickets");
        setTickets(data.tickets || []);
      } catch (error) { 
        toast.error("Failed to load tickets."); 
      }
    };
    fetchTickets();
  }, []);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/admin/tickets/${selectedTicket._id}/reply`, { replyMessage: reply });
      if (data.success) {
        toast.success("Reply sent. Ticket resolved.");
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? data.ticket : t));
        setSelectedTicket(null); 
        setReply("");
      }
    } catch (error) { 
      toast.error("Failed to send reply."); 
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[85vh] md:h-[80vh] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-4 md:mt-6 mx-2 md:mx-6">
      
      <div className="w-full md:w-1/3 h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 shrink-0">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3">
                <FaTicketAlt className="text-blue-500"/>
                Support Tickets
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
            {(!tickets || tickets.length === 0) ? (
                <div className="p-10 text-center text-slate-400 italic">No tickets found.</div>
            ) : (
                tickets.map(t => (
                    <button 
                      key={t._id} 
                      onClick={() => setSelectedTicket(t)} 
                      className={`p-4 md:p-5 w-full text-left flex gap-3 transition-all ${selectedTicket?._id === t._id ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 truncate">@{t.userId?.name || "Unknown User"}</span>
                                <span className={`flex shrink-0 items-center gap-1 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {t.status === 'Resolved' ? <FaCheckCircle/> : <FaHourglassHalf/>} {t.status}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 truncate">{t.subject}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{t.message}</p>
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-8 bg-gray-50/50 overflow-y-auto">
        {selectedTicket ? (
            <>
                <div className="border border-slate-200 bg-white rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shrink-0">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">{selectedTicket.subject}</h1>
                        <p className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="bg-slate-100 text-slate-700 p-3 md:p-4 rounded-xl text-sm italic">"{selectedTicket.message}"</p>
                </div>

                {selectedTicket.adminReply && (
                    <div className="border-l-4 border-green-400 bg-green-50 rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shrink-0">
                        <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2"><FaCheckCircle/> Your Resolution</h4>
                        <p className="text-sm text-green-800">{selectedTicket.adminReply}</p>
                    </div>
                )}

                {selectedTicket.status !== 'Resolved' && (
                    <div className="mt-auto bg-white border border-slate-200 p-4 md:p-6 rounded-2xl shadow-lg shrink-0">
                        <h3 className="font-bold text-sm mb-3">Respond to User</h3>
                        <textarea 
                          value={reply}
                          onChange={e => setReply(e.target.value)}
                          placeholder="Type your official resolution or answer here..."
                          rows="4"
                          className="w-full border border-slate-300 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 md:mb-4"
                        ></textarea>
                        <button 
                          onClick={handleSendReply}
                          disabled={loading || !reply.trim()}
                          className="w-full bg-blue-600 text-white font-bold py-2.5 md:py-3 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 text-sm md:text-base"
                        >
                          {loading ? "Sending..." : <><FaReply/> Send Reply & Close Ticket</>}
                        </button>
                    </div>
                )}
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full py-10">
                <FaTicketAlt size={48} className="mb-4 opacity-30 md:size-16"/>
                <p className="text-lg md:text-xl font-bold">Select a ticket</p>
                <p className="text-xs md:text-sm text-center px-4 mt-1">to view details and submit your resolution.</p>
            </div>
        )}
      </div>
    </div>
  );
}