import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, LogOut, Package, Store, CreditCard, Save, X, Heart, CheckCircle, Circle, Edit, Upload, Tag } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const Profile: React.FC = () => {
  const { currentUser, logout, orders, updateProfile, products, toggleWishlist, updateOrderStatus, isAuthReady, stores, offers } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(location.state?.editMode || false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      navigate('/auth');
    } else if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditDescription(currentUser.description || '');
      setEditPhone(currentUser.phone || '');
    }
  }, [isAuthReady, currentUser, navigate]);

  useEffect(() => {
    if (location.state?.editMode) {
      setIsEditing(true);
      // Clear the state so it doesn't re-trigger on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (!currentUser) return null;

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      let finalAvatarUrl = currentUser?.avatarUrl;

      if (editAvatar && typeof editAvatar !== 'string') {
        const storageRef = ref(storage, `users/${currentUser?.id}/avatar_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, editAvatar);
        finalAvatarUrl = await getDownloadURL(snapshot.ref);
      }

      await updateProfile({ 
        ...currentUser!, 
        name: editName, 
        email: editEmail,
        description: editDescription,
        phone: editPhone,
        avatarUrl: finalAvatarUrl
      });
      setIsEditing(false);
      setEditAvatar(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء تحديث الملف الشخصي");
    } finally {
      setIsSaving(false);
    }
  };

  const userOrders = orders.filter(o => o.buyerId === currentUser.id);
  const wishlistProducts = products.filter(p => currentUser.wishlist?.includes(p.id));

  const isIncomplete = !currentUser.description || !currentUser.avatarUrl || !currentUser.phone;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Incomplete Profile Banner */}
      {isIncomplete && showBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-amber-100 p-2 rounded-xl">
            <User className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">أكمل ملفك الشخصي</h3>
            <p className="text-xs text-amber-700 mt-1">
              إضافة صورة ووصف ورقم هاتف يساعدك في الحصول على تجربة أفضل وبناء ثقة أكبر مع الآخرين.
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-2 text-xs font-bold text-amber-900 hover:underline"
            >
              تعديل الآن
            </button>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group">
              <div 
                className={`bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-4 border-white shadow-md transition-all ${isEditing ? 'group-hover:opacity-75 cursor-pointer' : ''}`}
              >
                {editAvatar ? (
                  <img src={typeof editAvatar === 'string' ? editAvatar : URL.createObjectURL(editAvatar)} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-10 w-10 text-indigo-600" />
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <Upload className="h-6 w-6" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setEditAvatar(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1 min-w-[200px]">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">الاسم</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="الاسم"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left text-sm"
                      placeholder="البريد الإلكتروني"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left text-sm"
                      placeholder="رقم الهاتف"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نبذة عني</label>
                    <textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-20"
                      placeholder="اكتب نبذة مختصرة عنك..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-900">{currentUser.name}</h1>
                  <p className="text-gray-500 text-sm mb-1" dir="ltr">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-gray-500 text-sm mb-2" dir="ltr">{currentUser.phone}</p>
                  )}
                  {currentUser.description && (
                    <p className="text-gray-600 text-sm mb-2 max-w-md">{currentUser.description}</p>
                  )}
                  <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                    currentUser.type === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {currentUser.type === 'buyer' ? 'حساب مشتري' : 'حساب تاجر'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end md:self-auto">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className={`p-2 ${isSaving ? 'text-gray-400' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors flex items-center gap-1`}
                >
                  <Save className="h-5 w-5" />
                  <span className="hidden md:inline font-medium">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                  <X className="h-5 w-5" />
                  <span className="hidden md:inline font-medium">إلغاء</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1">
                  <Edit className="h-5 w-5" />
                  <span className="hidden md:inline font-medium">تعديل</span>
                </button>
                <button onClick={() => { logout(); navigate('/auth'); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline font-medium">خروج</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist Section */}
      {currentUser.type === 'buyer' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-red-500 fill-current" />
            <h2 className="text-xl font-bold text-gray-900">قائمة الأمنيات</h2>
          </div>
          
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              قائمة الأمنيات فارغة
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlistProducts.map(product => {
                const store = stores.find(s => s.id === product.storeId);
                const activeOffer = offers.find(offer => {
                  if (!offer.isActive) return false;
                  if (offer.storeId !== product.storeId) return false;
                  const now = new Date();
                  const start = new Date(offer.startDate);
                  const end = new Date(offer.endDate);
                  if (now < start || now > end) return false;
                  if (offer.productIds && offer.productIds.length > 0) {
                    return offer.productIds.includes(product.id);
                  }
                  return true;
                });

                const discountedPrice = activeOffer ? (
                  activeOffer.discountType === 'percentage' 
                    ? product.price * (1 - activeOffer.value / 100)
                    : Math.max(0, product.price - activeOffer.value)
                ) : null;

                return (
                  <div key={product.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-colors flex gap-4 relative overflow-hidden">
                    {activeOffer && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {activeOffer.discountType === 'percentage' ? `${activeOffer.value}% خصم` : 'عرض'}
                      </div>
                    )}
                    <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={product.imageUrl || product.images?.[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link to={`/product/${product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 truncate block">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {discountedPrice !== null ? (
                            <>
                              <span className="text-sm font-bold text-red-600">{Math.round(discountedPrice)} د.ع</span>
                              <span className="text-[10px] text-gray-400 line-through">{product.price} د.ع</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-indigo-600">{product.price} د.ع</span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleWishlist(product.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium self-start flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        إزالة من القائمة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Buyer Orders Section */}
      {currentUser.type === 'buyer' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">طلباتي السابقة</h2>
          </div>
          
          {userOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد طلبات سابقة
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-900">رقم الطلب: {order.id.split('_')[2]}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'delivered' ? 'تم التسليم' : 
                       order.status === 'shipped' ? 'تم الشحن' : 
                       order.status === 'processing' ? 'قيد التنفيذ' : 
                       order.status === 'new' ? 'جديد' : 'ملغي'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    التاريخ: {new Date(order.date).toLocaleDateString('ar-SA')}
                  </div>
                  
                  {/* Order Tracking Stepper */}
                  {order.status !== 'cancelled' && (
                    <div className="py-4 px-2">
                      <div className="relative flex items-center justify-between w-full">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500 ${
                          order.status === 'new' ? 'w-[0%]' :
                          order.status === 'processing' ? 'w-[33%]' :
                          order.status === 'shipped' ? 'w-[66%]' :
                          'w-[100%]'
                        }`}></div>

                        {/* Step 1: Order Placed */}
                        <div className="flex flex-col items-center bg-white px-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            ['new', 'processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'bg-green-100 border-green-500 text-green-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <span className="text-xs mt-1 font-medium text-gray-600">تم الطلب</span>
                        </div>

                        {/* Step 2: Processing */}
                        <div className="flex flex-col items-center bg-white px-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            ['processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'bg-green-100 border-green-500 text-green-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            {['processing', 'shipped', 'delivered'].includes(order.status) ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </div>
                          <span className="text-xs mt-1 font-medium text-gray-600">قيد التنفيذ</span>
                        </div>

                        {/* Step 3: Shipped */}
                        <div className="flex flex-col items-center bg-white px-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            ['shipped', 'delivered'].includes(order.status) 
                              ? 'bg-green-100 border-green-500 text-green-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            {['shipped', 'delivered'].includes(order.status) ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </div>
                          <span className="text-xs mt-1 font-medium text-gray-600">تم الشحن</span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="flex flex-col items-center bg-white px-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            order.status === 'delivered' 
                              ? 'bg-green-100 border-green-500 text-green-600' 
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}>
                            {order.status === 'delivered' ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </div>
                          <span className="text-xs mt-1 font-medium text-gray-600">تم التسليم</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <span className="text-gray-600">{order.items.length} منتجات</span>
                    <div className="flex items-center gap-4">
                      {order.status === 'new' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                      <span className="font-bold text-indigo-600">{order.total} د.ع</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seller Quick Links */}
      {currentUser.type === 'seller' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-all flex items-center gap-4 group">
            <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">إدارة المتجر</h3>
              <p className="text-sm text-gray-500">تعديل المنتجات ومتابعة الطلبات</p>
            </div>
          </Link>
          <Link to="/dashboard" state={{ tab: 'subscription' }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-all flex items-center gap-4 group">
            <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-100 transition-colors">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">الاشتراك</h3>
              <p className="text-sm text-gray-500">إدارة اشتراك المتجر</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
