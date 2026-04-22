"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import axios from 'axios';
import { toast } from 'sonner';
import PostCard from '@/app/components/PostCard'; 

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { postId } = params;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState('idle');

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/post/${postId}`);
        if (data.success) {
          setPost(data.post);
          
          const postAuthorId = data.post?.userId?._id;
          if (!session || !session.user || !postAuthorId) {
              setConnectStatus('idle');
          } else if (session.user.id === postAuthorId) {
              setConnectStatus('self');
          } else if (session.user.following && session.user.following.includes(postAuthorId)) {
              setConnectStatus('following');
          } else if (session.user.connectionRequestsSent && session.user.connectionRequestsSent.includes(postAuthorId)) {
              setConnectStatus('pending');
          } else {
              setConnectStatus('idle');
          }

        } else {
          toast.error(data.message || "Failed to load post.");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        toast.error("Could not find or load this post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, session]);

  const handleConnect = async () => {
    const postAuthorId = post?.userId?._id;
    if (connectStatus !== 'idle' || !session?.user?.id || !postAuthorId) return;
    setConnectStatus('loading');
    try {
        const response = await axios.post(`/api/user/${postAuthorId}/connect`);
        if (response.data.success) {
            toast.success("Follow request sent!");
            setConnectStatus('pending');
        } else {
            toast.error(response.data.message || "Failed to send request.");
            setConnectStatus('idle');
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred.");
        setConnectStatus('idle');
    }
  };

  const handleDisconnect = async () => {
    const postAuthorId = post?.userId?._id;
    if (connectStatus !== 'following' || !session?.user?.id || !postAuthorId) return;
    setConnectStatus('idle'); 
    toast.info(`You are no longer following ${post.userId.name}`);
    try {
        await axios.post(`/api/user/unfollow/${postAuthorId}`);
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to unfollow user");
        setConnectStatus('following');
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    toast.success("Post has been deleted. Redirecting...");
    router.push('/dashboard');
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center py-10 text-gray-500">Post not found. It may have been deleted.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PostCard 
        post={post}
        connectStatus={connectStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onDeleteSuccess={handlePostDeleted}
      />
    </div>
  );
}