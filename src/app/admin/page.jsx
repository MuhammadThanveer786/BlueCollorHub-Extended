"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { 
  FaSearch, FaEye, FaUsers, FaCheckCircle, 
  FaBriefcase, FaExclamationTriangle, FaChartLine, 
  FaBullhorn, FaTrash, FaUserShield, FaHistory,
  FaShieldAlt, FaUserCheck, FaUserTimes, FaBan,
  FaClock, FaEnvelope, FaMapMarkerAlt, FaExternalLinkAlt,
  FaTicketAlt, FaBars, FaTimes // 🚨 ADDED: FaBars and FaTimes for mobile menu
} from "react-icons/fa"; 
import { toast } from "sonner";
import Link from 'next/link'; 
import AdminTicketsManager from "@/app/admin/tickets/page";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("home");
  const [isLoading, setIsLoading] = useState(false);
  // 🚨 ADDED: Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState(null); 
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState(""); 
  const [reportFilter, setReportFilter] = useState("all");

  const [selectedPost, setSelectedPost] = useState(null); 
  const [showBroadcastModal, setShowBroadcastModal] = useState(false); 
  const [broadcastMessage, setBroadcastMessage] = useState(""); 
  const [isBroadcasting, setIsBroadcasting] = useState(false); 

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user?.role !== "admin")) {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) { console.error("Stats Error:", error); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (error) { console.error("Users Error:", error); }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/posts?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setPosts(data.posts);
    } catch (error) { console.error("Posts Error:", error); }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reports?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setReports(data.reports);
    } catch (error) { console.error("Reports Error:", error); }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      if (res.ok) setActivities(data.activities);
    } catch (error) { console.error("Activity Error:", error); }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      setIsLoading(true);
      const refreshData = async () => {
        if (activeTab === "home") {
          await Promise.all([fetchStats(), fetchActivities()]);
        } else if (activeTab === "users") {
          await fetchUsers();
        } else if (activeTab === "posts") {
          await fetchPosts();
        } else if (activeTab === "reports") {
          await fetchReports();
        }
        setIsLoading(false);
      };
      refreshData();
    }
  }, [activeTab, session, fetchStats, fetchUsers, fetchPosts, fetchReports, fetchActivities]);

  const handleUserAction = async (userId, action) => {
    let days = 0;
    if (action === "suspend") {
      const input = window.prompt("Enter number of days to ban this user (Enter 0 to unban):", "7");
      if (input === null) return; 
      days = parseInt(input);
      if (isNaN(days) || days < 0) return toast.error("Invalid duration.");
    } else {
      const confirmMsg = action === "delete" 
        ? "🚨 CRITICAL: Permanently delete this account and all associated posts/messages?" 
        : "Toggle verification status for this professional?";
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, days })
      });
      if (res.ok) {
        toast.success(`Action '${action}' executed successfully.`);
        fetchUsers();
        fetchActivities(); 
      }
    } catch (err) { toast.error("Database communication failed."); }
  };

  const handleNotifyUser = async (user) => {
    const message = window.prompt(`Send warning to ${user.name}:`);
    if (!message) return;

    try {
      const res = await fetch("/api/admin/users/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user._id, 
          title: "⚠️ Administrative Warning", 
          message, 
          type: "admin_warning" 
        })
      });
      if (res.ok) toast.success("Warning dispatched.");
    } catch (err) { toast.error("Failed to send notification."); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return toast.error("Broadcast content required.");
    if (!window.confirm("This will notify EVERY registered user instantly. Proceed?")) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMessage, type: "admin_info" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Broadcast successful.");
        setShowBroadcastModal(false);
        setBroadcastMessage("");
        fetchActivities();
      } else {
        toast.error(data.message);
      }
    } catch (err) { toast.error("Broadcast server error."); }
    setIsBroadcasting(false);
  };

  const handlePostAction = async (postId, action) => {
    if (action === "delete") {
      const reason = window.prompt("Reason for removal (displayed to user):", "Violation of Service Terms.");
      if (!reason) return; 
      try {
        const res = await fetch("/api/admin/posts/manage", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ postId, action, reason }) 
        });
        if (res.ok) { 
          toast.success("Content terminated."); 
          setSelectedPost(null); 
          fetchPosts(); 
          fetchActivities();
        }
      } catch (err) { toast.error("Decline: Server error."); }
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: action })
      });
      if (res.ok) {
        toast.success(`Incident report marked as ${action.replace('_', ' ')}.`);
        fetchReports(); 
      } else {
        toast.error("Failed to update the report.");
      }
    } catch (err) { 
      toast.error("Database communication failed."); 
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.title?.toLowerCase().includes(postSearch.toLowerCase()) || 
    p.userId?.name?.toLowerCase().includes(postSearch.toLowerCase())
  );

  if (status === "loading") return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold animate-pulse">Establishing Secure Connection...</p>
      </div>
    </div>
  );

  if (!session || session.user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-50 flex relative font-sans text-slate-900">
      
      {/* 🚨 MOBILE FIX: Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      {/* 🚨 MOBILE FIX: Changed to fixed pos on mobile, static on desktop */}
      <aside className={`w-72 bg-slate-900 text-white shadow-2xl h-screen fixed lg:sticky top-0 z-50 flex flex-col p-6 border-r border-slate-800 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between gap-3 mb-10 md:mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">Control Hub</h1>
          </div>
          {/* 🚨 MOBILE FIX: Close button inside sidebar */}
          <button className="lg:hidden text-slate-400 hover:text-white p-2" onClick={() => setMobileMenuOpen(false)}>
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Main Menu</p>
          {[
            { id: "home", label: "Overview", icon: <FaChartLine /> },
            { id: "users", label: "User Accounts", icon: <FaUsers /> },
            { id: "posts", label: "Service Listings", icon: <FaBriefcase /> },
            { id: "reports", label: "Conflict Logs", icon: <FaExclamationTriangle /> },
            { id: "tickets", label: "Support Tickets", icon: <FaTicketAlt /> } 
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setMobileMenuOpen(false); // Close on mobile click
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === item.id ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 lg:translate-x-2" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <span className={`${activeTab === item.id ? "scale-110" : "group-hover:scale-110"} transition-transform`}>{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
              {item.id === "reports" && stats?.pendingReports > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{stats.pendingReports}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button onClick={() => router.push('/dashboard/posts')} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-blue-900/20 hover:text-blue-400 transition-all font-bold text-xs uppercase tracking-widest">
            <FaEye /> View User Interface
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      {/* 🚨 MOBILE FIX: Reduced padding and ensured w-full */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden w-full max-w-full">
        
        {/* HEADER AREA */}
        {/* 🚨 MOBILE FIX: Hamburger menu next to title */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="flex items-start gap-4">
            <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden mt-1 p-2 bg-white text-slate-800 rounded-lg shadow-sm border border-slate-200"
            >
                <FaBars size={20} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-1 md:mb-2">
                {activeTab === "home" ? "Platform Intelligence" : 
                 activeTab === "users" ? "Account Database" : 
                 activeTab === "posts" ? "Content Oversight" : 
                 activeTab === "tickets" ? "Support Center" : "Incident Reports"}
              </h2>
              <p className="text-slate-500 text-sm md:text-lg font-medium">System status: <span className="text-green-600">Optimal</span></p>
            </div>
          </div>
          
          {/* 🚨 MOBILE FIX: Full width button on mobile */}
          <button 
            onClick={() => setShowBroadcastModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-95 font-black uppercase tracking-tighter text-sm"
          >
            <FaBullhorn /> Global Broadcast
          </button>
        </header>

        {/* --- SECTION: DASHBOARD OVERVIEW --- */}
        {activeTab === "home" && (
          <div className="space-y-6 md:space-y-10 animate-fadeIn">
            {/* STAT CARDS */}
            {/* 🚨 MOBILE FIX: Adjusted grid gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: "Platform Members", val: stats?.totalUsers, icon: <FaUsers />, color: "blue", trend: "+12%" },
                { label: "Verified Pros", val: stats?.verifiedUsers, icon: <FaCheckCircle />, color: "green", trend: "Active" },
                { label: "Public Listings", val: stats?.totalPosts, icon: <FaBriefcase />, color: "purple", trend: "Live" },
                { label: "Security Alerts", val: stats?.pendingReports, icon: <FaExclamationTriangle />, color: "red", trend: stats?.pendingReports > 0 ? "Action Req" : "Quiet" }
              ].map((card, idx) => (
                <div key={idx} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className={`p-3 md:p-4 bg-${card.color}-50 text-${card.color}-600 rounded-xl md:rounded-2xl group-hover:bg-${card.color}-600 group-hover:text-white transition-all duration-300`}>
                      {card.icon}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-${card.color}-50 text-${card.color}-600`}>{card.trend}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] mb-1">{card.label}</p>
                  <h4 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{isLoading ? "---" : card.val}</h4>
                </div>
              ))}
            </div>

            {/* QUICK ACTIVITY SECTION */}
            {/* QUICK ACTIVITY SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px] md:min-h-[400px] flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8 shrink-0">
                  <h5 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3">
                    <FaHistory className="text-blue-600" /> Recent Interactions
                  </h5>
                  <button onClick={fetchActivities} className="text-xs font-bold text-blue-600 hover:underline">Refresh Logs</button>
                </div>
                
                {/* 🚨 THE FIX: overflow-auto enables BOTH scrollbars at the same time */}
                <div className="overflow-auto max-h-[300px] md:max-h-[400px] custom-scrollbar pr-2 pb-2">
                  
                  {/* 🚨 THE TRICK: min-w-[600px] forces the content to be wide, triggering the horizontal scroll */}
                  <div className="flex flex-col gap-4 md:gap-6 min-w-[600px] md:min-w-[800px]">
                    {activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 md:h-64 text-slate-400 w-full">
                        <FaClock size={32} className="mb-4 opacity-20" />
                        <p className="italic font-medium text-sm text-center px-4">Listening for real-time network events...</p>
                      </div>
                    ) : (
                      activities.map((log) => (
                        <div key={log._id} className="flex items-center gap-3 md:gap-5 p-3 md:p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {log.action === "new_user" && <FaUsers className="text-blue-500 text-sm md:text-base" />}
                            {log.action === "new_post" && <FaBriefcase className="text-purple-500 text-sm md:text-base" />}
                            {log.action === "user_verified" && <FaUserCheck className="text-green-500 text-sm md:text-base" />}
                            {log.action === "new_report" && <FaExclamationTriangle className="text-red-500 text-sm md:text-base" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Removed truncate so the text forces the box to be wide */}
                            <p className="text-slate-700 text-sm md:text-base font-bold leading-tight">{log.details}</p>
                            <div className="flex items-center gap-2 md:gap-3 mt-1">
                               <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase flex items-center gap-1">
                                 <FaClock /> {new Date(log.createdAt).toLocaleTimeString()}
                               </span>
                               <span className="text-[10px] text-slate-400">•</span>
                               <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase">{new Date(log.createdAt).toDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                </div>
              </div>

              {/* SERVER MONITOR PANEL */}
              <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl flex flex-col">
                <h5 className="font-black text-blue-400 uppercase tracking-widest text-[10px] md:text-xs mb-6 md:mb-8">Node Diagnostics</h5>
                <div className="space-y-4 md:space-y-6 flex-1">
                   {[
                     { label: "MongoDB Clusters", stat: "Connected", color: "text-green-400" },
                     { label: "Socket Server", stat: "1.2ms Latency", color: "text-green-400" },
                     { label: "Cloudinary API", stat: "Ready", color: "text-blue-400" },
                     { label: "Auth Middleware", stat: "Secured", color: "text-green-400" }
                   ].map((node, i) => (
                     <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-3 md:pb-4">
                       <span className="text-slate-400 font-bold text-xs md:text-sm">{node.label}</span>
                       <span className={`text-[10px] md:text-xs font-black uppercase ${node.color}`}>{node.stat}</span>
                     </div>
                   ))}
                </div>
                <div className="mt-8 md:mt-10 p-4 bg-slate-800 rounded-xl md:rounded-2xl">
                   <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase mb-2">Memory Usage</p>
                   <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-blue-500"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION: USER MANAGEMENT --- */}
        {activeTab === "users" && (
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 xl:gap-6">
               <div>
                 <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1">Authenticated Nodes</h3>
                 <p className="text-xs md:text-sm text-slate-500 font-medium">Verify skills and manage access</p>
               </div>
               <div className="relative w-full xl:w-96">
                  <FaSearch className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Search identity..." 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                    className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl md:rounded-2xl outline-none text-xs md:text-sm transition-all" 
                  />
               </div>
            </div>
            
            {/* 🚨 MOBILE FIX: overflow-x-auto keeps the table scrollable horizontally */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50/50 text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 md:px-10 py-4 md:py-6">Human Identity</th>
                    <th className="px-6 md:px-10 py-4 md:py-6">Tier / Access</th>
                    <th className="px-6 md:px-10 py-4 md:py-6">Current Status</th>
                    <th className="px-6 md:px-10 py-4 md:py-6 text-right">Moderation Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" className="p-16 md:p-32 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <FaUsers size={40} className="mb-4 md:size-60" />
                        <p className="text-lg md:text-xl font-black italic">No records match the query.</p>
                      </div>
                    </td></tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuspended = u.deactivatedUntil && new Date(u.deactivatedUntil) > new Date();
                      return (
                        <tr key={u._id} className="group hover:bg-slate-50 transition-all duration-150">
                          <td className="px-6 md:px-10 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                               <div className="relative">
                                 <img src={u.profilePic || '/profile.jpg'} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-white shadow-md object-cover" />
                                 {u.isVerified && <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-blue-600 text-white p-0.5 md:p-1 rounded-md md:rounded-lg border-2 border-white shadow-lg"><FaCheckCircle size={8} className="md:size-10"/></div>}
                               </div>
                               <div>
                                  <div className="font-black text-slate-800 text-sm md:text-base leading-tight group-hover:text-blue-600 transition-colors">{u.name}</div>
                                  <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-400 mt-1 font-medium">
                                    <FaEnvelope size={10}/> {u.email}
                                  </div>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-4 md:py-6">
                             <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                               {u.role || 'user'}
                             </span>
                          </td>
                          <td className="px-6 md:px-10 py-4 md:py-6">
                             {isSuspended ? (
                               <div className="flex flex-col">
                                  <span className="text-red-500 text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1 animate-pulse"><FaBan /> Access Restricted</span>
                                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold italic mt-0.5">Expiry: {new Date(u.deactivatedUntil).toLocaleDateString()}</span>
                                </div>
                             ) : <span className="text-green-600 text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Authorized</span>}
                          </td>
                          <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                             {/* 🚨 MOBILE FIX: Removed opacity-0 on mobile so buttons are always visible, touch screens don't have hover! */}
                             <div className="flex justify-end gap-1.5 md:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                               <button 
                                 title="Verify Professional"
                                 onClick={() => handleUserAction(u._id, "verify")} 
                                 className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition ${u.isVerified ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200'}`}
                               >
                                 <FaUserCheck size={14}/>
                               </button>
                               <button 
                                 title="Issue Warning"
                                 onClick={() => handleNotifyUser(u)} 
                                 className="p-2.5 md:p-3 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg md:rounded-xl transition hover:shadow-lg hover:shadow-amber-200"
                               >
                                 <FaBullhorn size={14}/>
                               </button>
                               <button 
                                 title="Ban/Unban"
                                 onClick={() => handleUserAction(u._id, "suspend")} 
                                 className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition ${isSuspended ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'}`}
                               >
                                 <FaBan size={14}/>
                               </button>
                               <button 
                                 title="Purge Account"
                                 onClick={() => handleUserAction(u._id, "delete")} 
                                 className="p-2.5 md:p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg md:rounded-xl transition"
                               >
                                 <FaTrash size={14}/>
                               </button>
                             </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SECTION: CONTENT MODERATION --- */}
        {activeTab === "posts" && (
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 animate-fadeIn overflow-hidden">
            <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 xl:gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1">Service Inventory</h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Inspect public listings</p>
                </div>
                <input 
                  type="text" 
                  placeholder="Filter by title or author..." 
                  value={postSearch} 
                  onChange={(e) => setPostSearch(e.target.value)} 
                  className="w-full xl:w-96 px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl md:rounded-2xl outline-none text-xs md:text-sm transition-all" 
                />
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 md:px-10 py-4 md:py-6">Listing Core</th>
                    <th className="px-6 md:px-10 py-4 md:py-6">Professional Origin</th>
                    <th className="px-6 md:px-10 py-4 md:py-6 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPosts.map((post) => (
                    <tr key={post._id} className="group hover:bg-slate-50/50 transition-all duration-150">
                      <td className="px-6 md:px-10 py-4 md:py-6">
                        <div className="font-black text-sm md:text-base text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[200px] md:max-w-lg mb-1">{post.title || "Untyped Content"}</div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase text-slate-400">
                           <span className="flex items-center gap-1"><FaHistory /> {new Date(post.createdAt).toLocaleDateString()}</span>
                           <span className="flex items-center gap-1"><FaMapMarkerAlt /> Global</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 md:py-6">
                         <div className="flex items-center gap-2 md:gap-3">
                            <img src={post.userId?.profilePic || '/profile.jpg'} className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-cover" />
                            <div className="font-black text-[10px] md:text-xs text-slate-700 truncate max-w-[120px]">{post.userId?.name || "Terminated Node"}</div>
                         </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                        {/* 🚨 MOBILE FIX: Buttons always visible on touch screens */}
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedPost(post)} className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"><FaEye /> Deep Scan</button>
                          <button onClick={() => handlePostAction(post._id, "delete")} className="p-2 md:p-2.5 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition-all"><FaTrash size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SECTION: INCIDENT REPORTS --- */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 animate-fadeIn overflow-hidden">
            <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h3 className="text-xl md:text-2xl font-black text-slate-800">Conflict Log</h3>
               <div className="flex bg-slate-100 p-1 rounded-lg md:rounded-xl w-full sm:w-auto overflow-x-auto">
                  {['all', 'pending', 'handled'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setReportFilter(f)}
                      className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${reportFilter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 md:px-10 py-4 md:py-6">Target Node</th>
                    <th className="px-6 md:px-10 py-4 md:py-6">Source Node (Reporter)</th>
                    <th className="px-6 md:px-10 py-4 md:py-6">Violation Data</th>
                    <th className="px-6 md:px-10 py-4 md:py-6 text-right">Final Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.length === 0 ? (
                    <tr><td colSpan="4" className="p-16 md:p-32 text-center font-black text-slate-300 italic">No network conflicts detected.</td></tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r._id} className="hover:bg-red-50/20 transition-colors">
                        <td className="px-6 md:px-10 py-4 md:py-6">
                           <div className="font-black text-red-600 text-sm md:text-base truncate max-w-[120px]">{r.reportedUserId?.name || "Purged User"}</div>
                           <div className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[120px]">{r.reportedUserId?.email}</div>
                        </td>
                        <td className="px-6 md:px-10 py-4 md:py-6 font-bold text-slate-600 text-xs md:text-sm truncate max-w-[120px]">{r.reporterId?.name || "System Logic"}</td>
                        <td className="px-6 md:px-10 py-4 md:py-6">
                           <div className="text-[9px] md:text-[10px] font-black uppercase bg-red-50 text-red-700 px-2.5 md:px-3 py-1 rounded-md md:rounded-lg w-fit mb-1.5 md:mb-2">{r.reason}</div>
                           <p className="text-[10px] md:text-xs text-slate-400 italic max-w-[150px] md:max-w-xs line-clamp-1">"{r.description}"</p>
                        </td>
                        <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                           {r.status === 'pending' ? (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleReportAction(r._id, "action_taken")} className="px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-700 active:scale-95 transition-all whitespace-nowrap">Terminate</button>
                               <button onClick={() => handleReportAction(r._id, "dismissed")} className="px-3 md:px-5 py-2 md:py-2.5 bg-slate-200 text-slate-600 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all whitespace-nowrap">Dismiss</button>
                             </div>
                           ) : (
                             <span className={`text-[9px] md:text-[10px] font-black uppercase px-3 md:px-4 py-1 md:py-1.5 rounded-full whitespace-nowrap ${r.status === 'dismissed' ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700'}`}>
                               Handled: {r.status}
                             </span>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "tickets" && (
           <div className="animate-fadeIn w-full">
              <AdminTicketsManager />
           </div>
        )}
      </main>

      {/* 3. ADVANCED MODALS AREA */}
      
      {/* SECTION: Deep Scan - Content Inspection */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm md:backdrop-blur-md p-2 md:p-4 animate-fadeIn">
          {/* 🚨 MOBILE FIX: Adjusted max-height and width for mobile view */}
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 text-blue-700 rounded-md md:rounded-lg"><FaShieldAlt size={16}/></div>
                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm md:text-lg">Deep Scan</h3>
              </div>
              <button onClick={() => setSelectedPost(null)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl md:rounded-2xl text-slate-400 hover:text-red-500 transition shadow-sm font-bold">✕</button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 md:p-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-10 pb-6 md:pb-8 border-b border-slate-50">
                <img src={selectedPost.userId?.profilePic || '/profile.jpg'} className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-3xl object-cover border-2 md:border-4 border-white shadow-md md:shadow-xl" />
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-lg md:text-2xl leading-none mb-1 md:mb-2 truncate">{selectedPost.userId?.name || "Unknown"}</p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                     <span className="text-xs md:text-sm text-blue-600 font-bold truncate">{selectedPost.userId?.email}</span>
                     <span className="text-[9px] md:text-xs bg-slate-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full font-black uppercase text-slate-400 truncate">ID: {selectedPost.userId?._id?.substring(0,8)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">{selectedPost.title}</h2>
                <div className="bg-slate-50 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-lg">
                   {selectedPost.description}
                </div>
                
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="pt-4 md:pt-6">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 md:mb-4">Visual Assets</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      {selectedPost.images.map((img, idx) => (
                        <div key={idx} className="relative group overflow-hidden rounded-2xl md:rounded-3xl border-2 md:border-4 border-white shadow-lg">
                          <img src={img} alt="Evidence" className="object-cover w-full h-48 md:h-64 group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 md:from-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-end p-3 md:p-4">
                             <span className="text-white text-[9px] md:text-[10px] font-black uppercase">CID-0{idx+1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 md:p-8 border-t border-slate-50 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 md:gap-4 shrink-0">
              <button onClick={() => setSelectedPost(null)} className="w-full sm:w-auto px-6 py-3 md:py-4 font-black text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest text-[10px] md:text-xs bg-white sm:bg-transparent border border-slate-200 sm:border-transparent rounded-xl sm:rounded-none">Release</button>
              <button 
                onClick={() => handlePostAction(selectedPost._id, "delete")} 
                className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg md:shadow-2xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 active:translate-y-0 transition-all"
              >
                Execute Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Broadcast Console */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/80 md:bg-indigo-950/60 backdrop-blur-sm md:backdrop-blur-xl p-2 md:p-4 animate-fadeIn">
          {/* 🚨 MOBILE FIX: Adjusted padding and widths for small screens */}
          <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
            <div className="bg-indigo-600 p-6 md:p-10 flex justify-between items-start md:items-center text-white relative">
              <div className="relative z-10">
                <h3 className="font-black text-xl md:text-3xl uppercase tracking-tighter flex items-center gap-3"><FaBullhorn className="text-indigo-200 animate-bounce size-5 md:size-8" /> Broadcast</h3>
                <p className="text-indigo-100 mt-1 md:mt-2 font-bold text-[10px] md:text-sm opacity-80 uppercase tracking-widest">Protocol: Override</p>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="relative z-10 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl md:rounded-2xl text-white font-black text-lg md:text-2xl transition-all">✕</button>
              <div className="absolute top-[-20px] right-[-20px] md:top-[-50px] md:right-[-50px] w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full"></div>
            </div>
            
            <div className="p-5 md:p-12">
              <div className="bg-indigo-50 border-l-4 md:border-l-8 border-indigo-500 p-4 md:p-6 rounded-xl md:rounded-2xl mb-6 md:mb-10">
                 <p className="text-[10px] md:text-xs text-indigo-700 font-black uppercase mb-1 md:mb-2 tracking-widest">Transmission Policy:</p>
                 <p className="text-xs md:text-sm text-indigo-900 font-medium italic leading-relaxed">
                   This message will bypass all filters and appear on the feed of every synced user. Use with extreme discretion.
                 </p>
              </div>
              
              <textarea
                rows="5"
                className="w-full bg-slate-50 border-2 md:border-4 border-slate-100 rounded-2xl md:rounded-[2rem] p-4 md:p-8 focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-800 placeholder:text-slate-300 text-sm md:text-lg font-medium shadow-inner resize-none"
                placeholder="Enter official network announcement details here..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              ></textarea>
            </div>
            
            <div className="p-5 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 md:gap-6">
              <button onClick={() => setShowBroadcastModal(false)} className="w-full sm:w-auto py-3 font-black text-slate-400 hover:text-slate-700 transition-all uppercase tracking-widest text-xs border border-slate-200 rounded-xl sm:border-none sm:rounded-none bg-white sm:bg-transparent">Abort</button>
              <button 
                onClick={handleSendBroadcast} 
                disabled={isBroadcasting} 
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black shadow-lg md:shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] md:text-xs"
              >
                {isBroadcasting ? "Injecting..." : "Finalize Broadcast"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}