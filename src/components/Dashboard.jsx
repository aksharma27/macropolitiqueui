import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Edit3, Save, Send, Eye, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { approvePost, updatePost, fetchAllPosts } from '../api/axiosClient';

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-sm border px-6 py-3 rounded-full shadow-lg text-sm ${
        type === 'success' 
          ? 'bg-green-900/90 border-green-700 text-green-200' 
          : 'bg-red-900/90 border-red-700 text-red-200'
      }`}
    >
      {message}
    </motion.div>
  );
}

// Full Article Edit/View Component
function ArticleFullView({ post, onBack, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title,
    content: post.content,
    author: post.author,
    authorEmail: post.authorEmail
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const updatedPost = await updatePost(post._id, {
        ...editForm,
        published: false
      });
      onUpdate(updatedPost.post);
      showToast('Draft saved successfully!');
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast('Failed to save draft. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    try {
      setLoading(true);
      const updatedPost = await updatePost(post._id, {
        ...editForm,
        published: true
      });
      onUpdate(updatedPost.post);
      showToast('Article published successfully!');
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error("Error publishing post:", error);
      showToast('Failed to publish. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOnly = async () => {
    try {
      setLoading(true);
      await approvePost(post._id);
      const updatedPost = { ...post, published: true };
      onUpdate(updatedPost);
      showToast('Post approved successfully!');
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error("Error approving post:", error);
      showToast('Failed to approve post. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800">
      {/* Toast Messages */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900">
        <div className="w-full h-16 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors py-2"
          >
            <ArrowLeft size={15} /> <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(post.published)}
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {isEditing ? (
  /* Edit Mode */
  <div className="space-y-6 w-full max-w-full">
    <input
      type="text"
      value={editForm.title}
      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
      className="w-full bg-transparent border-b border-neutral-800 px-0 py-4 text-2xl md:text-4xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
      placeholder="Article Title"
    />
    
    <div className="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        value={editForm.author}
        onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
        className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors w-full sm:w-auto"
        placeholder="Author Name"
      />
      <input
        type="email"
        value={editForm.authorEmail}
        onChange={(e) => setEditForm({ ...editForm, authorEmail: e.target.value })}
        className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors w-full sm:w-auto"
        placeholder="Author Email"
      />
    </div>

    {/* Textarea with explicit width control */}
    <div className="w-full max-w-full overflow-hidden">
      <textarea
        value={editForm.content}
        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
        rows="15"
        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-y leading-relaxed text-lg box-border"
        placeholder="Write your article content here..."
        style={{ maxWidth: '100%' }}
      />
    </div>

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
      <button
        onClick={handleSaveDraft}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
      >
        <Save size={18} />
        Save Draft
      </button>
      <button
        onClick={handleSaveAndPublish}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
      >
        <Send size={18} />
        Save & Publish
      </button>
      <button
        onClick={() => setIsEditing(false)}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium py-3 rounded-xl transition-colors border border-neutral-800 disabled:opacity-50 w-full sm:w-auto"
      >
        <X size={18} />
        Cancel Edit
      </button>
    </div>
  </div>
) : (
          /* View Mode */
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">{post.title}</h1>
              <div className="mb-6 border-b border-neutral-800 pb-4">
                <p className="text-neutral-300 font-medium">By {post.author}</p>
                <p className="text-neutral-500 text-sm">{post.authorEmail}</p>
                <div className="mt-2 flex items-center justify-center gap-4">
                  <p className="text-neutral-500 text-sm">
                    Created: {formatDate(post.createdAt)}
                  </p>
                  {post.published && (
                    <p className="text-neutral-500 text-sm">
                      Published: {formatDate(post.publishedOn)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {post.imageUrl && (
              <div className="mb-8">
                <img 
                  src={post.imageUrl} 
                  alt="Article cover" 
                  className="w-full h-56 md:h-80 lg:h-96 rounded-lg object-cover" 
                />
              </div>
            )}
            
            <div className="text-left text-neutral-300 leading-8 text-lg pb-8 break-words">
              {post.content}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pb-12">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                <Edit3 size={18} />
                Edit Article
              </button>
              {!post.published && (
                <button
                  onClick={handleApproveOnly}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-medium py-3 rounded-xl transition-colors border border-green-800/50 disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  Approve Only
                </button>
              )}
              {post.published && (
                <div className="flex-1 flex items-center justify-center gap-2 bg-green-900/20 text-green-400 font-medium py-3 rounded-xl border border-green-800/50">
                  <CheckCircle size={18} />
                  Published ✓
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
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
      // Check if it's really a session issue or just a timing issue
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      
      if (!isLoggedIn) {
        setError("Session expired. Please log in again.");
        localStorage.clear();
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        // Might be a timing issue, retry once
        setError("Verifying session...");
        setTimeout(() => {
          loadAllPosts(); // Retry once
        }, 1000);
      }
    } else if (error.response?.status === 403) {
      setError("You don't have permission to access this page.");
      setTimeout(() => navigate('/'), 2000);
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

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
    setSelectedPost(updatedPost);
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
      <ArticleFullView
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onUpdate={handlePostUpdate}
      />
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
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-2">Actions</div>
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
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        <Eye size={12} /> View/Edit
                      </button>
                      {!post.published && (
                        <button
                          onClick={(e) => handleApprove(post._id, e)}
                          className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-green-800/50"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    <div className="col-span-2">
                      {getStatusBadge(post.published)}
                    </div>
                    <div className="col-span-4">
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
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <Eye size={12} /> View/Edit
                        </button>
                        {!post.published && (
                          <button
                            onClick={(e) => handleApprove(post._id, e)}
                            className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-green-800/50"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}
                      </div>
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