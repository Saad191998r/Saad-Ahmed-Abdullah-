import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, Store, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const [type, setType] = useState<'buyer' | 'seller' | null>(null);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!type) return;
    try {
      await login(type);
      navigate(type === 'seller' ? '/dashboard' : '/profile');
    } catch (error) {
      console.error('Login failed', error);
      alert('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
      {type && (
        <button 
          onClick={() => setType(null)}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          title="رجوع"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      )}
      
      <div className="text-center mb-8">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          {type === 'seller' ? <Store className="h-8 w-8 text-indigo-600" /> : <User className="h-8 w-8 text-indigo-600" />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {!type ? 'تسجيل الدخول' : (type === 'seller' ? 'تسجيل دخول تاجر' : 'تسجيل دخول مشتري')}
        </h1>
        <p className="text-gray-500 mt-2">
          {!type ? 'الرجاء اختيار نوع الحساب للمتابعة' : 'مرحباً بك في دكان'}
        </p>
      </div>
      
      {!type ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setType('buyer')}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <User className="h-10 w-10 mb-3 text-indigo-600" />
            <span className="font-bold text-lg">مشتري</span>
          </button>
          <button
            onClick={() => setType('seller')}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <Store className="h-10 w-10 mb-3 text-indigo-600" />
            <span className="font-bold text-lg">تاجر</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            تسجيل الدخول باستخدام Google
          </button>
        </div>
      )}
    </div>
  );
};
