import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Key } from 'lucide-react';
import { loginUser, forgotPassword, resetPassword } from '../api/axiosClient';

export default function Auth() {
  const [isForgot, setIsForgot] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    const payload = {
      email: e.target.email.value,
      password: e.target.password.value,
    };
    try {
      setLoading(true);
      const userData = await loginUser(payload);
      
      if (userData && userData.role) {
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', userData.email || payload.email);
      } else {
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', payload.email);
      }

      navigate('/');
    } catch (error) {
      console.error("Login failure details:", error);
      setErrorMessage(error.response?.data?.error || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };


  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setSuccessMessage('OTP has been sent to your email if the account exists.');
      setStep('forgot-otp');
    } catch (error) {
      console.error("Forgot password error:", error);
      // Don't reveal if email exists or not
      setSuccessMessage('If that email is registered, an OTP has been sent.');
      setStep('forgot-otp');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        email,
        otp,
        newPassword
      });
      
      setSuccessMessage('Password has been successfully reset!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setIsForgot(false);
        setStep('login');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setSuccessMessage('');
      }, 2000);
      
    } catch (error) {
      console.error("Reset password error:", error);
      setErrorMessage(error.response?.data?.error || "Failed to reset password. Please check your OTP and try again.");
    } finally {
      setLoading(false);
    }
  };


  const handleBackToEmail = () => {
    setStep('forgot-email');
    setOtp('');
    setNewPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelForgot = () => {
    setIsForgot(false);
    setStep('login');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setShowPassword(false);
  };


  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setErrorMessage('');
  
  //   if (isForgot) {
  //     alert("Reset link dispatched if the account exists.");
  //     return;
  //   }
  
  //   const payload = {
  //     email: e.target.email.value,
  //     password: e.target.password.value,
  //   };

  //   try {
  //     setLoading(true);
  //   const userData = await loginUser(payload);
    
  //   console.log('Login response:', userData); // Debug log
    
  //   // Save all auth data locally
  //   if (userData) {
  //     localStorage.setItem('userRole', userData.role || 'admin');
  //     localStorage.setItem('isLoggedIn', 'true');
  //     localStorage.setItem('userEmail', userData.email || payload.email);
      
  //     // If backend returns a token, save it
  //     if (userData.token) {
  //       localStorage.setItem('token', userData.token);
  //     }
  //   } else {
  //     // Fallback
  //     localStorage.setItem('userRole', 'admin');
  //     localStorage.setItem('isLoggedIn', 'true');
  //     localStorage.setItem('userEmail', payload.email);
  //   }

  //   console.log('Stored auth data:', {
  //     isLoggedIn: localStorage.getItem('isLoggedIn'),
  //     userRole: localStorage.getItem('userRole'),
  //     hasToken: !!localStorage.getItem('token')
  //   });

  //   // Small delay to ensure cookie is set
  //   setTimeout(() => {
  //     navigate('/');
  //   }, 200);
    
  //   } catch (error) {
  //   console.error("Login failure details:", error);
  //   setErrorMessage(error.response?.data?.error || "Authentication failed. Please verify credentials.");
  //   } finally {
  //   setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-neutral-800">
      <div className="w-full max-w-md p-8 border border-neutral-800 rounded-2xl bg-neutral-950">
        
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 'login' && 'Sign In'}
            {step === 'forgot-email' && 'Forgot Password'}
            {step === 'forgot-otp' && 'Enter OTP'}
            {step === 'forgot-reset' && 'Reset Password'}
          </h1>
          
          {(step !== 'login') && (
            <button
              onClick={handleCancelForgot}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        
        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'login' && (
            /* Login Form */
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={handleLogin}
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

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </motion.form>
          )}

          {step === 'forgot-email' && (
            /* Forgot Password - Email Input */
            <motion.form
              key="forgot-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={handleSendOTP}
            >
              <div className="text-sm text-neutral-400 mb-4">
                Enter your email address and we'll send you an OTP to reset your password.
              </div>
              
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </motion.form>
          )}

          {step === 'forgot-otp' && (
            /* OTP Input */
            <motion.form
              key="forgot-otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (otp && otp.length === 6) {
                  setStep('forgot-reset');
                }
              }}
            >
              <div className="text-sm text-neutral-400 mb-4">
                Enter the 6-digit OTP sent to <span className="text-white font-medium">{email}</span>
              </div>
              
              <div className="relative">
                <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  placeholder="Enter 6-digit OTP" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors text-sm tracking-widest text-center text-lg"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg px-4 py-3 transition-colors text-sm"
                >
                  Change Email
                </button>
                <button 
                  type="submit" 
                  disabled={otp.length !== 6}
                  className="flex-1 bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50"
                >
                  Verify OTP
                </button>
              </div>
            </motion.form>
          )}

          {step === 'forgot-reset' && (
            /* New Password Input */
            <motion.form
              key="forgot-reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              onSubmit={handleResetPassword}
            >
              <div className="text-sm text-neutral-400 mb-4">
                Set your new password for <span className="text-white font-medium">{email}</span>
              </div>
              
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors text-sm"
                  required
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg px-4 py-3 transition-colors text-sm"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading || newPassword.length < 6}
                  className="flex-1 bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Toggle Forgot Password */}
        {step === 'login' && (
          <button 
            onClick={() => {
              setIsForgot(true);
              setStep('forgot-email');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="mt-6 text-sm text-neutral-400 hover:text-white transition-colors block text-left"
          >
            Forgot Password?
          </button>
        )}
        
        {step !== 'login' && (
          <button 
            onClick={handleCancelForgot}
            className="mt-6 text-sm text-neutral-400 hover:text-white transition-colors block text-left"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}