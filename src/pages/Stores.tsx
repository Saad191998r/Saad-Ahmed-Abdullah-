import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Star, Package, Loader2 } from 'lucide-react';

export const Stores: React.FC = () => {
  const { stores, subscriptions, products } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Only show stores with active subscriptions
  const activeStores = stores.filter(store => {
    const sub = subscriptions.find(s => s.sellerId === store.ownerId);
    return sub?.status === 'active';
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري تحميل المتاجر...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">جميع المتاجر</h1>
      
      {activeStores.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          لا توجد متاجر متاحة حالياً
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {activeStores.map(store => {
            const storeProductsCount = products.filter(p => p.storeId === store.id).length;
            
            return (
              <Link key={store.id} to={`/store/${store.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-200 relative shrink-0">
                  <img src={store.coverUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-6 right-4 h-12 w-12 bg-white rounded-full p-1 shadow-md">
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="p-4 pt-8 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900">{store.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2 mb-4">{store.description}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Package className="h-4 w-4 text-indigo-500" />
                      <span>{storeProductsCount} منتجات</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
