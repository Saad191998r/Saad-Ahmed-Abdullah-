import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, ShoppingCart, Minus, Plus, AlertCircle, Star, MessageSquare, MessageCircle, CheckCircle, Heart, Share2 } from 'lucide-react';
import { ShareModal } from '../components/ShareModal';

export const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, stores, subscriptions, addToCart, currentUser, orders, addReview, users, createChat, toggleWishlist } = useAppContext();
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const product = products.find(p => p.id === id);
  const store = product ? stores.find(s => s.id === product.storeId) : null;
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

  const handleChat = () => {
    if (!currentUser) {
      alert('الرجاء تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }
    if (currentUser.id === store.ownerId) {
      alert('لا يمكنك مراسلة نفسك');
      return;
    }
    const chatId = createChat(store.ownerId, store.id);
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

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-gray-100 aspect-square md:aspect-auto">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="p-6 md:w-1/2 flex flex-col">
          <Link to={`/store/${store.id}`} className="text-sm text-indigo-600 flex items-center gap-2 mb-2 hover:underline">
            <Store className="h-4 w-4" />
            {store.name}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="ml-1 font-bold text-gray-900">{averageRating}</span>
            </div>
            <span className="text-gray-500 text-sm">({product.reviews?.length || 0} تقييم)</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="text-3xl font-bold text-indigo-600">{product.price} د.ع</div>
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
              const reviewer = users.find(u => u.id === review.userId);
              return (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{reviewer?.name || 'مستخدم'}</div>
                      <div className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString('ar-SA')}</div>
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
