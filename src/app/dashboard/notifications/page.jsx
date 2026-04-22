// src/app/dashboard/notifications/page.jsx
"use client";

import Link from "next/link";
import { useNotifications } from "@/app/dashboard/layout";
import { 
    FaHeart, FaComment, FaStar, FaUserPlus, 
    FaUserCheck, FaExclamationTriangle, FaBullhorn, FaCheckDouble,
    FaBell, // 🚨 ADDED: Fixed the crash!
    FaBriefcase, FaCheckCircle, FaTimesCircle // 🚨 ADDED: Icons for Job Bookings
} from "react-icons/fa";

export default function NotificationsPage() {
    // 🌟 We plug directly into your brilliant Context!
    const { 
        notifications, 
        markAsRead, 
        handleAcceptRequest, 
        handleDeclineRequest 
    } = useNotifications();

    // Filter out connect_requests because those require a manual Accept/Decline
    const unreadIds = notifications.filter(n => !n.read && n.type !== 'connect_request').map(n => n._id);

    const handleMarkAllAsRead = () => {
        if (unreadIds.length > 0) {
            markAsRead(unreadIds);
        }
    };

    // Helper to pick the right icon based on notification type
    const getIconInfo = (type) => {
        switch (type) {
            case 'like': return { icon: <FaHeart />, color: "text-pink-500", bg: "bg-pink-100" };
            case 'comment': return { icon: <FaComment />, color: "text-blue-500", bg: "bg-blue-100" };
            case 'rating': return { icon: <FaStar />, color: "text-yellow-500", bg: "bg-yellow-100" };
            case 'connect_request': return { icon: <FaUserPlus />, color: "text-green-500", bg: "bg-green-100" };
            case 'connect_accept': return { icon: <FaUserCheck />, color: "text-emerald-500", bg: "bg-emerald-100" };
            case 'admin_warning': return { icon: <FaExclamationTriangle />, color: "text-red-600", bg: "bg-red-100" };
            case 'admin_info': return { icon: <FaBullhorn />, color: "text-indigo-600", bg: "bg-indigo-100" };
            // 🚨 ADDED: Icons for the new booking system
            case 'job_request': return { icon: <FaBriefcase />, color: "text-purple-600", bg: "bg-purple-100" };
            case 'job_accepted': return { icon: <FaCheckCircle />, color: "text-emerald-600", bg: "bg-emerald-100" };
            case 'job_declined': return { icon: <FaTimesCircle />, color: "text-red-600", bg: "bg-red-100" };
            
            default: return { icon: <FaBell />, color: "text-gray-500", bg: "bg-gray-100" };
        }
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
            // 🚨 ADDED: Messages for the new booking system
            case 'job_request': return `sent you a new job request.`;
            case 'job_accepted': return `accepted your job request!`;
            case 'job_declined': return `declined your job request.`;
            
            default: return 'sent you a notification.';
        }
    };

    const getNotificationLink = (notif) => {
        if (notif.type === 'admin_warning' || notif.type === 'admin_info') return '#'; 
        if (notif.postId?._id) return `/dashboard/post/${notif.postId._id}`;
        if (notif.type === 'connect_request' || notif.type === 'connect_accept') return `/dashboard/profile/${notif.senderId?._id}`;
        
        // 🚨 ADDED: Routing for Job Notifications
        if (notif.type === 'job_request') return `/dashboard/requests`; // Send worker to requests page
        if (notif.type === 'job_accepted' || notif.type === 'job_declined') return `/dashboard/profile/${notif.senderId?._id}`; // Send customer to worker's profile
        
        return '#';
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Notifications Inbox</h1>
                        <p className="text-slate-300 text-sm mt-1">Stay updated on your connections and platform alerts.</p>
                    </div>
                    {unreadIds.length > 0 && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
                        >
                            <FaCheckDouble /> Mark all read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <img src="/logo.png" alt="No notifications" className="w-24 opacity-50 mb-4 grayscale" />
                            <p className="text-lg font-medium text-gray-700">You're all caught up!</p>
                            <p className="text-sm">When you receive likes, comments, or messages, they will appear here.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const isSystem = notif.type === 'admin_warning' || notif.type === 'admin_info';
                            const iconInfo = getIconInfo(notif.type);
                            const linkUrl = getNotificationLink(notif);
                            const senderId = notif.senderId?._id || notif.senderId; // Safety extraction

                            return (
                                <div 
                                    key={notif._id} 
                                    className={`p-5 transition duration-200 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/50' : 'bg-white'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        
                                        {/* Avatar / Icon Badge */}
                                        <div className="relative flex-shrink-0">
                                            {isSystem ? (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${iconInfo.bg} ${iconInfo.color}`}>
                                                    {iconInfo.icon}
                                                </div>
                                            ) : (
                                                <Link href={`/dashboard/profile/${senderId}`}>
                                                    <img 
                                                        src={notif.senderId?.profilePic || '/profile.jpg'} 
                                                        alt={notif.senderId?.name || 'User'} 
                                                        className="w-12 h-12 rounded-full object-cover border border-gray-200 cursor-pointer"
                                                    />
                                                </Link>
                                            )}
                                            
                                            {/* Tiny action badge in bottom right of avatar */}
                                            {!isSystem && (
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${iconInfo.bg.replace('100', '500')}`}>
                                                    {iconInfo.icon}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {isSystem ? (
                                                <div>
                                                    <span className={`font-bold ${notif.type === 'admin_warning' ? 'text-red-700' : 'text-indigo-700'}`}>
                                                        System Admin
                                                    </span>
                                                    <span className="text-gray-700 ml-1">
                                                        {getNotificationMessage(notif)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Link href={linkUrl} onClick={() => { if (!notif.read && notif.type !== 'connect_request') markAsRead([notif._id]); }}>
                                                    <span className="font-bold text-gray-900 hover:underline cursor-pointer">
                                                        {notif.senderId?.name || 'Someone'}
                                                    </span>
                                                    <span className="text-gray-700 ml-1 cursor-pointer">
                                                        {getNotificationMessage(notif)}
                                                    </span>
                                                </Link>
                                            )}

                                            {/* System Message Body OR Booking Title details */}
                                            {isSystem && notif.message && (
                                                <div className={`mt-2 p-3 rounded-lg text-sm italic ${notif.type === 'admin_warning' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>
                                                    "{notif.message}"
                                                </div>
                                            )}
                                            
                                            {/* 🚨 ADDED: Show Job Title if it is a booking notification */}
                                            {notif.bookingId?.title && (
                                                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 font-medium flex items-center gap-2">
                                                    <FaBriefcase className="text-gray-400" /> {notif.bookingId.title}
                                                </div>
                                            )}

                                            <div className="text-sm text-gray-500 mt-1">
                                                {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>

                                            {/* Action Buttons for Connect Requests */}
                                            {notif.type === 'connect_request' && !notif.read && (
                                                <div className="mt-3 flex gap-3">
                                                    <button 
                                                        onClick={() => handleAcceptRequest(senderId, notif._id)} 
                                                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
                                                    >
                                                        Accept Request
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeclineRequest(senderId, notif._id)} 
                                                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Unread Dot */}
                                        {!notif.read && (
                                            <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-2 shadow-sm"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}