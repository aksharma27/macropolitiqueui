import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Image as ImageIcon } from 'lucide-react';
import { fetchArticles, postArticle } from '../api/axiosClient';

export default function Feed() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [postSuccess, setPostSuccess] = useState(false);
  const observerTarget = useRef(null);

  // Initial load
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll listener setup
  useEffect(() => {
    if (!observerTarget.current || selectedArticle || isCreating || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [articles.length, loading, hasMore, selectedArticle, isCreating]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const newArticles = await fetchArticles(page, 20);

      const safeArticles = Array.isArray(newArticles) ? newArticles : [];

      if (safeArticles.length > 0) {
        setArticles(prev => {
          const existingIds = new Map(prev.map(item => [item._id || item.id, true]));
          const uniqueNewArticles = safeArticles.filter(
            item => !existingIds.has(item._id || item.id)
          );

          if (uniqueNewArticles.length === 0) {
            setHasMore(false);
            return prev;
          }

          return [...prev, ...uniqueNewArticles];
        });

        setPage(p => p + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Network Error: Could not fetch articles", error.message);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handlePostArticle = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: e.target.title.value,
      author: e.target.author.value,
      authorEmail: e.target.authorEmail.value,
      content: e.target.content.value,
    };

    if (previewImage) {
      payload.imageUrl = previewImage;
    }

    try {
      await postArticle(payload);
      
      setPostSuccess(true);
      setIsCreating(false);
      setPreviewImage(null);
      
      setArticles([]);
      setPage(1);
      setHasMore(true);
      
      const freshArticles = await fetchArticles(1, 20);
      const safeArticles = Array.isArray(freshArticles) ? freshArticles : [];
      setArticles(safeArticles);
      setHasMore(safeArticles.length === 20);
      setPage(2);
      
      setTimeout(() => setPostSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error posting article:", error);
      alert("Failed to post article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800 overflow-x-hidden">
      
      {/* Success Notification */}
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

      {/* Fixed Header */}
      {!selectedArticle && !isCreating && (
        <header className="fixed top-0 left-1 right-1 z-50 bg-black/90 backdrop-blur-sm border-b border-neutral-900">
          <div className="w-full h-16 flex items-center justify-between px-4 lg:px-[5px]">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CFR.MINIMAL
            </h1>

            <button 
              onClick={() => setIsCreating(true)}
              className="cursor-pointer flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-full transition-colors text-sm text-white"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Post an Article</span>
            </button>
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
        {isCreating ? (
          /* Create Article View */
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
                  setPreviewImage(null);
                }}
                className="flex items-center space-x-2 text-neutral-400 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft size={20} /> <span>Back to Feed</span>
              </button>

              <h1 className="text-3xl font-bold mb-8">Draft New Article</h1>

              <form onSubmit={handlePostArticle} className="space-y-6">
                <div>
                  <input 
                    type="text" 
                    name="title"
                    placeholder="Article Heading" 
                    required
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-4 text-2xl md:text-4xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div>
                  <input 
                    type="text" 
                    name="author"
                    placeholder="Author Name" 
                    required
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div>
                  <input 
                    type="email" 
                    name="authorEmail"
                    placeholder="Author Email" 
                    required
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                <div className="pt-4">
                  <label className="cursor-pointer flex items-center justify-center w-full md:w-auto md:inline-flex space-x-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-6 py-4 rounded-xl transition-all">
                    <ImageIcon size={20} className="text-neutral-400" />
                    <span className="text-neutral-300">
                      {previewImage ? 'Change Cover Image' : 'Upload Cover Image (Optional)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  
                  {previewImage && (
                    <div className="mt-6 w-full h-48 md:h-64 rounded-xl overflow-hidden bg-neutral-900">
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <textarea 
                    name="content"
                    placeholder="Write your article content here..." 
                    required
                    rows="8"
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors resize-y leading-relaxed"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-neutral-200 transition-colors mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Publishing...' : 'Publish Article'}
                </button>
              </form>
            </div>
          </motion.div>
        ) : selectedArticle ? (
          /* Full Article View */
          <motion.div 
  key="article-view"
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  className="fixed inset-0 bg-black overflow-y-auto z-50"
>
  <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900 h-15 flex items-center px-4 lg:px-8">
    <button 
      onClick={() => setSelectedArticle(null)}
      className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors py-2"
    >
      <ArrowLeft size={15} /> <span>Back</span>
    </button>
  </div>

  {/* Article Content Container - 70% on desktop, wider on mobile */}
  <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">{selectedArticle.title}</h1>
      <div className="mb-6 border-b border-neutral-800 pb-4">
        <p className="text-neutral-300 font-medium">By {selectedArticle.author}</p>
        <p className="text-neutral-500 text-sm">{formatDate(selectedArticle.date || selectedArticle.publishedOn || selectedArticle.createdAt)}</p>
      </div>
    </div>
    
    {selectedArticle.imageUrl && (
      <div className="mb-8">
        <img 
          src={selectedArticle.imageUrl} 
          alt="Article cover" 
          className="w-full h-56 md:h-80 lg:h-96 rounded-lg object-cover" 
        />
      </div>
    )}
    
    <div className="text-left text-neutral-300 leading-8 text-lg pb-18 break-words">
  {selectedArticle.content}
</div>
  </div>
</motion.div>
        ) : (
          /* Home Feed View */
          <motion.div
            key="feed-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center"
          >
            {/* Articles List */}
            <div className="space-y-12 w-full">
              {articles.length === 0 && !loading ? (
                <div className="text-center text-neutral-500 py-12">
                  <p className="text-lg">No articles yet</p>
                  <p className="text-sm mt-2">Be the first to publish!</p>
                </div>
              ) : (
                articles.map((article, index) => (
                  <motion.article 
                    key={article._id || article.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: (index % 5) * 0.1 }}
                    onClick={() => setSelectedArticle(article)}
                    className="group w-full cursor-pointer border-b border-neutral-900 pb-12 flex flex-col items-center"
                  >
                    {/* Title and meta - centered */}
                    <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] text-center">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-[0.125rem] group-hover:text-neutral-300 transition-colors">
                        {article.title}
                      </h2>
                      
                      <div className="mb-4 flex items-center justify-center space-x-2">
                        <span className="text-sm font-medium text-neutral-400">{article.author}</span>
                        <span className="text-xs text-neutral-600">
                          {formatDate(article.publishedOn || article.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Image - centered 50% width */}
                    {article.imageUrl && (
                      <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] h-32 sm:h-48 md:h-64 lg:h-72 overflow-hidden rounded-xl mb-4 bg-neutral-900 relative mx-auto">
                        <img 
                          src={article.imageUrl} 
                          alt="cover" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    {/* Content preview - centered 50% width with center-aligned text */}
                    <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[50%] mx-auto">
                      <p className={`text-neutral-400 text-sm md:text-base text-center ${article.imageUrl ? 'line-clamp-3' : 'line-clamp-5'}`}>
                        {article.content}
                      </p>
                    </div>
                  </motion.article>
                ))
              )}
            </div>

            {/* INFINITE SCROLL TARGET ANCHOR */}
            <div ref={observerTarget} className="h-10 w-full flex items-center justify-center my-8">
              {loading && (
                <span className="text-sm text-neutral-500 animate-pulse tracking-wide">
                  Loading stories...
                </span>
              )}
              {!hasMore && articles.length > 0 && (
                <span className="text-sm text-neutral-600">
                  — End of stories —
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}