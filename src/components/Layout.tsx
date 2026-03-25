import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, User, Store as StoreIcon, MessageSquare, Bell, MoreVertical, Settings, Shield, HelpCircle, LogOut, Edit2, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx } from 'clsx';

export const Layout: React.FC = () => {
  const { currentUser, cart, chats, messages, notifications, logout, isAuthReady } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadCount = messages.filter(m => m.read === false && m.senderId !== currentUser?.id && chats.some(c => c.id === m.chatId && c.participants.includes(currentUser?.id || ''))).length;
  const unreadNotifications = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/cart', label: 'السلة', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
    { path: '/chat', label: 'الرسائل', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { path: '/notifications', label: 'الإشعارات', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : undefined },
    { path: '/profile', label: 'حسابي', icon: User },
  ];

  if (currentUser?.type === 'seller') {
    navItems.splice(2, 0, { path: '/dashboard', label: 'متجري', icon: StoreIcon });
  }

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/auth');
  };

  const renderMenu = () => {
    if (!currentUser) return null;
    return (
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="h-6 w-6" />
        </button>
        
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 py-2">
              <button 
                onClick={toggleDarkMode}
                className="w-full px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-gray-400" />}
                {isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/profile', { state: { editMode: true } }); }} 
                className="w-full px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Edit2 className="h-4 w-4 text-gray-400" />
                تعديل الملف الشخصي
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                className="w-full px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                الإعدادات
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/privacy'); }}
                className="w-full px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Shield className="h-4 w-4 text-gray-400" />
                الخصوصية والأمان
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/support'); }}
                className="w-full px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                المساعدة والدعم
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
              <button 
                onClick={handleLogout} 
                className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                تسجيل الخروج
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col" dir="rtl">
      {/* Top Navigation (Desktop) */}
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-none hidden md:block sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 ml-8">دكان</Link>
              <nav className="flex items-center space-x-8 space-x-reverse">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname === '/auth');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium relative',
                        isActive && 'text-indigo-600 dark:text-indigo-400'
                      )}
                    >
                      {item.label}
                      {item.badge ? (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              <div className="border-r border-gray-200 dark:border-gray-700 pr-4">
                {renderMenu()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm md:hidden sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">دكان</Link>
          {renderMenu()}
        </div>
      </header>

      {/* Main Content */}
      <main className={clsx("flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4", location.pathname !== '/auth' ? "pb-20 md:pb-8" : "pb-4")}>
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      {location.pathname !== '/auth' && (
        <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
          <div className="flex justify-around items-center h-16">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname === '/auth');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex flex-col items-center justify-center w-full h-full relative',
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.badge ? (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
