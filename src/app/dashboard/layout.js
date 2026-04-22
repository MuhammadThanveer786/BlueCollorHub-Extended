"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
// 🚨 ADDED: FaBriefcase to the imports
import { FaBars, FaTimes, FaHome, FaHeart, FaComments, FaUser, FaPlus, FaSignOutAlt, FaBell, FaExclamationTriangle, FaBullhorn, FaShieldAlt, FaBriefcase, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import CategoriesDropdown from "../components/CategoriesDropdown";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "../components/SearchBar";
import categoriesWithSkills from "@/data/categoriesWithSkills";
import indiaStatesWithDistricts from "@/data/southStatesWithDistricts";
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';
import ChatbotWidget from "../components/ChatbotWidget";
import { FaHeadset } from "react-icons/fa";

import RecommendedWorkers from "../components/RecommendedWorkers";

// Import the dictionary
import { translations } from "@/utils/translations";

// Language Context
const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => { },
  t: (key) => key
});
export const useLanguage = () => useContext(LanguageContext);

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  globalSocket: null,
  fetchNotifications: async () => { },
  markAsRead: async () => { },
  handleAcceptRequest: async (senderId, notificationId) => { },
  handleDeclineRequest: async (senderId, notificationId) => { },
  clearUnreadSender: (senderId) => { },
});

export const useNotifications = () => useContext(NotificationContext);

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [showAllCategories, setShowAllCategories] = useState(false);


  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");

  // extract states list
  const states = Object.keys(indiaStatesWithDistricts);



  const dropdownRef = useRef(null);
  const notificationPanelRef = useRef(null);

  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin"; // 🛡️ ADDED: Check if user is an Admin
  const router = useRouter();
  const pathname = usePathname();
  const activeSection = pathname?.split("/")[2] || "posts";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadChatSenders, setUnreadChatSenders] = useState(new Set());
  const [globalSocket, setGlobalSocket] = useState(null);

  // Language State
  const [language, setLanguage] = useState('en');
  const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

  const categories = ["All Categories", ...Object.keys(categoriesWithSkills)];

  const sidebarItems = [
    { key: "posts", tKey: "posts", icon: <FaHome size={18} /> },
    { key: "wishlist", tKey: "wishlist", icon: <FaHeart size={18} /> },
    { key: "chat", tKey: "chat", icon: <FaComments size={18} /> },
    // 🚨 ADDED: Requests tab added here
    { key: "requests", tKey: "requests", icon: <FaBriefcase size={18} /> },
    { key: "profile", tKey: "profile", icon: <FaUser size={18} /> },
    { key: "support", tKey: "support", icon: <FaHeadset size={18} /> },
  ];

  const clearUnreadSender = (senderId) => {
    setUnreadChatSenders(prev => {
      const newSet = new Set(prev);
      newSet.delete(senderId);
      return newSet;
    });
  };

  const fetchNotifications = async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) return;
    try {
      const { data } = await axios.get('/api/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) { console.error(error); }
  };

  const addNotification = (newNotification) => {
    if (!newNotification || !newNotification._id) return;
    setNotifications(prev => {
      if (prev.some(n => n._id === newNotification._id)) return prev;
      return [newNotification, ...prev];
    });
    if (!newNotification.read) { setUnreadCount(prev => prev + 1); }

    const isSystem = newNotification.type === 'admin_warning' || newNotification.type === 'admin_info';
    const senderName = isSystem ? 'System Admin' : (newNotification.senderId?.name || 'Someone');
    toast.info(`${senderName} ${getNotificationMessage(newNotification)}`, { description: `Received just now` });
  };

  const getNotificationMessage = (notif) => {
    switch (notif?.type) {
      case 'like': return `liked your post.`;
      case 'comment': return `commented on your post.`;
      case 'rating': return `rated your post.`;
      case 'connect_request': return `sent you a follow request.`;
      case 'connect_accept': return `started following you.`;
      case 'admin_warning': return `issued an official warning.`;
      case 'admin_info': return `sent a platform announcement.`;
      default: return 'sent you a notification.';
    }
  };

  const markAsRead = async (idsToMark = []) => {
    if (!idsToMark || idsToMark.length === 0) return;
    const unreadIdsInList = idsToMark.filter(id => notifications.find(n => n._id === id && !n.read));
    if (unreadIdsInList.length === 0) return;
    setNotifications(prev => prev.map(n => unreadIdsInList.includes(n._id) ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - unreadIdsInList.length));
    try { await axios.post('/api/notifications/mark-read', { notificationIds: unreadIdsInList }); }
    catch (error) { console.error(error); }
  };

  const handleAcceptRequest = async (senderId, notificationId) => {
    if (!senderId) return;
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    const wasUnread = originalNotifications.find(n => n._id === notificationId && !n.read);
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const response = await axios.post(`/api/user/accept/${senderId}`);
      if (response.data.success) {
        toast.success(`Connection accepted!`);
        router.refresh();
      } else {
        toast.error(response.data.message || "Failed to accept connection.");
        setNotifications(originalNotifications);
        if (wasUnread) setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error(error.response?.data?.message || "Server error accepting connection.");
      setNotifications(originalNotifications);
      if (wasUnread) setUnreadCount(prev => prev + 1);
    }
  };

  const handleDeclineRequest = async (senderId, notificationId) => {
    if (!senderId) return;
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    const wasUnread = originalNotifications.find(n => n._id === notificationId && !n.read);
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const response = await axios.post(`/api/user/decline/${senderId}`);
      if (response.data.success) {
        toast.info("Follow request declined.");
        router.refresh();
      } else {
        toast.error(response.data.message || "Failed to decline request.");
        setNotifications(originalNotifications);
        if (wasUnread) setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error(error.response?.data?.message || "Server error declining request.");
      setNotifications(originalNotifications);
      if (wasUnread) setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowAllCategories(false);
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target) && !event.target.closest('[data-notification-bell]')) setShowNotificationPanel(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    let s;
    if (userId && sessionStatus === 'authenticated') {
      fetchNotifications();
      s = io({ path: '/api/socket' });
      setGlobalSocket(s);
      s.on('connect', () => { s.emit('register_user', userId); });
      s.on('new_notification', addNotification);
      s.on('receive_private_message', (message) => {
        if (message && message.senderId && !window.location.pathname.includes('/dashboard/chat')) {
          toast.info(`New message from ${message.senderName || 'Someone'}`);
          setUnreadChatSenders(prev => new Set(prev).add(message.senderId));
        }
      });
    } else if (sessionStatus !== 'loading') {
      if (s) s.disconnect();
      setGlobalSocket(null);
      setNotifications([]); setUnreadCount(0); setShowNotificationPanel(false);
      setUnreadChatSenders(new Set());
    }
    return () => { if (s) { s.disconnect(); } };
  }, [sessionStatus, session?.user?.id]);


