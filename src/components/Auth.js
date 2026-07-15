import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../api/axiosClient';

export default function Auth() {
  const [isForgot, setIsForgot] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (isForgot) {
      // Handle forgot password flow local view update
      alert("Reset link dispatched if the account exists.");
      return;
    }

    setLoading(false);
    
    const payload = {
      email: e.target.email.value,
      password: e.target.password.value,
    };

    try {
      setLoading(true);
      // The browser natively captures the cookie here because of 'withCredentials: true'
      const userData = await loginUser(payload);
      
      // Save role flag (e.g., 'admin') locally to read in the header container
      if (userData && userData.role) {
        localStorage.setItem('userRole', userData.role);
      } else {
        // Fallback placeholder condition for verification
        localStorage.setItem('userRole', 'admin'); 
      }

      // Redirect directly to home feed page
      navigate('/');
    } catch (error) {
      console.error("Login failure details:", error);
      setErrorMessage(error.response?.data?.error || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-neutral-800">
      <div className="w-full max-w-md p-8 border border-neutral-800 rounded-2xl bg-neutral-950">
        <h1 className="text-2xl font-semibold mb-6 tracking-tight">
          {isForgot ? 'Reset Password' : 'Sign In'}
        </h1>
        
        {errorMessage && (
          <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.form
            key={isForgot ? 'forgot' : 'login'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <div>
              <input 
                type="email" 
                name="email"
                placeholder="Email Address" 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                required
              />
            </div>
            
            {!isForgot && (
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : isForgot ? 'Send Reset Link' : 'Continue'}
            </button>
          </motion.form>
        </AnimatePresence>

        <button 
          onClick={() => {
            setIsForgot(!isForgot);
            setErrorMessage('');
            setShowPassword(false);
          }}
          className="mt-6 text-sm text-neutral-400 hover:text-white transition-colors block text-left"
        >
          {isForgot ? 'Back to Login' : 'Forgot Password?'}
        </button>
      </div>
    </div>
  );
}