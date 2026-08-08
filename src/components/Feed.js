import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  NotebookPen,
  LayoutDashboard,
  Trash2,
  Mail,
  CheckCircle,
  X,
  Search,
  ArrowUpDown,
  Edit3,
  Eye,
  Share2,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import {
  fetchArticles,
  postArticle,
  deletePost,
  sendArticleOtp,
  verifyArticleOtp,
  checkEmailVerified,
  updatePost,
} from '../api/axiosClient';
import LogoutButton from './LogoutButton';
import ErrorComponent from './ErrorComponent';
import ContactFooter from './ContactFooter';
import { useNavigate } from 'react-router-dom';
import CropModal from './CropModal';

// ===== Custom SVG icons for LinkedIn and WhatsApp =====
const LinkedInIcon = ({ size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const WhatsAppIcon = ({ size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// ===== Confirm Modal =====
function ConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmColor = 'red',
}) {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-red-600/30 hover:bg-red-600/50 text-red-400 border-red-800/50',
    yellow: 'bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 border-yellow-800/50',
    green: 'bg-green-600/30 hover:bg-green-600/50 text-green-400 border-green-800/50',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-white text-center text-lg font-bold mb-2">{title}</h3>
        <p className="text-neutral-300 text-center text-sm mb-6">{message}</p>
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
            className={`p-3 rounded-full transition-colors border ${colorClasses[confirmColor]}`}
            aria-label={confirmLabel}
          >
            <CheckCircle size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ===== Main Feed Component =====
export default function Feed() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postSuccess, setPostSuccess] = useState(false);
  const [error, setError] = useState(null);
  const observerTarget = useRef(null);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const initialLoadDone = useRef(false);
  const initialLoadInProgress = useRef(false);
  const observerSetupDone = useRef(false);

  // Search & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Admin edit state (for full article view)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    author: '',
    authorEmail: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('Are you sure?');
  const [confirmMessage, setConfirmMessage] = useState('This action cannot be undone.');
  const [confirmLabel, setConfirmLabel] = useState('Confirm');
  const [confirmColor, setConfirmColor] = useState('red');

  // Share states for feed cards
  const [shareOpenFor, setShareOpenFor] = useState(null);
  const [copySuccessId, setCopySuccessId] = useState(null);

  // Article form states (for creation)
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContent, setFormContent] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [contentError, setContentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Image crop states
  const [formImage, setFormImage] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset feed when search or sort changes
  const isFirstSearchSortRun = useRef(true);
  useEffect(() => {
    if (isFirstSearchSortRun.current) {
      isFirstSearchSortRun.current = false;
      return;
    }
    if (initialLoadDone.current) {
      setArticles([]);
      setPage(1);
      setHasMore(true);
      observerSetupDone.current = false;
      initialLoadDone.current = false;
      loadMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortOrder]);

  // loadMore
  const loadMore = useCallback(
    async (reset = false) => {
      if (loading || (!hasMore && !reset)) return;

      setLoading(true);
      setError(null);
      if (reset) initialLoadInProgress.current = true;

      try {
        const currentPage = reset ? 1 : page;
        const newArticles = await fetchArticles({
          page: currentPage,
          limit: 20,
          search: debouncedSearch,
          sort: sortOrder,
        });

        const safeArticles = Array.isArray(newArticles) ? newArticles : [];

        if (safeArticles.length > 0) {
          if (reset) {
            setArticles(safeArticles);
            setPage(2);
            setHasMore(safeArticles.length === 20);
          } else {
            setArticles((prev) => {
              const existingIds = new Map(prev.map((item) => [item._id || item.id, true]));
              const uniqueNewArticles = safeArticles.filter(
                (item) => !existingIds.has(item._id || item.id)
              );
              if (uniqueNewArticles.length === 0) {
                setHasMore(false);
                return prev;
              }
              return [...prev, ...uniqueNewArticles];
            });
            setPage((p) => p + 1);
            if (safeArticles.length < 20) setHasMore(false);
          }
        } else {
          if (reset) {
            setArticles([]);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error('Network Error:', error.message);
        setError('Unable to fetch articles. Please try again.');
        setHasMore(false);
      } finally {
        setLoading(false);
        initialLoadInProgress.current = false;
        if (reset) {
          initialLoadDone.current = true;
          observerSetupDone.current = false;
        }
      }
    },
    [loading, hasMore, page, debouncedSearch, sortOrder]
  );

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current && !initialLoadInProgress.current) {
      loadMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (
      initialLoadInProgress.current ||
      !initialLoadDone.current ||
      !observerTarget.current ||
      selectedArticle ||
      isCreating ||
      !hasMore ||
      loading ||
      observerSetupDone.current
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoadInProgress.current) {
          loadMore(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(observerTarget.current);
    observerSetupDone.current = true;

    return () => {
      observer.disconnect();
      observerSetupDone.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles.length, loading, hasMore, selectedArticle, isCreating, loadMore]);

  // Close share dropdown on outside click
  useEffect(() => {
    if (shareOpenFor === null) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.share-dropdown')) {
        setShareOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shareOpenFor]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ----- Share helpers -----
  const getShareUrl = (articleId) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?article=${articleId}`;
  };

  const shareOnLinkedIn = (url, title) => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const shareOnWhatsApp = (url, title) => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
      '_blank'
    );
  };

  const shareOnTwitter = (url, title) => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
        title
      )}`,
      '_blank'
    );
  };

  const copyLink = (url, articleId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccessId(articleId);
      setTimeout(() => setCopySuccessId(null), 2000);
    });
  };

  // ----- Image crop handlers -----
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormImage(file);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setFormImage(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setFormImagePreview(url);
    setShowCropModal(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setFormImage(null);
    setFormImagePreview(null);
    const input = document.querySelector('input[type="file"]');
    if (input) input.value = '';
  };

  // ----- Admin actions (for editing from feed) -----
  const handleUnpublish = async (articleId) => {
    try {
      setLoading(true);
      await updatePost(articleId, { published: false });
      setArticles((prev) =>
        prev.map((article) =>
          article._id === articleId ? { ...article, published: false } : article
        )
      );
      if (selectedArticle && selectedArticle._id === articleId) {
        setSelectedArticle((prev) => ({ ...prev, published: false }));
      }
    } catch (error) {
      console.error('Error unpublishing:', error);
      alert('Failed to unpublish article.');
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
    }
  };

  const handleDelete = async (articleId) => {
    try {
      setLoading(true);
      await deletePost(articleId);
      setArticles((prev) => prev.filter((article) => article._id !== articleId));
      if (selectedArticle && selectedArticle._id === articleId) {
        setSelectedArticle(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article. Please try again.');
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
    }
  };

  const requestDelete = (articleId) => {
    setConfirmTitle('Delete Article?');
    setConfirmMessage('Are you sure you want to delete this article? This action cannot be undone.');
    setConfirmLabel('Delete');
    setConfirmColor('red');
    setConfirmAction(() => () => handleDelete(articleId));
    setConfirmModalOpen(true);
  };

  const requestUnpublish = (articleId) => {
    setConfirmTitle('Unpublish Article?');
    setConfirmMessage('This article will no longer be visible to readers. You can publish it again later.');
    setConfirmLabel('Unpublish');
    setConfirmColor('yellow');
    setConfirmAction(() => () => handleUnpublish(articleId));
    setConfirmModalOpen(true);
  };

  const handleEditClick = (article) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title,
      content: article.content,
      author: article.author,
      authorEmail: article.authorEmail,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      const updatedPost = await updatePost(selectedArticle._id, {
        title: editForm.title,
        content: editForm.content,
        author: editForm.author,
        authorEmail: editForm.authorEmail,
        published: selectedArticle.published,
      });
      setArticles((prev) =>
        prev.map((article) =>
          article._id === updatedPost.post._id ? updatedPost.post : article
        )
      );
      setSelectedArticle(updatedPost.post);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating article:', error);
      alert('Failed to update article.');
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedArticle((prev) => prev);
  };

  // ----- Creation OTP handlers -----
  const handleSendOtp = async () => {
    if (!formEmail) {
      setOtpError('Please enter your email first.');
      return;
    }
    try {
      setOtpError('');
      await sendArticleOtp(formEmail);
      setOtpSent(true);
      setShowOtpInput(true);
      setOtpError('OTP sent to your email.');
    } catch (error) {
      console.error('Send OTP error:', error);
      setOtpError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    try {
      setOtpError('');
      await verifyArticleOtp({ email: formEmail, otp: otpCode });
      setEmailVerified(true);
      setShowOtpInput(false);
      setOtpSent(false);
      setOtpError('Email verified successfully!');
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError('Invalid OTP. Please try again.');
    }
  };

  const handleContentChange = (text) => {
    setFormContent(text);
    if (text.length < 100) {
      setContentError(`Content must be at least 100 characters (${text.length}/100)`);
    } else {
      setContentError('');
    }
  };

  const checkEmail = async (email) => {
    if (!email) return;
    setCheckingEmail(true);
    try {
      const result = await checkEmailVerified(email);
      if (result.verified) {
        setEmailVerified(true);
        setOtpError('Email already verified. You can publish.');
        setShowOtpInput(false);
        setOtpSent(false);
      } else {
        setEmailVerified(false);
      }
    } catch (error) {
      console.error('Check email error:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setFormEmail(newEmail);
    setEmailVerified(false);
    setOtpSent(false);
    setShowOtpInput(false);
    setOtpCode('');
    setOtpError('');
  };

  const handlePostArticle = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      alert('Please verify your email first.');
      return;
    }
    if (formContent.length < 100) {
      setContentError('Content must be at least 100 characters.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('author', formAuthor);
    formData.append('authorEmail', formEmail);
    formData.append('content', formContent);
    if (formImage) {
      formData.append('image', formImage);
    }

    try {
      await postArticle(formData);
      setPostSuccess(true);
      setIsCreating(false);
      setFormTitle('');
      setFormAuthor('');
      setFormEmail('');
      setFormContent('');
      setFormImage(null);
      setFormImagePreview(null);
      setEmailVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setShowOtpInput(false);
      setOtpError('');
      setContentError('');
      setArticles([]);
      setPage(1);
      setHasMore(true);
      initialLoadDone.current = false;
      observerSetupDone.current = false;
      await loadMore(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (error) {
      console.error('Error posting article:', error);
      setError('Failed to post article. Please try again.');
      alert('Failed to post article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // ===== JSX =====
  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800 overflow-x-hidden">
      <AnimatePresence>
        {postSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-900/90 backdrop-blur-sm border border-green-700 text-green-200 px-6 py-3 rounded-full shadow-lg text-sm"
          >
            Article submitted for review! It will appear once approved.
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedArticle && !isCreating && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
          <div className="w-full py-2 text-center border-b border-white/5">
            <a href="/">
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.30rem",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  color: "#ffffff",
                  textShadow: "0 0 8px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)",
                  WebkitTextStroke: "0.5px rgba(0,0,0,0.3)",
                  textStroke: "0.5px rgba(0,0,0,0.3)",
                }}
              >
                The MacroPolitique
              </span>
            </a>
          </div>

          <div className="w-full flex items-center justify-between px-4 py-2 gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={toggleSort}
                className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-full transition-colors text-xs text-neutral-300 flex-shrink-0"
                aria-label="Toggle sort order"
              >
                <ArrowUpDown size={14} />
                <span className="hidden xs:inline">
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>

              <div className="relative hidden sm:block flex-1 max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-full px-4 py-1.5 pl-9 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              </div>

              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="sm:hidden text-neutral-400 hover:text-white transition-colors"
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {(localStorage.getItem('isLoggedIn') === 'true' || isAdmin) && <LogoutButton />}
              {localStorage.getItem('isLoggedIn') && isAdmin && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="cursor-pointer flex items-center gap-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold px-3 py-1.5 rounded-full transition-colors text-xs"
                >
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}
              <button
                onClick={() => setIsCreating(true)}
                className="cursor-pointer flex items-center gap-2 bg-neutral-600 hover:bg-neutral-800 px-3 py-1.5 rounded-full transition-colors text-xs text-white"
              >
                <NotebookPen size={14} />
                <span className="hidden sm:inline">Write For Us</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="sm:hidden bg-black/95 backdrop-blur-md border-t border-white/10 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-full px-4 py-2 pl-9 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  </div>
                  <button
                    onClick={() => setMobileSearchOpen(false)}
                    className="text-neutral-400 hover:text-white transition-colors"
                    aria-label="Close search"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      <AnimatePresence mode="wait">
        {isCreating ? (
          // Create Article View with image upload & crop
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black overflow-y-auto z-50 pt-8 px-4 pb-12"
          >
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                  setFormTitle('');
                  setFormAuthor('');
                  setFormEmail('');
                  setFormContent('');
                  setFormImage(null);
                  setFormImagePreview(null);
                  setEmailVerified(false);
                  setOtpSent(false);
                  setOtpCode('');
                  setShowOtpInput(false);
                  setOtpError('');
                  setContentError('');
                }}
                className="flex items-center space-x-2 text-neutral-400 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft size={20} /> <span>Back to Feed</span>
              </button>

              <h1 className="text-3xl font-bold mb-8">Write for us</h1>
              <span>
                Before submitting, please ensure that your article is entirely your own original work. 
                We do not accept content that is plagiarised, substantially copied or generated wholly or 
                partially using artificial intelligence (AI) tools. 
                By submitting, you confirm that your manuscript has been written independently, 
                all sources have been appropriately cited and the work has not been published elsewhere. 
                The Macropolitique reserves the right to reject any submission that fails to meet these 
                originality and editorial standards.
              </span>
              <div className="mb-6">
                <ErrorComponent message={error} visible={!!error} onRetry={() => setError(null)} />
              </div>

              <form onSubmit={handlePostArticle} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Article Heading"
                    required
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-4 text-2xl md:text-4xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Author Name"
                    required
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={formEmail}
                        onChange={handleEmailChange}
                        onBlur={() => checkEmail(formEmail)}
                        placeholder="Author Email"
                        required
                        disabled={emailVerified}
                        className={`w-full bg-transparent border-b px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                          emailVerified
                            ? 'border-green-500 text-green-400'
                            : 'border-neutral-800 focus:border-neutral-400'
                        }`}
                      />
                    </div>
                    {!emailVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!formEmail || checkingEmail}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
                      >
                        <Mail size={16} />
                        {checkingEmail ? 'Checking...' : 'Send OTP'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle size={16} />
                        Verified
                      </span>
                    )}
                  </div>

                  {otpError && (
                    <p
                      className={`mt-1 text-sm ${
                        otpError.includes('verified') ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {otpError}
                    </p>
                  )}

                  {showOtpInput && !emailVerified && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-end">
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-2 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>

                {/* Image Upload Section with Crop */}
                <div>
                  <label className="cursor-pointer flex items-center justify-center w-full md:w-auto md:inline-flex space-x-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-6 py-4 rounded-xl transition-all">
                    <ImageIcon size={20} className="text-neutral-400" />
                    <span className="text-neutral-300">
                      {formImagePreview ? 'Change Cover Image' : 'Upload Cover Image (optional)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {formImagePreview && (
                    <div className="mt-4 w-full h-48 md:h-64 rounded-xl overflow-hidden bg-neutral-900 relative">
                      <img
                        src={formImagePreview}
                        alt="Cover preview"
                        className="w-full h-full object-contain bg-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormImagePreview(null);
                          setFormImage(null);
                          const input = document.querySelector('input[type="file"]');
                          if (input) input.value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-800 text-white p-1.5 rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <textarea
                    value={formContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Write your article content here (minimum 100 characters)..."
                    required
                    rows="8"
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-y leading-relaxed"
                  />
                  {contentError && <p className="mt-1 text-sm text-red-400">{contentError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !emailVerified || formContent.length < 100}
                  className={`w-full font-semibold py-4 rounded-xl transition-colors mt-8 ${
                    isSubmitting || !emailVerified || formContent.length < 100
                      ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Article'}
                </button>

                {!emailVerified && (
                  <p className="text-xs text-neutral-500 text-center">
                    Please verify your email before publishing.
                  </p>
                )}
                {emailVerified && formContent.length < 100 && (
                  <p className="text-xs text-red-400 text-center">
                    Content must be at least 100 characters.
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        ) : selectedArticle ? (
          // Full Article View (with share button)
          <motion.div
            key="article-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 bg-black overflow-y-auto z-50"
          >
            <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900 h-15 flex items-center justify-between px-4 lg:px-8">
              <button
                onClick={() => {
                  setSelectedArticle(null);
                  setIsEditing(false);
                  setShareOpenFor(null);
                }}
                className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors py-2"
              >
                <ArrowLeft size={15} /> <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="relative share-dropdown">
                  <button
                    onClick={() => setShareOpenFor(selectedArticle._id)}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                    aria-label="Share article"
                  >
                    <Share2 size={18} />
                  </button>
                  <AnimatePresence>
                    {shareOpenFor === selectedArticle._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => {
                              const url = getShareUrl(selectedArticle._id);
                              shareOnLinkedIn(url, selectedArticle.title);
                              setShareOpenFor(null);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <LinkedInIcon size={16} className="text-blue-500" />
                            LinkedIn
                          </button>
                          <button
                            onClick={() => {
                              const url = getShareUrl(selectedArticle._id);
                              shareOnWhatsApp(url, selectedArticle.title);
                              setShareOpenFor(null);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <WhatsAppIcon size={16} className="text-green-500" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              const url = getShareUrl(selectedArticle._id);
                              shareOnTwitter(url, selectedArticle.title);
                              setShareOpenFor(null);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <X size={16} className="text-sky-400" />
                            X (Twitter)
                          </button>
                          <button
                            onClick={() => {
                              const url = getShareUrl(selectedArticle._id);
                              copyLink(url, selectedArticle._id);
                              setShareOpenFor(null);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <Copy size={16} className="text-purple-400" />
                            {copySuccessId === selectedArticle._id ? 'Copied!' : 'Copy Link (for Instagram)'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isAdmin && (
                  <>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => handleEditClick(selectedArticle)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          aria-label="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        {selectedArticle.published && (
                          <button
                            onClick={() => requestUnpublish(selectedArticle._id)}
                            className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                            aria-label="Unpublish"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => requestDelete(selectedArticle._id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
              {isEditing ? (
                <div className="space-y-6">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-4 text-2xl md:text-4xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                    placeholder="Title"
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      value={editForm.author}
                      onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                      className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                      placeholder="Author"
                    />
                    <input
                      type="email"
                      value={editForm.authorEmail}
                      onChange={(e) => setEditForm({ ...editForm, authorEmail: e.target.value })}
                      className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                      placeholder="Author Email"
                    />
                  </div>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows="15"
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-y leading-relaxed text-lg"
                    placeholder="Content"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editLoading}
                      className="flex-1 bg-[#39FF14] hover:bg-[#32E612] text-black font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                      {selectedArticle.title}
                    </h1>
                    <div className="mb-6 border-b border-neutral-800 pb-4">
                      <p className="text-neutral-300 font-medium">By {selectedArticle.author}</p>
                      <p className="text-neutral-500 text-sm">
                        {formatDate(
                          selectedArticle.date || selectedArticle.publishedOn || selectedArticle.createdAt
                        )}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Status: {selectedArticle.published ? 'Published' : 'Unpublished'}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedArticle.imageUrl && (
                    <div className="mb-8">
                      <img
                        src={selectedArticle.imageUrl}
                        alt="Article cover"
                        className="w-full h-56 md:h-80 lg:h-96 rounded-lg object-contain bg-neutral-900"
                      />
                    </div>
                  )}
                  <div className="text-left text-neutral-300 leading-8 text-lg pb-18 break-words">
                    {selectedArticle.content}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          // Feed View
          <motion.div
            key="feed-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`max-w-3xl mx-auto px-4 pt-28 pb-16 flex flex-col items-center transition-all duration-300 ${
              mobileSearchOpen ? 'blur-sm pointer-events-none' : ''
            }`}
          >
            <div className="w-full mb-8">
              <ErrorComponent
                message={error || 'Unable to fetch articles. Please try again.'}
                visible={!!error}
                onRetry={() => {
                  setError(null);
                  setArticles([]);
                  setPage(1);
                  setHasMore(true);
                  initialLoadDone.current = false;
                  observerSetupDone.current = false;
                  loadMore(true);
                }}
              />
            </div>
            <div className="space-y-12 w-full">
              {articles.length === 0 && !loading && !error ? (
                <div className="text-center text-neutral-500 py-12">
                  <p className="text-lg">No articles found</p>
                  <p className="text-sm mt-2">Try adjusting your search or publish the first article!</p>
                </div>
              ) : (
                articles.map((article, index) => {
                  const articleId = article._id || article.id;
                  return (
                    <motion.article
                      key={articleId || index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.4, delay: (index % 5) * 0.1 }}
                      className="group w-full cursor-pointer border-b border-neutral-900 pb-12 flex flex-col items-center"
                    >
                      <div
                        onClick={() => setSelectedArticle(article)}
                        className="w-full flex flex-col items-center"
                      >
                        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] text-center">
                          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-[0.125rem] group-hover:text-neutral-300 transition-colors">
                            {article.title}
                          </h2>
                          <div className="mb-4 flex items-center justify-center space-x-2">
                            <span className="text-sm font-medium text-neutral-400">
                              {article.author}
                            </span>
                            <span className="text-xs text-neutral-600">
                              {formatDate(article.publishedOn || article.createdAt)}
                            </span>
                            {isAdmin && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                article.published
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-yellow-900/30 text-yellow-400'
                              }`}>
                                {article.published ? 'Published' : 'Draft'}
                              </span>
                            )}
                          </div>
                        </div>
                        {article.imageUrl && (
                          <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] h-32 sm:h-48 md:h-64 lg:h-72 overflow-hidden rounded-xl mb-4 bg-neutral-900 relative mx-auto">
                            <img
                              src={article.imageUrl}
                              alt="cover"
                              className="w-full h-full object-contain bg-neutral-900 group-hover:scale-105 transition-transform duration-700 ease-out"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] mx-auto">
                          <p
                            className={`text-neutral-400 text-sm md:text-base text-center ${
                              article.imageUrl ? 'line-clamp-3' : 'line-clamp-5'
                            }`}
                          >
                            {article.content}
                          </p>
                        </div>
                      </div>

                      {/* Actions Row: Share + Admin buttons */}
                      <div className="mt-4 flex items-center justify-center gap-3 w-full sm:w-[90%] md:w-[85%] lg:w-[50%]">
                        <div className="relative share-dropdown">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareOpenFor(shareOpenFor === articleId ? null : articleId);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                            aria-label="Share article"
                          >
                            <Share2 size={16} />
                          </button>
                          <AnimatePresence>
                            {shareOpenFor === articleId && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-50"
                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                              >
                                <div className="p-2 space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = getShareUrl(articleId);
                                      shareOnLinkedIn(url, article.title);
                                      setShareOpenFor(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                                  >
                                    <LinkedInIcon size={16} className="text-blue-500" />
                                    LinkedIn
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = getShareUrl(articleId);
                                      shareOnWhatsApp(url, article.title);
                                      setShareOpenFor(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                                  >
                                    <WhatsAppIcon size={16} className="text-green-500" />
                                    WhatsApp
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = getShareUrl(articleId);
                                      shareOnTwitter(url, article.title);
                                      setShareOpenFor(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                                  >
                                    <X size={16} className="text-sky-400" />
                                    X (Twitter)
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = getShareUrl(articleId);
                                      copyLink(url, articleId);
                                      setShareOpenFor(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors"
                                  >
                                    <Copy size={16} className="text-purple-400" />
                                    {copySuccessId === articleId ? 'Copied!' : 'Copy Link (for Instagram)'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(article);
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                              aria-label="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            {article.published && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestUnpublish(articleId);
                                }}
                                className="p-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"
                                aria-label="Unpublish"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDelete(articleId);
                              }}
                              className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>
            <div ref={observerTarget} className="h-10 w-full flex items-center justify-center my-8">
              {loading && (
                <span className="text-sm text-neutral-500 animate-pulse tracking-wide">
                  Loading articles...
                </span>
              )}
              {!hasMore && articles.length > 0 && (
                <span className="text-sm text-neutral-600">— End of articles —</span>
              )}
            </div>

            <ContactFooter />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      {showCropModal && formImage && (
        <CropModal
          imageFile={formImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        confirmColor={confirmColor}
      />
    </div>
  );
}