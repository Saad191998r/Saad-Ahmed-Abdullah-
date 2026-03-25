import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, MapPin, Star, AlertCircle, Phone, Users, UserPlus, UserCheck, MessageCircle, CheckCircle, ChevronLeft, ChevronRight, Share2, ShoppingBag, Truck, Loader2 } from 'lucide-react';
import { ShareModal } from '../components/ShareModal';

export const StoreView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stores, products, subscriptions, users, currentUser, toggleFollowStore, createChat, orders, incrementStoreViews } = useAppContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id) {
      incrementStoreViews(id);
    }
  }, [id]);

  const store = stores.find(s => s.id === id);
  const storeProducts = products.filter(p => p.storeId === id);
  const subscription = subscriptions.find(s => s.sellerId === store?.ownerId);
  const seller = users.find(u => u.id === store?.ownerId);

  // Calculate stats
  const storeOrders = orders.filter(o => o.storeId === id);
  const totalOrders = storeOrders.length;
  
  const allReviews = storeProducts.flatMap(p => p.reviews || []);
  const averageRating = allReviews.length > 0 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) 
    : '0.0';

  const featuredProducts = storeProducts.filter(p => store?.featuredProductIds?.includes(p.id));
  const regularProducts = storeProducts.filter(p => !store?.featuredProductIds?.includes(p.id));

  const images = store ? (store.images && store.images.length > 0 ? store.images : [store.coverUrl]) : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = () => {
    if (!store) return;
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text: `شاهد هذا المتجر الرائع: ${store.name}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      setIsShareModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات المتجر...</p>
      </div>
    );
  }

  if (!store) {
    return <div className="text-center py-20">المتجر غير موجود</div>;
  }

  const isActive = subscription?.status === 'active';
  const isFollowing = currentUser && store.followers?.includes(currentUser.id);

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-48 md:h-64 relative group">
          <img 
            src={images[currentImageIndex]} 
            alt={store.name} 
            className="w-full h-full object-cover transition-opacity duration-500" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-black/20"></div>
          
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end -mt-12 md:-mt-16 mb-4">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg shrink-0">
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {store.name}
                  {isActive && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      موثوق
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Store className="h-4 w-4" /> متجر موثوق</span>
                  <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4 fill-current" /> {averageRating} ({allReviews.length} تقييم)</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {store.followers?.length || 0} متابع</span>
                  <span className="flex items-center gap-1"><ShoppingBag className="h-4 w-4" /> {totalOrders} طلب</span>
                  {store.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {store.location}</span>}
                  {store.phone && (
                    <a href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700" dir="ltr">
                      <Phone className="h-4 w-4" /> {store.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  title="مشاركة المتجر"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="hidden sm:inline">مشاركة</span>
                </button>
                {currentUser && currentUser.id !== store.ownerId && (
                  <>
                    <button
                      onClick={() => {
                        const chatId = createChat(store.ownerId, store.id);
                        navigate(`/chat/${chatId}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">مراسلة</span>
                    </button>
                    <button
                      onClick={() => toggleFollowStore(store.id)}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors ${
                        isFollowing 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-5 w-5" />
                          <span className="hidden sm:inline">الغاء المتابعة</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          <span className="hidden sm:inline">متابعة المتجر</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={store.name}
        text={`شاهد هذا المتجر الرائع: ${store.name}`}
        url={window.location.href}
      />

      {/* Sticky Navigation Tabs */}
      <div className="sticky top-14 md:top-16 z-20 bg-gray-50 pt-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex space-x-6 space-x-reverse border-b border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'products' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            المنتجات
            {activeTab === 'products' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'about' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            عن المتجر
            {activeTab === 'about' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            التقييمات ({allReviews.length})
            {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
        </div>
      </div>

      {!isActive ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 mb-2 text-red-400" />
          <h2 className="text-lg font-bold mb-1">المتجر غير متاح حالياً</h2>
          <p>عذراً، لا يمكن عرض منتجات هذا المتجر في الوقت الحالي.</p>
        </div>
      ) : (
        <div className="mt-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">وصف المتجر</h3>
                <p className="text-gray-600 leading-relaxed">{store.description}</p>
              </div>
              
              {seller && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">عن التاجر</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {seller.avatarUrl ? (
                        <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-2xl">
                          {seller.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{seller.name}</div>
                      {seller.description && <div className="text-sm text-gray-600 mt-1">{seller.description}</div>}
                    </div>
                  </div>
                </div>
              )}

              {store.shippingPolicy && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
                    <Truck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">سياسة الشحن والتوصيل</h3>
                    <p className="text-gray-600 leading-relaxed">{store.shippingPolicy}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="text-5xl font-bold text-gray-900">{averageRating}</div>
                <div>
                  <div className="flex text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <div className="text-gray-500 text-sm">بناءً على {allReviews.length} تقييم</div>
                </div>
              </div>

              <div className="space-y-6">
                {allReviews.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">لا توجد تقييمات بعد</div>
                ) : (
                  allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(review => {
                    const product = storeProducts.find(p => p.id === review.productId);
                    return (
                      <div key={review.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-bold text-gray-900">{review.userName}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(review.date).toLocaleDateString('ar-SA')}</div>
                          </div>
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        {product && (
                          <Link to={`/product/${product.id}`} className="inline-flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                            <ShoppingBag className="h-3 w-3" />
                            المنتج: {product.name}
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              {featuredProducts.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    منتجات مميزة
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredProducts.map(product => (
                      <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-xl shadow-sm border-2 border-yellow-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative">
                        <div className="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-sm">
                          مميز
                        </div>
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          <img 
                            src={product.images?.[0] || 'https://picsum.photos/200'} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="font-bold text-indigo-600">{product.price} د.ع</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">جميع المنتجات ({storeProducts.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {regularProducts.map(product => (
                    <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img 
                          src={product.images?.[0] || 'https://picsum.photos/200'} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                        <div className="mt-auto flex justify-between items-center">
                          <span className="font-bold text-indigo-600">{product.price} د.ع</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
