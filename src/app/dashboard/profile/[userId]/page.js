"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { 
    FaMapPin, FaPhone, FaBriefcase, FaUserPlus, 
    FaUserCheck, FaComments, FaStar, FaHourglassHalf,
    FaCalendarAlt // 🚨 ADDED: Calendar icon for the new button
} from "react-icons/fa";
import { toast } from "sonner";
import ProfileMap from '@/app/components/ProfileMap';
import PostCard from '@/app/components/PostCard'; 
import RatingBreakdown from '@/app/components/RatingBreakdown';

// 🚨 ADDED: Import the new Report User Button
import ReportUserButton from '@/app/components/ReportUserButton'; 

// 🚨 ADDED: Import the Booking Modal
import BookingModal from '@/app/components/BookingModal';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
    </div>
);

export default function UserProfilePage() {
    const params = useParams();
    const { data: session } = useSession(); 
    const userId = params.userId; 

    const [user, setUser] = useState(null); 
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connectStatus, setConnectStatus] = useState('idle'); 

    // 🚨 ADDED: State to control Booking Modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const isOwner = session?.user?.id === userId;
    const isValid = (value) => value !== null && value !== undefined && value !== "";

    useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            setLoading(true);
            setError(null);
            try {
                const userRes = await axios.get(`/api/user/${userId}`);
                setUser(userRes.data); 

                const postsRes = await axios.get(`/api/user/${userId}/posts`);
                setPosts(postsRes.data || []); 
                
                if (!session || !session.user) {
                    setConnectStatus('idle');
                } else if (session.user.id === userId) {
                    setConnectStatus('self');
                } else if (session.user.following && Array.isArray(session.user.following) && session.user.following.includes(userId)) {
                    setConnectStatus('following');
                } else if (session.user.connectionRequestsSent && Array.isArray(session.user.connectionRequestsSent) && session.user.connectionRequestsSent.includes(userId)) {
                    setConnectStatus('pending');
                } else {
                    setConnectStatus('idle');
                }
            } catch (err) {
                console.error("Failed to fetch user data", err);
                setError("Could not load profile. This user may not exist.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, session]); 

    const handleConnect = async () => {
        if (connectStatus !== 'idle' || !session?.user?.id) return;
        if (session.user.id === userId) return;

        setConnectStatus('loading');
        try {
            const response = await axios.post(`/api/user/${userId}/connect`);
            if (response.data.success) {
                toast.success("Follow request sent!");
                setConnectStatus('pending');
            } else {
                toast.error(response.data.message || "Failed to send request.");
                setConnectStatus('idle');
            }
        } catch (error) {
            console.error("Connection error:", error);
            toast.error(error.response?.data?.message || "An error occurred.");
            setConnectStatus('idle');
        }
    };

    const handleDisconnect = async () => {
        if (connectStatus !== 'following' || !session?.user?.id) return;

        const oldStatus = connectStatus;
        setConnectStatus('idle');
        toast.info(`You are no longer following ${user.name}`);

        try {
            const response = await axios.post(`/api/user/unfollow/${userId}`);
            if (response.data.success) {
                setUser(prev => ({ 
                    ...prev, 
                    followerCount: Math.max(0, (prev.followerCount || 0) - 1),
                    followers: (prev.followers || []).filter(id => id !== session.user.id) 
                }));
            } else {
                setConnectStatus(oldStatus);
                toast.error(response.data.message || "Failed to unfollow.");
            }
        } catch (err) {
            setConnectStatus(oldStatus);
            toast.error(err.response?.data?.message || "Failed to unfollow user");
        }
    };

    const handlePostDeleted = (deletedPostId) => {
        setPosts(currentPosts =>
            currentPosts.filter(post => post._id !== deletedPostId)
        );
        toast.success("Post removed from your profile.");
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
    if (!user) return <div className="text-center p-4">User not found.</div>;

    const locationString = (isValid(user.location?.town) || isValid(user.location?.district) || isValid(user.location?.state))
        ? [user.location.town, user.location.district, user.location.state].filter(Boolean).join(", ")
        : null; 

    // 🚨 ADDED: Wrapped the entire return inside empty fragment <> ... </> to allow rendering the modal alongside the main div
    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-6 h-full overflow-hidden">
                <div className="w-full md:w-2/3 flex flex-col h-full overflow-y-scroll pr-4">
                    <h2 className="text-2xl font-bold mb-4 flex-shrink-0">
                        Projects by {user.name}
                    </h2>
                    {posts.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow">
                            {posts.map((post) => (
                                <PostCard 
                                    key={post._id} 
                                    post={post} 
                                    connectStatus={connectStatus}
                                    onConnect={handleConnect}
                                    onDisconnect={handleDisconnect}
                                    onDeleteSuccess={handlePostDeleted}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-500 flex-grow">
                            <p>{user.name} hasn't posted any projects yet.</p>
                        </div>
                    )}
                </div>

                <aside className="w-full md:w-1/3 flex flex-col h-full overflow-y-scroll pl-4">
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        
                        <div className="h-32 bg-gray-700">
                            <img 
                                src={isValid(user.coverImage) ? user.coverImage : "/cover.jpg"} 
                                alt="Cover" 
                                className="w-full h-full object-cover" 
                            />
                        </div>

                        <div className="flex flex-col items-center -mt-16 p-4">
                            <img
                                src={isValid(user.profilePic) ? user.profilePic : "/profile.jpg"}
                                alt={user.name}
                                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200"
                            />
                            
                            {/* 🚨 ADDED: The Verified Badge is now right next to the name! */}
                            <h1 className="text-2xl font-bold mt-2 flex items-center justify-center">
                                {isValid(user.name) ? user.name : "User Name"}
                                {user.isVerified && (
                                    <span title="Verified by Admin" className="text-blue-500 text-xl ml-2 cursor-help">
                                        ☑️
                                    </span>
                                )}
                            </h1>
                            
                            <p className="text-gray-600 text-sm text-center mt-1">
                                {isValid(user.title) ? user.title : "No bio provided."}
                            </p>
                        </div>

                        <div className="px-4 pb-4">
                            {!isOwner ? (
                                // 🚨 ADDED: Wrapped existing buttons in a flex-col div to stack the new Request Service button underneath
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        {connectStatus === 'following' ? (
                                            <button
                                                onClick={handleDisconnect}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm font-medium hover:bg-gray-50 transition"
                                            >
                                                <FaUserCheck /> Following
                                            </button>
                                        ) : connectStatus === 'pending' || connectStatus === 'loading' ? (
                                            <button
                                                disabled={true}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"
                                            >
                                                <FaHourglassHalf /> Request Sent
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleConnect}
                                                disabled={connectStatus === 'loading'}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-black bg-black text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                            >
                                                <FaUserPlus /> Follow
                                            </button>
                                        )}

                                        <Link 
                                            href={`/dashboard/chat?userId=${userId}`}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                                        >
                                            <FaComments /> Message
                                        </Link>
                                    </div>
                                    
                                    {/* 🚨 ADDED: Request Service Button to trigger modal */}
                                    <button 
                                        onClick={() => setIsBookingModalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                                    >
                                        <FaCalendarAlt /> Request Service
                                    </button>
                                </div>
                            ) : (
                                <Link 
                                    href="/dashboard/profile" 
                                    className="w-full block text-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-black text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    Edit Your Profile
                                </Link>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <ul className="space-y-3 text-sm text-gray-800">
                                <li className="flex items-center gap-3">
                                    <FaBriefcase className="text-gray-500 w-4" />
                                    <span>
                                        {Array.isArray(user.skills) && user.skills.length > 0
                                            ? user.skills.join(", ")
                                            : "No skills listed"}
                                    </span>
                                </li>
                                   <li className="flex items-center gap-3">
                                    <FaMapPin className="text-gray-500 w-4" />
                                        <span>
                                            {locationString || "Unknown location"}
                                        </span>
                                   </li>
                                <li className="flex items-center gap-3">
                                    <FaPhone className="text-gray-500 w-4" />
                                    <span>{isValid(user.phone) ? user.phone : "N/A"}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex p-4 border-t border-gray-200 text-center">
                            <div className="w-1/2">
                                <span className="font-bold text-lg">{user.followerCount ?? 0}</span>
                                <span className="text-gray-600 text-sm block">Followers</span>
                            </div>
                            <div className="w-1/2">
                                <span className="font-bold text-lg">{user.followingCount ?? 0}</span>
                                <span className="text-gray-600 text-sm block">Following</span>
                            </div>
                        </div>
                        
                        <div className="h-48 bg-gray-100 border-t">
                            <ProfileMap locationString={locationString} />
                        </div>

                        <RatingBreakdown 
                            averageRating={user.averageRating}
                            totalRatings={user.totalRatings}
                            totalReviews={user.totalReviews}
                            ratingDistribution={user.ratingDistribution}
                        />

                        {/* 🚨 ADDED: Report User Button Footer (Only visible if you are NOT the owner) */}
                        {!isOwner && (
                            <div className="p-4 border-t border-gray-200 flex justify-center bg-gray-50 rounded-b-lg">
                                <ReportUserButton reportedUserId={userId} reportedUserName={user.name} />
                            </div>
                        )}

                    </div>
                </aside>
            </div>
            
            {/* 🚨 ADDED: Booking Modal rendered at the bottom of the component hierarchy */}
            {isBookingModalOpen && (
                <BookingModal 
                    workerId={userId} 
                    workerName={user.name} 
                    onClose={() => setIsBookingModalOpen(false)} 
                />
            )}
        </>
    );
}