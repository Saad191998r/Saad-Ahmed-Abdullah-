import React, { useState } from 'react';
import { Shield, Key, Eye, Lock } from 'lucide-react';

export const Privacy: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    // Simulate successful password change
    alert('تم تغيير كلمة المرور بنجاح');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">الخصوصية والأمان</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Key className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">تغيير كلمة المرور</h3>
              <p className="text-sm text-gray-500">تحديث كلمة المرور الخاصة بحسابك</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" 
                required
              />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              حفظ التغييرات
            </button>
          </form>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">المصادقة الثنائية</h3>
              <p className="text-sm text-gray-500">إضافة طبقة حماية إضافية لحسابك</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">تفعيل المصادقة الثنائية (2FA)</span>
            <button 
              onClick={() => setIs2FAEnabled(!is2FAEnabled)}
              className={`${
                is2FAEnabled 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              } px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              {is2FAEnabled ? 'مفعل' : 'تفعيل'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">إعدادات الخصوصية</h3>
              <p className="text-sm text-gray-500">التحكم في من يمكنه رؤية معلوماتك</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">إظهار رقم الهاتف للعامة</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">إظهار البريد الإلكتروني للعامة</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">السماح بمشاركة بياناتي لتحسين الخدمة</span>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" defaultChecked />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