useEffect(() => {
  const savedState = localStorage.getItem("userState");
  const savedDistrict = localStorage.getItem("userDistrict");

  if (savedState) setSelectedState(savedState);
  if (savedDistrict) setSelectedDistrict(savedDistrict);
}, []);


useEffect(() => {
  const savedLang = localStorage.getItem("appLanguage");
  if (savedLang) setLanguage(savedLang);
}, []);



  const handleCategorySearch = (category, skill = null) => {
    setActiveCategory(category);
    setShowAllCategories(false);

    const params = new URLSearchParams();

    if (category === "All Categories" || category === t("allCategories")) {
      router.push(`/dashboard/posts`);
    } else {
      params.set("category", category);
      if (skill) {
        params.set("skill", skill);
      }
      router.push(`/dashboard/posts?${params.toString()}`);
    }
  };

  const getNotificationLink = (notif) => {
    if (notif.type === 'admin_warning' || notif.type === 'admin_info') return '#';
    if (notif.postId?._id) return `/dashboard/post/${notif.postId._id}`;
    if (notif.type === 'connect_request' || notif.type === 'connect_accept') return `/dashboard/profile/${notif.senderId?._id}`;
    return '#';
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, handleAcceptRequest, handleDeclineRequest, clearUnreadSender, globalSocket }}>
        <div className="flex h-screen font-sans bg-gray-50 overflow-hidden">
          <aside className={`hidden md:flex flex-col bg-white text-black border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} flex-shrink-0 relative z-20`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
              <div className={`${sidebarOpen ? "text-black text-2xl font-bold tracking-wide" : "hidden"}`}>BlueCollorHub</div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-gray-100 transition">
                {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
            <nav className="flex-1 flex flex-col mt-4 gap-2 px-2 overflow-y-auto">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === 'chat') { setUnreadChatSenders(new Set()); }
                    if (item.key === 'posts') setActiveCategory("All Categories");
                    router.push(`/dashboard/${item.key}`);
                  }}
                  className={`flex items-center justify-between gap-3 w-full text-left px-4 py-3 rounded-md transition ${activeSection === item.key ? "bg-black text-white font-semibold" : "text-gray-700 hover:bg-gray-100 hover:text-black"}`}
                >
                  <div className="flex items-center gap-3">{item.icon} <span className={`${sidebarOpen ? "inline" : "hidden"} whitespace-nowrap`}>{t(item.tKey)}</span></div>
                  {item.key === 'chat' && unreadChatSenders.size > 0 && sidebarOpen && (
                    <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">{unreadChatSenders.size}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
              {/* 🛡️ ADDED: Admin Control Center Button */}
              {isAdmin && (
                <Link href="/admin" className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-semibold mb-2 ${sidebarOpen ? "" : "justify-center"}`} title="Admin Control Center">
                  <FaShieldAlt size={18} /> <span className={`${sidebarOpen ? "inline" : "hidden"} whitespace-nowrap`}>Admin Portal</span>
                </Link>
              )}

              <button onClick={() => signOut({ callbackUrl: "/" })} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition hover:bg-red-50 hover:text-red-600 ${sidebarOpen ? "text-black" : "text-gray-500 justify-center"}`} title="Logout">
                <FaSignOutAlt size={18} /> <span className={`${sidebarOpen ? "inline" : "hidden"} whitespace-nowrap`}>{t("logout")}</span>
              </button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden">






            {/* ================= MOBILE HEADER ================= */}
            {/* ================= MOBILE HEADER ================= */}
<div className="md:hidden fixed top-0 left-0 w-full bg-white z-[9999] shadow-sm">

  {/* 🔝 Row 1: Logo + Location + Language */}
  <div className="flex items-center gap-2 px-3 pt-3">

    {/* Logo */}
    <img src="/logo.png" className="h-10 w-auto flex-shrink-0" />

    {/* Location Box */}
    <div className="flex items-center gap-2 bg-white border border-black rounded-lg px-3 py-2 flex-1 min-w-0 h-12">

      <FaMapMarkerAlt className="text-black text-lg flex-shrink-0" />

      {/* STATE */}
      <select
        value={selectedState}
        onChange={(e) => {
          const state = e.target.value;
          setSelectedState(state);
          setSelectedDistrict("");

          localStorage.setItem("userState", state);
          localStorage.setItem("userDistrict", "");
        }}
        className="px-2 py-1 rounded-md border border-black text-sm flex-1 min-w-0"
      >
       <option value="">{t("selectState")}</option>

        {Object.keys(indiaStatesWithDistricts).map((state, index) => (
          <option key={index} value={state}>
            {state}
          </option>
        ))}
      </select>

      {/* DISTRICT */}
      <select
        value={selectedDistrict}
        onChange={(e) => {
          setSelectedDistrict(e.target.value);
          localStorage.setItem("userDistrict", e.target.value);
        }}
        disabled={!selectedState}
        className={`px-2 py-1 rounded-md border border-black text-sm flex-1 min-w-0 ${
          !selectedState ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <option value="">{t("selectDistrict")}</option>

        {selectedState &&
          indiaStatesWithDistricts[selectedState]?.map((district, index) => (
            <option key={index} value={district}>
              {district}
            </option>
          ))}
      </select>

    </div>

    {/* ✅ Language (INSIDE ROW) */}
    <select
  value={language}
  onChange={(e) => {
    setLanguage(e.target.value);
    localStorage.setItem("appLanguage", e.target.value);
  }}
  className="border border-black rounded-md px-2 text-sm h-12 flex-shrink-0"
>
  <option value="en">EN</option>
  <option value="hi">HI</option>
  <option value="te">TE</option>
</select>

  </div>

  {/* 🔽 Row 2: Search + Icons */}
  <div className="flex items-center gap-2 px-3 py-3">

    {/* Search Bar */}
    <div className="flex flex-1 border border-gray-400 rounded-md overflow-hidden">

   <input
  type="text"
  placeholder={t("searchPlaceholder")}
  value={mobileSearch}
  onChange={(e) => setMobileSearch(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams();

      if (mobileSearch) params.append("query", mobileSearch);
      if (selectedState) params.append("state", selectedState);
      if (selectedDistrict) params.append("district", selectedDistrict);

      router.push(`/dashboard/posts?${params.toString()}`);
    }
  }}
  className="flex-1 px-4 py-2 text-sm outline-none"
/>

     <button
  onClick={() => {
    const params = new URLSearchParams();

    if (mobileSearch) params.append("query", mobileSearch);
    if (selectedState) params.append("state", selectedState);
    if (selectedDistrict) params.append("district", selectedDistrict);

    router.push(`/dashboard/posts?${params.toString()}`);
  }}
  className="bg-black text-white px-4 flex items-center justify-center"
>
  <FaSearch />
</button>

    </div>

    {/* Icons */}
    <FaHeart
  onClick={() => router.push("/dashboard/wishlist")}
  className="text-xl flex-shrink-0 cursor-pointer"
/>
    <FaBell
  onClick={() => router.push("/dashboard/notifications")}
  className="text-xl flex-shrink-0 cursor-pointer"
/>

  </div>

</div>




          {/* ================= DESKTOP HEADER ================= */}

          <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white text-black shadow-sm flex-shrink-0 h-16 border-b">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`flex-shrink-0 ${sidebarOpen ? 'hidden' : 'inline-block'}`}>
                <img src="/logo.png" alt="BlueCollorHub Logo" className="h-18 w-auto object-contain md:hidden lg:inline" />
              </div>
              <div className="hidden md:block flex-1 min-w-[400px]">
                <SearchBar />
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <div className="relative" ref={notificationPanelRef}>
                <button onClick={() => { if (!showNotificationPanel && unreadCount > 0) { const unreadIds = notifications.filter(n => !n.read && n.type !== 'connect_request').map(n => n._id); if (unreadIds.length > 0) markAsRead(unreadIds); } setShowNotificationPanel(!showNotificationPanel); }} className="p-2 rounded-full hover:bg-gray-100 transition relative text-gray-600 hover:text-black" data-notification-bell>
                  <FaBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationPanel && (
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-center text-gray-800">{t("notificationsTitle")}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <p className="text-gray-500 text-center p-6 text-sm">{t("noNotifications")}</p>
                      ) : (
                        notifications.map(notif => {
                          const isAdminWarning = notif.type === 'admin_warning';
                          const isAdminInfo = notif.type === 'admin_info';
                          const isSystem = isAdminWarning || isAdminInfo;

                          return (
                            <div key={notif._id} className={`p-3 flex items-start gap-3 transition duration-150 ease-in-out ${!notif.read ? 'bg-blue-50' : ''}`}>
                              {isSystem ? (
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${isAdminWarning ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                  {isAdminWarning ? <FaExclamationTriangle size={14} /> : <FaBullhorn size={14} />}
                                </div>
                              ) : (
                                <Link href={`/dashboard/profile/${notif.senderId?._id}`} legacyBehavior>
                                  <a onClick={() => setShowNotificationPanel(false)}><img src={notif.senderId?.profilePic || '/profile.jpg'} alt={notif.senderId?.name || 'User'} className="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-1 bg-gray-200" /></a>
                                </Link>
                              )}
                              <div className="flex-1 text-sm">
                                <Link href={getNotificationLink(notif)} legacyBehavior>
                                  <a onClick={() => { setShowNotificationPanel(false); if (!notif.read && notif.type !== 'connect_request') markAsRead([notif._id]); }} className="hover:no-underline block">
                                    <span className={`font-semibold hover:underline ${isAdminWarning ? 'text-red-700' : isAdminInfo ? 'text-indigo-700' : 'text-gray-900'}`}>{isSystem ? 'System Admin' : (notif.senderId?.name || 'Someone')}</span>{' '}
                                    <span className={`${isAdminWarning ? 'text-red-600 font-medium' : isAdminInfo ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>{getNotificationMessage(notif)}</span>
                                  </a>
                                </Link>
                                {isSystem && notif.message && (
                                  <div className={`mt-1 p-2 border rounded text-xs italic ${isAdminWarning ? 'bg-red-50 border-red-100 text-red-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>"{notif.message}"</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                {notif.type === 'connect_request' && !notif.read && (
                                  <div className="mt-2 flex gap-2">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const targetId = notif.senderId?._id || notif.senderId; handleAcceptRequest(targetId, notif._id); }} className="px-3 py-1 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600 transition"> {t("acceptBtn")} </button>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const targetId = notif.senderId?._id || notif.senderId; handleDeclineRequest(targetId, notif._id); }} className="px-3 py-1 text-xs font-medium rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition"> {t("declineBtn")} </button>
                                  </div>
                                )}
                              </div>
                              {!notif.read && (<div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2 mr-1"></div>)}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-gray-200 text-center bg-gray-50">
                        <Link href="/dashboard/notifications" legacyBehavior>
                          <a onClick={() => setShowNotificationPanel(false)} className="text-sm text-blue-600 hover:underline font-medium">{t("viewAllNotifications")}</a>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="hidden md:block h-10 border border-gray-300 px-3 py-2 rounded-lg text-black flex-shrink-0 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white"
                aria-label="Select language"
              >
                <option value="en">EN</option>
                <option value="hi">HI - हिंदी</option>
                <option value="te">TE - తెలుగు</option>
              </select>

              <button onClick={() => router.push("/dashboard/createpost")} className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-black bg-black text-white text-sm flex-shrink-0 hover:bg-white hover:text-black transition duration-200" title="Create a new post">
                <FaPlus size={14} className="text-white group-hover:text-black transition" /> <span className="text-white group-hover:text-black transition font-medium">{t("create")}</span>
              </button>
              <Link href="/dashboard/profile">
                <div className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer flex-shrink-0 bg-gray-200 ring-1 ring-gray-300 hover:ring-black transition" title="View Profile">
                  {user?.image ? (<img src={user.image} alt="Profile" className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">{user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}</div>)}
                </div>
              </Link>
            </div>
          </header>

          <div className="flex gap-2 md:gap-3 p-3 bg-gray-100 border-b border-gray-200 px-6 relative flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => { setShowAllCategories((prev) => !prev); setActiveCategory("All Categories"); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeCategory === "All Categories" ? "bg-black text-white" : "bg-white text-black border border-gray-200 hover:bg-gray-100"}`}
                aria-haspopup="true"
                aria-expanded={showAllCategories}
              >
                {t("allCategories")} ▾
              </button>
              {showAllCategories && <CategoriesDropdown onSkillClick={handleCategorySearch} />}
            </div>
            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="flex gap-2 md:gap-3">
                {categories.filter((cat) => cat !== "All Categories").map((cat) => (
                  <button key={cat} onClick={() => handleCategorySearch(cat)} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${activeCategory === cat ? "bg-black text-white" : "bg-white text-black border border-gray-200 hover:bg-gray-100"}`}> {t(cat)} </button>
                ))}
              </div>
            </div>
            <style jsx>{` div::-webkit-scrollbar { display: none; } `}</style>
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 pt-24 pb-24 md:pt-6 md:pb-6">
            {children}
          </main>
        </div>


        {/* ================= MOBILE BOTTOM NAV ================= */}


        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t z-[9999]">

          <div className="flex justify-between items-center px-6 py-2 text-xs relative">

            {/* Home */}
            <Link href="/dashboard" className="flex flex-col items-center flex-1 text-blue-600">
              <FaHome className="text-xl mb-1" />
              <span>Home</span>
            </Link>

            {/* Chats */}
            <Link href="/dashboard/chat" className="flex flex-col items-center flex-1 text-gray-500">
              <FaComments className="text-xl mb-1" />
              <span>Chats</span>
            </Link>

            {/* EMPTY SPACE */}
            <div className="flex-1"></div>

            {/* Support */}
            <Link href="/dashboard/support" className="flex flex-col items-center flex-1 text-gray-500">
              <FaHeadset className="text-xl mb-1" />
              <span>Support</span>
            </Link>

            {/* Profile */}
            <Link href="/dashboard/profile" className="flex flex-col items-center flex-1 text-gray-500">
              <FaUser className="text-xl mb-1" />
              <span>Profile</span>
            </Link>

            {/* CENTER BUTTON */}
            <Link href="/dashboard/createpost" className="absolute inset-x-0 -top-6 flex flex-col items-center mx-auto w-fit">

              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 via-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <FaPlus className="text-blue-600 text-xl" />
                </div>
              </div>

            </Link>

          </div>
        </div>

        {/* 🚨 ADDED: Mobile Floating Action Buttons for Requests & Logout */}
        <div className="md:hidden fixed bottom-[90px] left-4 flex flex-col gap-3 z-[9999]">
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="w-10 h-10 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:scale-105 transition-transform"
              title="Admin Portal"
            >
              <FaShieldAlt size={16} />
            </button>
          )}
          <button
            onClick={() => router.push("/dashboard/requests")}
            className="w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:scale-105 transition-transform"
            title="Job Requests"
          >
            <FaBriefcase size={16} />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-10 h-10 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:scale-105 transition-transform"
            title="Logout"
          >
            <FaSignOutAlt size={16} />
          </button>
        </div>

        {/* Chatbot remains completely unchanged */}
        <div className="fixed bottom-[85px] md:bottom-6 right-4 md:right-6 z-[70]">
          <ChatbotWidget />
        </div>

      </div>
    </NotificationContext.Provider>
    </LanguageContext.Provider >
  );
}