import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, ShoppingCart, Minus, Plus, AlertCircle, Star, MessageSquare, MessageCircle, CheckCircle, Heart, Share2, UserPlus, UserCheck, ChevronLeft, ChevronRight, Tag, X, ZoomIn } from 'lucide-react';
import { ShareModal } from '../components/ShareModal';
import { motion, AnimatePresence } from 'motion/react';

// Thumbnail Component
const Thumbnail: React.FC<{ src: string; alt: string; onClick: () => void; isActive: boolean }> = ({ src, alt, onClick, isActive }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <button
      onClick={onClick}
      className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
        isActive ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-gray-200'
      }`}
    >
      {!isLoaded && <div className="w-full h-full bg-gray-200 animate-pulse" />}
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        referrerPolicy="no-referrer"
      />
    </button>
  );
};

// FullScreenImageModal Component
const FullScreenImageModal: React.FC<{
  images: string[];
  initialIndex: number;
  onClose: () => void;
}> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20">
          <X className="h-8 w-8" />
        </button>

        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
          <motion.img
            src={images[currentIndex]}
            alt="Full screen"
            className="max-w-full max-h-full object-contain cursor-zoom-in"
            style={{ scale }}
            onClick={() => setScale(scale === 1 ? 2 : 1)}
          />
        </div>

        <div className="h-20 w-full flex gap-2 overflow-x-auto justify-center p-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${idx === currentIndex ? 'border-white' : 'border-transparent opacity-50'}`}
            >
              <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, stores, subscriptions, addToCart, currentUser, orders, addReview, users, createChat, toggleWishlist, toggleFollowStore, offers } = useAppContext();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [rating, setRating] = useState(5);
  // ... (rest of the component)

  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const product = products.find(p => p.id === id);
  const store = product ? stores.find(s => s.id === product.storeId) : null;

  const activeOffer = useMemo(() => {
    if (!product) return null;
    return offers.find(offer => {
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
  }, [product, offers]);

  const discountedPrice = useMemo(() => {
    if (!product || !activeOffer) return null;
    return activeOffer.discountType === 'percentage' 
      ? product.price * (1 - activeOffer.value / 100)
      : Math.max(0, product.price - activeOffer.value);
  }, [product, activeOffer]);
  const subscription = subscriptions.find(s => s.sellerId === store?.ownerId);

  if (!product || !store) {
    return <div className="text-center py-20">المنتج غير موجود</div>;
  }

  const isActive = subscription?.status === 'active';
  const isInWishlist = currentUser?.wishlist?.includes(product.id);

  const handleToggleWishlist = () => {
    if (!currentUser) {
      alert('الرجاء تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `شاهد هذا المنتج الرائع: ${product.name}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      setIsShareModalOpen(true);
    }
  };

  if (!isActive) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10">
        <AlertCircle className="h-12 w-12 mb-2 text-red-400" />
        <h2 className="text-lg font-bold mb-1">المنتج غير متاح حالياً</h2>
        <p>عذراً، لا يمكن شراء هذا المنتج في الوقت الحالي لأن متجره غير متاح.</p>
        <Link to="/" className="mt-4 text-indigo-600 hover:underline font-medium">العودة للرئيسية</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleChat = async () => {
    if (!currentUser) {
      alert('الرجاء تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }
    if (currentUser.id === store.ownerId) {
      alert('لا يمكنك مراسلة نفسك');
      return;
    }
    const chatId = await createChat(store.ownerId, store.id, store.ownerName, store.ownerAvatar);
    navigate(`/chat/${chatId}`);
  };

  const hasPurchased = currentUser && orders.some(o => 
    o.buyerId === currentUser.id && 
    o.status === 'delivered' && 
    o.items.some(i => i.product.id === product.id)
  );

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    addReview(product.id, {
      userId: currentUser.id,
      rating,
      comment
    });
    setComment('');
    setRating(5);
  };

  const averageRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : '0.0';

  const productImages = Array.from(new Set([
    product.imageUrl,
    product.productImage,
    product.image,
    product.picture,
    ...(product.images || [])
  ].filter((img): img is string => !!img)));

  if (productImages.length === 0) {
    productImages.push('https://picsum.photos/seed/product/800/800');
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 flex flex-col bg-gray-50">
          <div className="relative group aspect-square w-full bg-white flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setIsFullScreenOpen(true)}>
            <img 
              src={productImages[currentImageIndex]} 
              alt={`${product.name} ${currentImageIndex + 1}`} 
              className="w-full h-full object-contain transition-all duration-500" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="h-12 w-12 text-white" />
            </div>
            
            {productImages.length > 1 && (
              <>
                {/* Navigation Arrows */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 text-gray-800 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 text-gray-800 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Dots Overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {productImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx)}}
                      className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-indigo-600 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {isFullScreenOpen && (
            <FullScreenImageModal 
              images={productImages} 
              initialIndex={currentImageIndex} 
              onClose={() => setIsFullScreenOpen(false)} 
            />
          )}

          {/* Thumbnail Strip */}
          {productImages.length > 1 && (
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {productImages.map((img, idx) => (
                  <Thumbnail
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    isActive={idx === currentImageIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 md:w-1/2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Link to={`/store/${store.id}`} className="text-sm text-indigo-600 flex items-center gap-2 hover:underline">
              <Store className="h-4 w-4" />
              {store.name}
            </Link>
            {currentUser && currentUser.id !== store.ownerId && (
              <button
                onClick={() => toggleFollowStore(store.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  store.followers?.includes(currentUser.id)
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {store.followers?.includes(currentUser.id) ? (
                  <>
                    <UserCheck className="h-3 w-3" />
                    الغاء المتابعة
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" />
                    متابعة
                  </>
                )}
              </button>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {product.category && (
            <div className="mb-4">
              <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                {product.category === 'electronics' ? 'إلكترونيات' :
                 product.category === 'clothing' ? 'ملابس' :
                 product.category === 'food' ? 'طعام' :
                 product.category === 'home' ? 'منزل' :
                 product.category === 'beauty' ? 'تجميل' :
                 product.category === 'other' ? 'أخرى' : product.category}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="ml-1 font-bold text-gray-900">{averageRating}</span>
            </div>
            <span className="text-gray-500 text-sm">({product.reviews?.length || 0} تقييم)</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              {discountedPrice !== null ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-600">{Math.round(discountedPrice)} د.ع</span>
                  <span className="text-lg text-gray-400 line-through">{product.price} د.ع</span>
                  <div className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {activeOffer?.discountType === 'percentage' ? `${activeOffer.value}% خصم` : 'عرض خاص'}
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-indigo-600">{product.price} د.ع</div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className="p-3 rounded-full transition-colors bg-gray-100 text-gray-400 hover:bg-gray-200"
                title="مشاركة المنتج"
              >
                <Share2 className="h-6 w-6" />
              </button>
              <button 
                onClick={handleToggleWishlist}
                className={`p-3 rounded-full transition-colors ${isInWishlist ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                title={isInWishlist ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        
        <div className="prose prose-sm text-gray-600 mb-8">
          <p>{product.description}</p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">الكمية:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 text-gray-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 text-gray-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 relative">
            {showSuccess && (
              <div className="absolute -top-16 left-0 right-0 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce z-10">
                <CheckCircle className="h-5 w-5" />
                <span>تمت الإضافة للسلة بنجاح!</span>
              </div>
            )}
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              إضافة إلى السلة
            </button>
            <button 
              onClick={handleChat}
              className="px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              title="تواصل مع البائع"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ShareModal 
      isOpen={isShareModalOpen} 
      onClose={() => setIsShareModalOpen(false)} 
      title={product.name}
      text={`شاهد هذا المنتج الرائع: ${product.name}`}
      url={window.location.href}
    />

    {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          التقييمات والمراجعات
        </h2>

        {hasPurchased && (
          <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">أضف تقييمك</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">التقييم</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${star <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">تعليقك</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                rows={3}
                placeholder="شاركنا رأيك في المنتج..."
                required
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
            >
              إرسال التقييم
            </button>
          </form>
        )}

        <div className="space-y-6">
          {!product.reviews || product.reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد تقييمات لهذا المنتج حتى الآن.
            </div>
          ) : (
            product.reviews.map(review => {
              return (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        {review.userAvatar ? (
                          <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                            {review.userName?.charAt(0) || 'م'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{review.userName || 'مستخدم'}</div>
                        <div className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString('ar-SA')}</div>
                      </div>
                    </div>
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
