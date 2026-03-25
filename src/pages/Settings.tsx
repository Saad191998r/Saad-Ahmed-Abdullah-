import React, { useState, useEffect } from 'react';
import { Bell, Moon, Globe, Shield, Smartphone } from 'lucide-react';

export const Settings: React.FC = () => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">الإعدادات</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Bell className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">الإشعارات</h3>
              <p className="text-sm text-gray-500">التحكم في تنبيهات التطبيق والرسائل</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">إشعارات الطلبات</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">إشعارات الرسائل</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">العروض الترويجية</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
            </label>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Globe className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">المنطقة</h3>
              <p className="text-sm text-gray-500">تخصيص العملة</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
              <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option>دينار عراقي (IQD)</option>
                <option>دولار أمريكي (USD)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Moon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">المظهر</h3>
              <p className="text-sm text-gray-500">تخصيص ألوان التطبيق</p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <button 
              onClick={() => setIsDarkMode(false)}
              className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium ${!isDarkMode ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              فاتح
            </button>
            <button 
              onClick={() => setIsDarkMode(true)}
              className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium ${isDarkMode ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              داكن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
