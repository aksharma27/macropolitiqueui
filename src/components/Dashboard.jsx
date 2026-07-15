import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Edit3, X, Save, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { approvePost, updatePost, fetchAllPosts } from '../api/axiosClient';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', published: false });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || !userRole) {
      navigate('/auth');
      return;
    }
    
    setIsAuthenticated(true);
    loadAllPosts();
  };

  const loadAllPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching all posts:", error);
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.clear();
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setError("Failed to load posts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId, e) => {
    e.stopPropagation();
    try {
      await approvePost(postId);
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, published: true } : post
      ));
      showSuccess('Post approved successfully!');
    } catch (error) {
      console.error("Error approving post:", error);
      showError("Failed to approve post. Please try again.");
    }
  };

  const handleEditClick = (post, e) => {
    e.stopPropagation();
    setEditingPost(post._id);
    setEditForm({
      title: post.title,
      content: post.content,
      published: post.published
    });
  };

  const handleEditSave = async (postId, e) => {
    e.stopPropagation();
    try {
      const updatedPost = await updatePost(postId, editForm);
      setPosts(posts.map(post => 
        post._id === postId ? updatedPost.post : post
      ));
      setEditingPost(null);
      showSuccess('Post updated successfully!');
    } catch (error) {
      console.error("Error updating post:", error);
      showError("Failed to update post. Please try again.");
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingPost(null);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const getStatusBadge = (published) => {
    if (published) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
          <CheckCircle size={12} />
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800">
        <Clock size={12} />
        Pending Review
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-sm text-neutral-500 animate-pulse">Checking authentication...</span>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-neutral-800">
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900 h-15 flex items-center px-4 lg:px-8">
          <button 
            onClick={() => setSelectedPost(null)}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors py-2"
          >
            <ArrowLeft size={15} /> <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">{selectedPost.title}</h1>
            <div className="mb-6 border-b border-neutral-800 pb-4">
              <p className="text-neutral-300 font-medium">By {selectedPost.author}</p>
              <p className="text-neutral-500 text-sm">{selectedPost.authorEmail}</p>
              <div className="mt-2 flex items-center justify-center gap-4">
                <p className="text-neutral-500 text-sm">
                  Created: {formatDate(selectedPost.createdAt)}
                </p>
                {getStatusBadge(selectedPost.published)}
              </div>
            </div>
          </div>
          
          {selectedPost.imageUrl && (
            <div className="mb-8">
              <img 
                src={selectedPost.imageUrl} 
                alt="Article cover" 
                className="w-full h-56 md:h-80 lg:h-96 rounded-lg object-cover" 
              />
            </div>
          )}
          
          <div className="text-left text-neutral-300 leading-8 text-lg pb-12 break-words">
            {selectedPost.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800">
      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-900/90 backdrop-blur-sm border border-green-700 text-green-200 px-6 py-3 rounded-full shadow-lg text-sm"
          >
            {successMessage}
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 backdrop-blur-sm border border-red-700 text-red-200 px-6 py-3 rounded-full shadow-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-900">
        <div className="w-full h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={15} /> <span>Feed</span>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500">
              {posts.length} Posts
            </span>
            <button
              onClick={loadAllPosts}
              className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-neutral-500 animate-pulse tracking-wide">
              Loading dashboard...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No posts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-900">
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Posts List */}
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-neutral-900 rounded-xl hover:border-neutral-800 transition-all bg-neutral-950/50 hover:bg-neutral-950"
                >
                  {/* Mobile View */}
                  <div className="lg:hidden p-4">
                    {editingPost === post._id ? (
                      /* Mobile Edit Form */
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-500"
                          placeholder="Title"
                        />
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          rows="4"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-500 resize-none"
                          placeholder="Content"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.published}
                            onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                            className="rounded border-neutral-700 bg-neutral-900"
                          />
                          <span className="text-xs text-neutral-400">Published</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleEditSave(post._id, e)}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Save size={14} /> Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mobile View */
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-left font-medium text-white hover:text-neutral-300 transition-colors pr-4"
                          >
                            {post.title}
                          </button>
                          {getStatusBadge(post.published)}
                        </div>
                        <p className="text-sm text-neutral-400 mb-2">By {post.author}</p>
                        <div className="text-xs text-neutral-600 mb-3">
                          <p>Created: {formatDate(post.createdAt)}</p>
                          {post.published && <p>Published: {formatDate(post.publishedOn)}</p>}
                        </div>
                        <div className="flex gap-2">
                          {!post.published && (
                            <button
                              onClick={(e) => handleApprove(post._id, e)}
                              className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-green-800/50"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          <button
                            onClick={(e) => handleEditClick(post, e)}
                            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    <div className="col-span-2">
                      {getStatusBadge(post.published)}
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="font-medium text-white hover:text-neutral-300 transition-colors truncate text-left w-full"
                      >
                        {post.title}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-neutral-400">{post.author}</p>
                      <p className="text-xs text-neutral-600 truncate">{post.authorEmail}</p>
                    </div>
                    <div className="col-span-2 text-xs text-neutral-600">
                      <p>Created: {formatDate(post.createdAt)}</p>
                      {post.published && <p>Published: {formatDate(post.publishedOn)}</p>}
                    </div>
                    <div className="col-span-3">
                      {editingPost === post._id ? (
                        /* Desktop Edit Form */
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-neutral-500"
                            placeholder="Title"
                          />
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            rows="2"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-neutral-500 resize-none"
                            placeholder="Content"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.published}
                              onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                              className="rounded border-neutral-700 bg-neutral-900"
                            />
                            <span className="text-xs text-neutral-400">Published</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleEditSave(post._id, e)}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {!post.published && (
                            <button
                              onClick={(e) => handleApprove(post._id, e)}
                              className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-green-800/50"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          <button
                            onClick={(e) => handleEditClick(post, e)}
                            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}