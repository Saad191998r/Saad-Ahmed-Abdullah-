import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Bell, ShoppingBag, Star, CheckCircle } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { currentUser, notifications, markNotificationAsRead } = useAppContext();

  if (!currentUser) {
    return <div className="text-center py-20">الرجاء تسجيل الدخول</div>;
  }

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-indigo-600" />
        الإشعارات
      </h1>

      {userNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد إشعارات جديدة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`bg-white p-4 rounded-xl shadow-sm border transition-colors ${
                notification.read ? 'border-gray-100' : 'border-indigo-100 bg-indigo-50/30'
              }`}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="flex gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  notification.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {notification.type === 'order' ? <ShoppingBag className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold ${notification.read ? 'text-gray-900' : 'text-indigo-900'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                  {!notification.read && (
                    <div className="flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        تحديد كمقروء
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
