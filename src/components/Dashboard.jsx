import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  X,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { approvePost, updatePost, fetchAllPosts, deletePost } from '../api/axiosClient';

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

// Delete Confirmation Modal Component
function DeleteConfirmModal({ isOpen, onCancel, onConfirm, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full mx-4"
      >
        <p className="text-white text-center text-lg font-medium mb-6">
          {message || 'Are you sure you want to delete this article?'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onCancel}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <button
            onClick={onConfirm}
            className="p-3 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-full transition-colors border border-red-800/50"
            aria-label="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Full Article Edit/View Component
function ArticleFullView({ post, onBack, onUpdate, onDeleteRequest }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title,
    content: post.content,
    author: post.author,
    authorEmail: post.authorEmail,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(post.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      let payload;
      if (imageFile) {
        const formData = new FormData();
        formData.append('title', editForm.title);
        formData.append('content', editForm.content);
        formData.append('author', editForm.author);
        formData.append('authorEmail', editForm.authorEmail);
        formData.append('published', 'false');
        formData.append('image', imageFile);
        payload = formData;
      } else {
        payload = {
          title: editForm.title,
          content: editForm.content,
          author: editForm.author,
          authorEmail: editForm.authorEmail,
          published: false,
        };
      }
      const updatedPost = await updatePost(post._id, payload);
      onUpdate(updatedPost.post);
      showToast('Draft saved successfully!');
      setImageFile(null);
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Failed to save draft. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    try {
      setLoading(true);
      let payload;
      if (imageFile) {
        const formData = new FormData();
        formData.append('title', editForm.title);
        formData.append('content', editForm.content);
        formData.append('author', editForm.author);
        formData.append('authorEmail', editForm.authorEmail);
        formData.append('published', 'true');
        formData.append('image', imageFile);
        payload = formData;
      } else {
        payload = {
          title: editForm.title,
          content: editForm.content,
          author: editForm.author,
          authorEmail: editForm.authorEmail,
          published: true,
        };
      }
      const updatedPost = await updatePost(post._id, payload);
      onUpdate(updatedPost.post);
      showToast('Article published successfully!');
      setImageFile(null);
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error('Error publishing post:', error);
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
      console.error('Error approving post:', error);
      showToast('Failed to approve post. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    onDeleteRequest(post._id);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900">
        <div className="w-full h-16 flex items-center justify-between px-4 lg:px-8">
          <button onClick={onBack} className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors py-2">
            <ArrowLeft size={15} /> <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            {getStatusBadge(post.published)}
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {isEditing ? (
          // Edit mode – with image upload
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

            {/* Image Upload Section */}
            <div className="pt-2">
              <label className="cursor-pointer flex items-center justify-center w-full md:w-auto md:inline-flex space-x-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-6 py-4 rounded-xl transition-all">
                <ImageIcon size={20} className="text-neutral-400" />
                <span className="text-neutral-300">
                  {previewImage ? 'Change Cover Image' : 'Upload Cover Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {previewImage && (
                <div className="mt-4 w-full h-48 md:h-64 rounded-xl overflow-hidden bg-neutral-900 relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setImageFile(null);
                      const fileInput = document.querySelector('input[type="file"]');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-800 text-white p-1.5 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

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
            <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
              <button onClick={handleSaveDraft} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto">
                Save Draft
              </button>
              <button onClick={handleSaveAndPublish} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto">
                Save & Publish
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPreviewImage(post.imageUrl || null);
                  setImageFile(null);
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium py-3 rounded-xl transition-colors border border-neutral-800 disabled:opacity-50 w-full sm:w-auto"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          // View mode – action buttons side‑by‑side
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">{post.title}</h1>
              <div className="mb-6 border-b border-neutral-800 pb-4">
                <p className="text-neutral-300 font-medium">By {post.author}</p>
                <p className="text-neutral-500 text-sm">{post.authorEmail}</p>
                <div className="mt-2 flex items-center justify-center gap-4">
                  <p className="text-neutral-500 text-sm">Created: {formatDate(post.createdAt)}</p>
                  {post.published && <p className="text-neutral-500 text-sm">Published: {formatDate(post.publishedOn)}</p>}
                </div>
              </div>
            </div>
            {post.imageUrl && (
              <div className="mb-8">
                <img src={post.imageUrl} alt="Article cover" className="w-full h-56 md:h-80 lg:h-96 rounded-lg object-cover" />
              </div>
            )}
            <div className="text-left text-neutral-300 leading-8 text-lg pb-8 break-words">{post.content}</div>

            <div className="flex flex-row flex-wrap gap-3 pb-12">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                <Edit3 size={18} />
                <span className="sr-only">Edit Article</span>
              </button>

              {!post.published ? (
                <button
                  onClick={handleApproveOnly}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-medium py-3 rounded-xl transition-colors border border-green-800/50 disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  <span className="sr-only">Approve</span>
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 bg-green-900/20 text-green-400 font-medium py-3 rounded-xl border border-green-800/50">
                  <CheckCircle size={18} />
                  <span>Published ✓</span>
                </div>
              )}

              <button
                onClick={handleDeleteClick}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 rounded-xl transition-colors border border-red-800/50 disabled:opacity-50"
              >
                <Trash2 size={18} />
                <span className="sr-only">Delete</span>
              </button>
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

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // ✅ Fix: prevent double API call
  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      checkAuth();
    }
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
      console.error('Error fetching all posts:', error);
      if (error.response?.status === 401) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
          setError('Session expired. Please log in again.');
          localStorage.clear();
          setTimeout(() => navigate('/auth'), 2000);
        } else {
          setError('Verifying session...');
          setTimeout(loadAllPosts, 1000);
        }
      } else if (error.response?.status === 403) {
        setError("You don't have permission to access this page.");
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError('Failed to load posts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId, e) => {
    e.stopPropagation();
    try {
      await approvePost(postId);
      setPosts(posts.map((post) => (post._id === postId ? { ...post, published: true } : post)));
      showSuccess('Post approved successfully!');
    } catch (error) {
      console.error('Error approving post:', error);
      showError('Failed to approve post. Please try again.');
    }
  };

  const requestDelete = (postId, e) => {
    if (e) e.stopPropagation();
    setDeleteTargetId(postId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deletePost(deleteTargetId);
      setPosts(posts.filter((post) => post._id !== deleteTargetId));
      showSuccess('Post deleted successfully!');
      if (selectedPost && selectedPost._id === deleteTargetId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post. Please try again.');
    } finally {
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    setSelectedPost(updatedPost);
  };

  const handleDeleteRequestFromView = (postId) => {
    setDeleteTargetId(postId);
    setDeleteModalOpen(true);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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
      <>
        <ArticleFullView
          post={selectedPost}
          onBack={() => setSelectedPost(null)}
          onUpdate={handlePostUpdate}
          onDeleteRequest={handleDeleteRequestFromView}
        />
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this article?"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800">
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
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft size={15} /> <span>Feed</span>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500">{posts.length} Posts</span>
            <button onClick={loadAllPosts} className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-neutral-500 animate-pulse tracking-wide">Loading dashboard...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No posts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-900">
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Author</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

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
                      <button onClick={() => setSelectedPost(post)} className="text-left font-medium text-white hover:text-neutral-300 transition-colors pr-4">
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
                      <button onClick={() => setSelectedPost(post)} className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
                        <Eye size={14} />
                        <span className="sr-only">View/Edit</span>
                      </button>
                      {!post.published && (
                        <button onClick={(e) => handleApprove(post._id, e)} className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-green-800/50">
                          <CheckCircle size={14} />
                          <span className="sr-only">Approve</span>
                        </button>
                      )}
                      <button onClick={(e) => requestDelete(post._id, e)} className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-xs transition-colors border border-red-800/50">
                        <Trash2 size={14} />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    <div className="col-span-2">{getStatusBadge(post.published)}</div>
                    <div className="col-span-4">
                      <button onClick={() => setSelectedPost(post)} className="font-medium text-white hover:text-neutral-300 transition-colors truncate text-left w-full">
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
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                        aria-label="View/Edit"
                      >
                        <Eye size={16} />
                      </button>
                      {!post.published && (
                        <button
                          onClick={(e) => handleApprove(post._id, e)}
                          className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors border border-green-800/50"
                          aria-label="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => requestDelete(post._id, e)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-800/50"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this article?"
      />
    </div>
  );
}