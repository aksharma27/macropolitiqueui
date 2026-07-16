import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/axiosClient';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data regardless of API success
      localStorage.removeItem('userRole');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      setLoading(false);
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-full transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      title="Logout"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}