"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from 'sonner';
import {
    FaHeart, FaRegHeart, FaComment, FaStar, FaPaperPlane,
    FaChevronLeft, FaChevronRight, FaTimes, FaUserPlus,
    FaCheck, FaHourglassHalf, FaUserCheck,
    FaBookmark, FaRegBookmark, FaChartBar,
    FaTrash, FaPencilAlt, 
    FaLanguage, FaSpinner, FaShieldAlt 
} from "react-icons/fa";
import Link from 'next/link';
import RatingBreakdown from "./RatingBreakdown";
import EditPostModal from "./EditPostModal";

// 🚨 Translation context
import { useLanguage } from "@/app/dashboard/layout"; 

export default function PostCard({ post, connectStatus, onConnect, onDisconnect, onDeleteSuccess }) {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    
    // 🛡️ ADMIN SECURITY CHECK
    const isAdmin = session?.user?.role === "admin";

    // 🚨 Grab translator
    const { t, language } = useLanguage(); 

    const [currentPost, setCurrentPost] = useState(post);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(currentPost.likes?.length || 0);
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState("collapsed");
    const [showRatings, setShowRatings] = useState(false);
    const [comments, setComments] = useState(currentPost.comments || []);
    const [feedbacks, setFeedbacks] = useState(currentPost.ratings || []); 
    const [newComment, setNewComment] = useState("");
    const [newRating, setNewRating] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [showOverallRatingModal, setShowOverallRatingModal] = useState(false);

    const [translatedTitle, setTranslatedTitle] = useState(null);
    const [translatedDesc, setTranslatedDesc] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const initialWorkerRatingData = currentPost.userId?.overallRating || { 
        averageScore: 0, 
        totalRatings: 0, 
        distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } 
    };
    const [liveWorkerOverallRating, setLiveWorkerOverallRating] = useState(initialWorkerRatingData);

    const [livePostAverageRating, setLivePostAverageRating] = useState(currentPost.averageRating || 0);
    const [livePostTotalRatings, setLivePostTotalRatings] = useState(currentPost.ratings?.length || 0);

    const currentUserRating = currentPost.ratings?.find(
        (r) => (r.userId?._id || r.userId) === currentUserId
    );
    const [userCurrentRating, setUserCurrentRating] = useState(
        currentUserRating?.value || 0
    ); 

    const commentsRef = useRef(null);
    const ratingsRef = useRef(null);

    const handleTranslate = async (e) => {
        e.preventDefault(); 
        e.stopPropagation();

        if (translatedTitle) {
            setTranslatedTitle(null);
            setTranslatedDesc(null);
            return;
        }

        setIsTranslating(true);
        try {
            const [titleRes, descRes] = await Promise.all([
                currentPost.title ? axios.post("/api/translate", { text: currentPost.title, targetLang: language }) : Promise.resolve({ data: { translatedText: "" } }),
                currentPost.description ? axios.post("/api/translate", { text: currentPost.description, targetLang: language }) : Promise.resolve({ data: { translatedText: "" } })
            ]);

            setTranslatedTitle(titleRes.data.translatedText);
            setTranslatedDesc(descRes.data.translatedText);
        } catch (error) {
            console.error("Translation failed:", error);
            // 🚨 Using general error translation
            toast.error(t("generalError"));
        }
        setIsTranslating(false);
    };

    const handleDelete = async () => {
        // 🚨 Translation applied
        if (!window.confirm(t("confirmDelete"))) {
            return;
        }
        try {
            await axios.delete(`/api/post/${currentPost._id}`);
            // 🚨 Translation applied
            toast.success(t("postDeleted"));
            if (onDeleteSuccess) {
                onDeleteSuccess(currentPost._id);
            }
        } catch (err) {
            // 🚨 Translation applied
            toast.error(err.response?.data?.message || t("deleteFail"));
        }
    };

    const handleUpdateSuccess = (updatedPost) => {
        setCurrentPost(updatedPost); 
        setIsEditModalOpen(false);
    };
    
    useEffect(() => {
        if (session && currentPost.likes && Array.isArray(currentPost.likes)) {
            const userLiked = currentPost.likes.some(
                (like) => (typeof like === 'string' && like === currentUserId) || (like?._id === currentUserId)
            );
            setLiked(userLiked);
            setLikesCount(currentPost.likes.length);
        }
    }, [session, currentPost.likes, currentUserId]);

    useEffect(() => {
        if (session && currentPost.savedBy && Array.isArray(currentPost.savedBy)) {
            const userSaved = currentPost.savedBy.some(
                (id) => id === currentUserId || id?._id === currentUserId
            );
            setIsSaved(userSaved);
        }
    }, [session, currentPost.savedBy, currentUserId]);

    const handleLike = async () => {
        // 🛡️ ADMIN CHECK
        if (isAdmin) return; 

        // 🚨 Translation applied
        if (!currentUserId) return toast.error(t("loginToLike"));
        const prevLiked = liked;
        const newLikesCount = prevLiked ? likesCount - 1 : likesCount + 1;
        setLiked(!prevLiked);
        setLikesCount(newLikesCount);
        try {
            const { data } = await axios.post(`/api/post/${currentPost._id}/like`);
            if (data.success) {
                setLikesCount(data.likesCount);
                setLiked(data.liked);
            } else {
                // 🚨 Translation applied
                toast.error(t("likeUpdateFail"));
                setLiked(prevLiked);
                setLikesCount(prevLiked ? newLikesCount + 1 : newLikesCount - 1);
            }
        } catch (err) {
            // 🚨 Translation applied
            toast.error(t("likeError"));
            console.error("Error toggling like:", err);
            setLiked(prevLiked);
            setLikesCount(prevLiked ? newLikesCount + 1 : newLikesCount - 1);
        }
    };
    
    const handleSavePost = async () => {
        // 🛡️ ADMIN CHECK
        if (isAdmin) return; 

        // 🚨 Translation applied
        if (!currentUserId) return toast.error(t("loginToSave"));
        
        const prevSaved = isSaved;
        setIsSaved(!prevSaved);

        try {
            const { data } = await axios.post(`/api/post/${currentPost._id}/save`);
            if (data.success) {
                setIsSaved(data.saved);
                // 🚨 Translation applied
                toast.success(data.saved ? t("postSaved") : t("postRemoved"));
            } else {
                setIsSaved(prevSaved);
                // 🚨 Translation applied
                toast.error(t("wishlistUpdateFail"));
            }
        } catch (err) {
            setIsSaved(prevSaved);
            console.error("Error saving post:", err);
            // 🚨 Translation applied
            toast.error(t("wishlistError"));
        }
    };

    const handleAddComment = async () => {
        // 🛡️ ADMIN CHECK
        if (isAdmin) return;

        // 🚨 Translation applied
        if (!newComment.trim()) return toast.warn(t("emptyComment"));
        if (!currentUserId) return toast.error(t("loginToComment"));
        try {
            const payload = { comment: newComment };
            const { data } = await axios.post(`/api/post/${currentPost._id}/comment`, payload);
            if (data.success && data.comment) {
                const addedComment = {
                    ...data.comment,
                    userId: {
                        _id: currentUserId,
                        // 🚨 Translation applied
                        name: session?.user?.name || t("you"),
                        profilePic: session?.user?.image || "/profile.jpg",
                    },
                    // 🚨 Translation applied
                    name: session?.user?.name || t("you"),
                    avatar: session?.user?.image || "/profile.jpg",
                };
                setComments(prev => [addedComment, ...prev]);
                setNewComment("");
                setShowComments("expanded");
                // 🚨 Translation applied
                toast.success(t("commentAdded"));
            } else {
                // 🚨 Translation applied
                toast.error(data.message || t("commentAddFail"));
            }
        } catch (err) {
            console.error("Error adding comment:", err);
            // 🚨 Translation applied
            toast.error(err.response?.data?.message || t("commentError"));
        }
    };

    const handleAddFeedback = async () => {
        // 🛡️ ADMIN CHECK
        if (isAdmin) return;

        // 🚨 Translation applied
        if (newRating === 0) return toast.warn(t("selectRating"));
        if (!currentUserId) return toast.error(t("loginToRate"));

        const ratingObj = { value: newRating, feedback: "" }; 

        try {
            const { data } = await axios.post(`/api/post/${currentPost._id}/rating`, ratingObj);
            
            if (data.success) {
                setUserCurrentRating(newRating);
                setNewRating(0);
                setShowRatings(false);

                // 🚨 Translation applied
                toast.success(userCurrentRating > 0 ? t("ratingUpdated") : t("ratingSubmitted"));
                
                if ('newPostAverageRating' in data) {
                    setLivePostAverageRating(data.newPostAverageRating ?? 0);
                }
                
                if ('newPostTotalRatings' in data) {
                    setLivePostTotalRatings(data.newPostTotalRatings ?? 0);
                } else if (userCurrentRating === 0) {
                    setLivePostTotalRatings(prev => prev + 1);
                }
                
                if (data.newOverallRating) {
                    setLiveWorkerOverallRating(data.newOverallRating);
                }
                
            } else {
                // 🚨 Translation applied
                toast.error(data.message || t("ratingSubmitFail"));
            }
        } catch (err) {
            console.error("Error adding rating:", err);
            // 🚨 Translation applied
            toast.error(err.response?.data?.message || t("ratingError"));
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (commentsRef.current && !commentsRef.current.contains(e.target) && !e.target.closest('[data-comment-toggle]')) {
                setShowComments("collapsed");
            }
            if (ratingsRef.current && !ratingsRef.current.contains(e.target) && !e.target.closest('[data-rating-toggle]')) {
                setShowRatings(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOverallRatingModal]);

    const openModal = (index) => {
        setModalImageIndex(index);
        setShowModal(true);
    };
    const prevImage = (e) => { e.stopPropagation(); setModalImageIndex((prev) => (prev === 0 ? (currentPost.images?.length || 1) - 1 : prev - 1)); };
    const nextImage = (e) => { e.stopPropagation(); setModalImageIndex((prev) => (prev === (currentPost.images?.length || 1) - 1 ? 0 : prev + 1)); };
    const closeModal = (e) => { e.stopPropagation(); setShowModal(false); };

    const displayTitle = translatedTitle || currentPost.title;
    const displayDesc = translatedDesc || currentPost.description;

    return (
        <div className="max-w-2xl mx-auto my-6 border border-gray-200 shadow-md bg-white rounded-lg overflow-hidden relative">
            
            {/* 🛡️ ADMIN MODE TAG OVERLAY */}
            {isAdmin && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-lg z-20 flex items-center gap-1.5 shadow-md">
                    <FaShieldAlt size={10}/> ADMIN MODE
                </div>
            )}

            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Link 
                    href={`/dashboard/profile/${currentPost.userId?._id}`} 
                    className="flex items-center gap-3 group min-w-0"
                >
                    <img src={currentPost.userId?.profilePic || "/profile.jpg"} alt="User Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0" />
                    <div className="min-w-0">
                        {/* 🚨 Translation applied */}
                        <p className="font-semibold group-hover:underline truncate text-sm">{currentPost.userId?.name || t("userFallback")}</p>
                        <p className="text-gray-500 text-xs truncate">{currentPost.userId?.title || ""}</p>
                        
                        {liveWorkerOverallRating.totalRatings > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <FaStar size={10} className="text-yellow-500" />
                                <span className="text-xs font-medium text-gray-700">
                                    {liveWorkerOverallRating.averageScore.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {/* 🚨 Translation applied */}
                                    ({liveWorkerOverallRating.totalRatings} {t("ratingsCount")})
                                </span>
                                <button 
                                    onClick={(e) => { e.preventDefault(); setShowOverallRatingModal(true); }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 transition"
                                    aria-label="View overall worker rating breakdown"
                                >
                                    <FaChartBar size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </Link>
                
                {/* 🛡️ MODERATION: Only Owners Edit. Owners AND Admins Delete. */}
                {session && (currentUserId === currentPost.userId?._id || isAdmin) ? (
                    <div className="flex items-center gap-4">
                        {currentUserId === currentPost.userId?._id && (
                            <button 
                                onClick={() => setIsEditModalOpen(true)} 
                                className="text-gray-500 hover:text-blue-600 transition"
                                aria-label="Edit post"
                            >
                                <FaPencilAlt />
                            </button>
                        )}
                        <button 
                            onClick={handleDelete} 
                            className={`transition ${isAdmin ? "text-red-500 hover:text-red-700 scale-110" : "text-gray-500 hover:text-red-600"}`}
                            aria-label="Delete post"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ) : (
                    session && currentUserId !== currentPost.userId?._id && !isAdmin && (
                        <>
                            {connectStatus === 'following' ? (
                                <button
                                    onClick={onDisconnect}
                                    className="px-4 py-1 text-sm text-blue-700 font-semibold border border-blue-300 rounded-md bg-blue-50 flex items-center transition"
                                >
                                    {/* 🚨 Translation applied */}
                                    <FaUserCheck className="mr-1" size={14}/> {t("following")}
                                </button>
                            ) : connectStatus === 'pending' || connectStatus === 'loading' ? (
                                <button
                                    disabled={true}
                                    className="px-4 py-1 text-sm text-gray-600 font-semibold border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed flex items-center"
                                >
                                    {/* 🚨 Translation applied */}
                                    <FaHourglassHalf className="mr-1" size={14} /> {t("requestSent")}
                                </button>
                            ) : (
                                <button
                                    onClick={onConnect}
                                    className="px-4 py-1 text-sm text-black font-semibold border border-black rounded-md hover:bg-black hover:text-white transition flex items-center"
                                >
                                    {/* 🚨 Translation applied */}
                                    <FaUserPlus className="mr-1" size={14}/> {t("follow")}
                                </button>
                            )}
                        </>
                    )
                )}
            </div>

            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-base mb-1">{displayTitle}</h3>
                <p className={`text-gray-700 text-sm ${!showFullDesc ? "line-clamp-3" : ""}`}>{displayDesc}</p>
                
                {displayDesc && displayDesc.length > 150 && (
                    <button
                        className="text-blue-600 hover:underline mt-1 text-xs font-semibold"
                        onClick={() => setShowFullDesc(!showFullDesc)}
                    >
                        {/* 🚨 Translation applied */}
                        {showFullDesc ? t("showLess") : t("showMore")}
                    </button>
                )}

                {language !== 'en' && (
                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:text-indigo-800 transition mt-3 w-fit bg-indigo-50 px-2.5 py-1 rounded-md"
                    >
                        {isTranslating ? (
                            <><FaSpinner className="animate-spin" /> {t("translating")}</>
                        ) : translatedTitle ? (
                            <><FaLanguage size={16} /> {t("showOriginal")}</>
                        ) : (
                            <><FaLanguage size={16} /> {t("seeTranslation")}</>
                        )}
                    </button>
                )}
            </div>

            {(currentPost.images && currentPost.images.length > 0) || currentPost.video ? (
                <div className="relative w-full bg-gray-100">
                    {currentPost.images && currentPost.images.length > 0 && (
                        <div className="relative aspect-video" onClick={() => openModal(currentImage)}>
                            {imageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
                            <img
                                src={currentPost.images[currentImage]}
                                alt="Post Media"
                                className={`w-full h-full object-cover cursor-pointer ${imageLoading ? "invisible" : "visible"}`}
                                onLoad={() => setImageLoading(false)}
                                onError={() => { setImageLoading(false); console.error("Failed to load image"); }}
                            />
                            {currentPost.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {e.stopPropagation(); setCurrentImage((prev) => (prev === 0 ? currentPost.images.length - 1 : prev - 1));}}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-60 transition z-10"
                                        aria-label="Previous image"
                                    >
                                        <FaChevronLeft size={16}/>
                                    </button>
                                    <button
                                        onClick={(e) => {e.stopPropagation(); setCurrentImage((prev) => (prev === currentPost.images.length - 1 ? 0 : prev + 1));}}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-60 transition z-10"
                                        aria-label="Next image"
                                    >
                                        <FaChevronRight size={16}/>
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                                        {currentPost.images.map((_, idx) => (
                                            <span key={idx} className={`block w-1.5 h-1.5 rounded-full ${idx === currentImage ? "bg-white" : "bg-gray-300 bg-opacity-70"}`}></span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {currentPost.video && (!currentPost.images || currentPost.images.length === 0) && (
                        <div className="aspect-video">
                            <video src={currentPost.video} controls className="w-full h-full bg-black" preload="metadata" />
                        </div>
                    )}
                </div>
            ) : null }

            {/* 🛡️ INTERACTION BAR (Disabled Styling for Admins) */}
            <div className={`flex justify-between items-center px-4 py-3 border-t border-gray-200 ${isAdmin ? "bg-gray-50/50" : ""}`}>
                <div className="flex gap-5 items-center">
                    <button 
                        disabled={isAdmin}
                        className={`flex flex-col items-center transition group ${isAdmin ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer text-gray-600 hover:text-red-500"}`} 
                        onClick={handleLike} 
                        aria-label={liked ? 'Unlike post' : 'Like post'}
                        title={isAdmin ? "Admins cannot like" : t("like")}
                    >
                        {liked ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl group-hover:text-red-500" />}
                        <span className="text-xs mt-1">{likesCount}</span>
                    </button>
                    
                    <button 
                        className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-blue-600 transition group" 
                        onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")} 
                        data-comment-toggle
                    >
                        <FaComment className="text-xl group-hover:text-blue-600" />
                        <span className="text-xs mt-1">{comments?.length || 0}</span>
                    </button>
                    
                    <button 
                        disabled={isAdmin}
                        className={`flex flex-col items-center transition group ${isAdmin ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer text-gray-600 hover:text-blue-600"}`} 
                        onClick={handleSavePost} 
                        aria-label={isSaved ? 'Unsave post' : 'Save post'}
                        title={isAdmin ? "Admins cannot save" : t("save")}
                    >
                        {isSaved ? <FaBookmark className="text-blue-600 text-xl" /> : <FaRegBookmark className="text-xl group-hover:text-blue-600" />}
                        {/* 🚨 Translation applied */}
                        <span className="text-xs mt-1">{t("save")}</span>
                    </button>
                </div>
                
                <button 
                    disabled={isAdmin}
                    className={`flex flex-col items-center transition group ${isAdmin ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer text-gray-600 hover:text-yellow-500"}`} 
                    onClick={() => { 
                        setShowRatings(!showRatings); 
                        setNewRating(userCurrentRating);
                    }} 
                    data-rating-toggle
                >
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar 
                                key={i} 
                                size={14} 
                                className={i < Math.round(livePostAverageRating || 0) ? "text-yellow-400" : "text-gray-300"} 
                            />
                        ))}
                    </div>
                    <span className="text-xs mt-1">{(livePostAverageRating || 0).toFixed(1)} ({livePostTotalRatings || 0})</span>
                </button>
            </div>

            {showComments !== "collapsed" && (
                <div ref={commentsRef} className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex gap-2 mb-4">
                        <img src={session?.user?.image || "/profile.jpg"} alt="Your Avatar" className="w-8 h-8 rounded-full object-cover bg-gray-200"/>
                        <input
                            type="text"
                            disabled={isAdmin}
                            // 🚨 Translation applied
                            placeholder={isAdmin ? "Admins restricted from commenting" : t("addCommentPlaceholder")}
                            className={`flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black ${isAdmin ? "bg-gray-100 italic cursor-not-allowed text-gray-500" : ""}`}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className={`px-3 py-1 rounded-full transition flex items-center justify-center ${isAdmin ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"}`}
                            aria-label="Send comment"
                            disabled={!newComment.trim() || isAdmin}
                        >
                            <FaPaperPlane size={14}/>
                        </button>
                    </div>

                    <div className={`space-y-3 ${showComments === "expanded" ? "max-h-64 overflow-auto pr-2" : ""}`}>
                        {(comments && comments.length > 0) ? (
                            (showComments === "expanded" ? comments : comments.slice(0, 2)).map((c, idx) => {
                                const user = c.userId || {};
                                const commentId = c._id || `comment-${idx}`;
                                // 🚨 Translation applied
                                const userName = user.name || c.name || t("userFallback");
                                const userPic = user.profilePic || c.avatar || "/profile.jpg";

                                return (
                                    <div key={commentId} className="flex items-start gap-2">
                                        <Link href={`/dashboard/profile/${user._id || c.userId}`}>
                                            <img src={userPic} alt={userName} className="w-7 h-7 rounded-full object-cover bg-gray-200 flex-shrink-0 mt-1"/>
                                        </Link>
                                        <div className="bg-gray-100 p-2 rounded-lg w-full text-sm">
                                            <Link href={`/dashboard/profile/${user._id || c.userId}`} className="font-semibold text-xs hover:underline">
                                                {userName}
                                            </Link>
                                            <p className="text-gray-800 break-words">{c.text || c.comment || ""}</p>
                                        </div>
                                    </div>
                                );
                            })
                        // 🚨 Translation applied
                        ) : <p className="text-xs text-gray-500 text-center">{t("noCommentsYet")}</p>}
                    </div>

                    {comments && comments.length > 2 && (
                        <button
                            onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")}
                            className="text-blue-600 text-xs font-semibold hover:underline mt-2"
                        >
                            {/* 🚨 Translation applied */}
                            {showComments === "expanded" ? t("hideComments") : `${t("viewAll")} ${comments.length} ${t("commentsWord")}`}
                        </button>
                    )}
                </div>
            )}

            {showRatings && !isAdmin && (
            <div ref={ratingsRef} className="border-t border-gray-200 p-4 bg-gray-50">
                <h4 className="text-sm font-semibold mb-3">
                    {/* 🚨 Translation applied */}
                    {userCurrentRating > 0 ? t("updateYourRating") : t("submitYourRating")}
                </h4>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        {/* 🚨 Translation applied */}
                        <span className="text-sm">{t("yourRating")}</span>
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar
                                key={i}
                                className={`text-xl cursor-pointer transition-colors ${i < (newRating || userCurrentRating) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                                onClick={() => setNewRating(i + 1)}
                            />
                        ))}
                    </div>
                    <button
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition self-start text-sm font-medium disabled:opacity-50"
                        onClick={handleAddFeedback}
                        disabled={newRating === 0 && userCurrentRating === 0} 
                    >
                        {/* 🚨 Translation applied */}
                        {userCurrentRating > 0 ? t("updateRatingBtn") : t("submitRatingBtn")}
                    </button>
                </div>
            </div>
            )}

            {showOverallRatingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm" onClick={() => setShowOverallRatingModal(false)}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl rating-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            {/* 🚨 Translation applied */}
                            <h3 className="text-xl font-bold">{t("overallWorkerRating")}</h3>
                            <button className="text-gray-500 hover:text-gray-800 transition" onClick={() => setShowOverallRatingModal(false)} aria-label="Close modal">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        
                        <RatingBreakdown 
                            averageRating={liveWorkerOverallRating.averageScore}
                            totalRatings={liveWorkerOverallRating.totalRatings}
                            ratingDistribution={liveWorkerOverallRating.distribution}
                            totalReviews={liveWorkerOverallRating.totalRatings}
                        />

                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={closeModal}>
                    <button className="absolute top-4 right-4 text-white text-3xl hover:opacity-75 transition" onClick={closeModal} aria-label="Close image modal">
                        <FaTimes />
                    </button>
                    <button className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:opacity-75 transition hidden sm:block" onClick={prevImage} aria-label="Previous image">
                        <FaChevronLeft />
                    </button>
                    <img
                        src={currentPost.images?.[modalImageIndex]}
                        alt={`Image ${modalImageIndex + 1} of ${currentPost.images?.length}`}
                        className="max-h-[85vh] max-w-[90vw] object-contain block"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:opacity-75 transition hidden sm:block" onClick={nextImage} aria-label="Next image">
                        <FaChevronRight />
                    </button>
                    {currentPost.images && currentPost.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                            {modalImageIndex + 1} / {currentPost.images.length}
                        </div>
                    )}
                </div>
            )}

            <EditPostModal
                isOpen={isEditModalOpen}
                post={currentPost}
                onClose={() => setIsEditModalOpen(false)}
                onUpdateSuccess={handleUpdateSuccess}
            />
        </div>
    );
}