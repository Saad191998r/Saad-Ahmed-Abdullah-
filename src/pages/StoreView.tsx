import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Star, Package, MessageCircle, ShoppingBag } from 'lucide-react';
import { ReviewModal } from '../components/ReviewModal';

export const StoreView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { stores, products, orders, currentUser, addReview, addStoreReview } = useAppContext();
  const [activeTab, setActiveTab] = useState<'products' | 'info' | 'reviews'>('products');
  const [selectedTargetForReview, setSelectedTargetForReview] = useState<{ id: string; name: string; type: 'product' | 'store' } | null>(null);

  const store = useMemo(() => stores.find(s => s.id === id), [stores, id]);
  const storeProducts = useMemo(() => products.filter(p => p.storeId === id), [products, id]);

  const allReviews = useMemo(() => {
    return storeProducts.flatMap(p => p.reviews || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [storeProducts]);

  const averageRating = useMemo(() => {
    if (allReviews.length === 0) return 0;
    const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
    return total / allReviews.length;
  }, [allReviews]);

  const purchasedProducts = useMemo(() => {
    if (!currentUser) return [];
    const userOrders = orders.filter(o => o.buyerId === currentUser.id && o.storeId === id);
    const purchasedIds = new Set(userOrders.flatMap(o => o.items.map(i => i.product.id)));
    return storeProducts.filter(p => purchasedIds.has(p.id));
  }, [currentUser, orders, storeProducts, id]);

  if (!store) return <div>المتجر غير موجود</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <img src={store.logoUrl} alt={store.name} className="w-20 h-20 rounded-full object-cover" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({allReviews.length} تقييم)</span>
            </div>
          </div>
          {currentUser && (
            <button 
              onClick={() => setSelectedTargetForReview({ id: store.id, name: store.name, type: 'store' })}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              تقييم المتجر
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {(['products', 'info', 'reviews'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 ${activeTab === tab ? 'border-b-2 border-indigo-600 font-bold' : 'text-gray-500'}`}
          >
            {tab === 'products' ? 'المنتجات' : tab === 'info' ? 'معلومات المتجر' : 'التقييمات'}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold mb-4">منتجات قمت بشرائها</h3>
            {purchasedProducts.length === 0 ? (
              <p className="text-gray-500">لا توجد منتجات قمت بشرائها لتقييمها.</p>
            ) : (
              <div className="space-y-2">
                {purchasedProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span>{p.name}</span>
                    <button 
                      onClick={() => setSelectedTargetForReview({ id: p.id, name: p.name, type: 'product' })}
                      className="text-indigo-600 font-bold"
                    >
                      تقييم المنتج
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {allReviews.map(r => (
              <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <img src={r.userAvatar} alt={r.userName} className="w-8 h-8 rounded-full" />
                  <span className="font-bold">{r.userName}</span>
                  <div className="flex text-yellow-500">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                </div>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTargetForReview && (
        <ReviewModal
          targetId={selectedTargetForReview.id}
          targetName={selectedTargetForReview.name}
          type={selectedTargetForReview.type}
          onClose={() => setSelectedTargetForReview(null)}
          onSubmit={async (rating, comment) => {
            if (selectedTargetForReview.type === 'product') {
              await addReview(selectedTargetForReview.id, { rating, comment });
            } else {
              await addStoreReview(selectedTargetForReview.id, { rating, comment });
            }
            setSelectedTargetForReview(null);
          }}
        />
      )}
    </div>
  );
};
