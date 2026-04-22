// src/app/components/ChatSupport.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiPaperclip, FiSend } from "react-icons/fi";
import axios from 'axios';
import { useSession } from "next-auth/react"; 
// 🚨 ADDED: Import useLanguage alongside useNotifications
import { useNotifications, useLanguage } from "@/app/dashboard/layout"; 

export default function ChatSupport({ senderId, receiverId, receiverName, receiverPic }) {
    // 🚨 ADDED: Initialize the translation function
    const { t } = useLanguage();

    const { data: session } = useSession(); 
    // 🚨 FIX: Translated the "You" fallback
    const senderName = session?.user?.name || t("you"); 
    
    // Grab the globalSocket from DashboardLayout
    const { globalSocket } = useNotifications(); 

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [mediaFile, setMediaFile] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // FETCH PAST MESSAGES
    useEffect(() => {
        const fetchMessages = async () => {
            if(senderId && receiverId) {
                try {
                    const { data } = await axios.get(`/api/messages?to=${receiverId}`);
                    setMessages(data || []);
                } catch (err) {
                    console.error("Failed to fetch messages:", err);
                }
            }
        };
        fetchMessages(); 
    }, [senderId, receiverId]);

    // Listen for incoming messages using the SHARED socket
    useEffect(() => {
        if (!globalSocket) return; // Wait until socket exists

        const handleReceiveMsg = (msg) => {
            if ((msg.senderId === receiverId && msg.receiverId === senderId) || 
                (msg.senderId === senderId && msg.receiverId === receiverId)) {
                setMessages((prev) => [...prev, msg]);
            }
        };

        globalSocket.on("receive_private_message", handleReceiveMsg);

        // Cleanup listener to prevent duplicate messages
        return () => {
            globalSocket.off("receive_private_message", handleReceiveMsg);
        };
    }, [globalSocket, senderId, receiverId]);

    const sendMessage = async () => {
        if (!input.trim() && !mediaFile) return;
        if (!senderId || !receiverId) return;

        const newMessage = {
            _id: new Date().toISOString(), 
            senderId: senderId,
            receiverId: receiverId,
            senderName: senderName, 
            content: input || "",
            media: mediaFile || null,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Emit the message using the SHARED socket
        if (globalSocket) {
            globalSocket.emit("send_private_message", newMessage); 
        }

        try {
            await axios.post("/api/messages", {
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
                content: newMessage.content,
                media: newMessage.media,
                senderName: newMessage.senderName, 
            });
        } catch (err) {
            console.error("Failed to save message:", err);
        }

        setInput("");
        setMediaFile(null);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // 🚨 FIX: Translated alert
        alert(t("fileUploadNotImplemented"));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-none flex items-center gap-4 p-4 bg-indigo-600 text-white shadow-md">
                {receiverPic ? (
                    <img src={receiverPic} alt={receiverName} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                ) : (
                    <FaUserCircle className="w-10 h-10 text-white" />
                )}
                {/* 🚨 FIX: Translated the fallback name */}
                <h2 className="text-lg font-semibold">{receiverName || t("selectAChat")}</h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                    const isSender = msg.senderId === senderId;
                    return (
                        <div key={msg._id || msg.createdAt} className={`flex items-start max-w-[70%] ${isSender ? "ml-auto justify-end" : "justify-start"}`}>
                            {!isSender && (
                                receiverPic ? (
                                    <img src={receiverPic} alt={msg.senderName} className="w-8 h-8 rounded-full mr-2 object-cover" />
                                ) : (
                                    <FaUserCircle className="w-8 h-8 text-gray-400 mr-2" />
                                )
                            )}
                            <div className={`p-3 rounded-2xl break-words shadow-sm ${isSender ? "bg-indigo-600 text-white" : "bg-white border border-gray-200"}`}>
                                {!isSender && (
                                    <strong className="block mb-1 text-sm text-gray-700">
                                        {msg.senderName || receiverName}
                                    </strong>
                                )}
                                {msg.content && <p>{msg.content}</p>}
                                {msg.media && (
                                    <div className="mt-2">
                                        {msg.media.endsWith(".mp4") || msg.media.endsWith(".mov") ? (
                                            <video controls className="max-w-xs rounded-lg"><source src={msg.media} type="video/mp4" /></video>
                                        ) : (
                                            <img src={msg.media} alt="media" className="max-w-xs rounded-lg" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-none flex items-center gap-2 p-4 bg-white border-t shadow-inner">
                <label className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
                    <FiPaperclip className="w-5 h-5 text-gray-600" />
                    <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    // 🚨 FIX: Translated placeholder
                    placeholder={t("typeAMessage")}
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition flex items-center justify-center"
                >
                    <FiSend className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}