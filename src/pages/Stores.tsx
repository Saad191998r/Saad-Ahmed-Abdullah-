import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Star, Package, Loader2, Search } from 'lucide-react';

export const Stores: React.FC = () => {
  const { stores, subscriptions, products } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Only show stores with active subscriptions
  const activeStores = useMemo(() => stores.filter(store => {
    const sub = subscriptions.find(s => s.sellerId === store.ownerId);
    return sub?.status === 'active';
  }), [stores, subscriptions]);

  const getStoreRating = (storeId: string) => {
    const storeProducts = products.filter(p => p.storeId === storeId);
    let totalRating = 0;
    let reviewCount = 0;
    storeProducts.forEach(p => {
      if (p.reviews) {
        p.reviews.forEach(r => {
          totalRating += r.rating;
          reviewCount++;
        });
      }
    });
    return reviewCount > 0 ? totalRating / reviewCount : 0;
  };

  const filteredStores = useMemo(() => {
    return activeStores.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [activeStores, searchQuery]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    activeStores.forEach(s => {
      if (s.city) locations.add(s.city);
      else if (s.location) locations.add(s.location);
    });
    return Array.from(locations);
  }, [activeStores]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">جميع المتاجر</h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن متجر..."
              className="w-full px-4 py-2 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>
      </div>
      
      {filteredStores.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          لا توجد متاجر مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredStores.map(store => {
            const storeProductsCount = products.filter(p => p.storeId === store.id).length;
            const storeRating = getStoreRating(store.id);
            
            return (
              <Link key={store.id} to={`/store/${store.id}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 relative shrink-0">
                  <img src={store.coverUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-6 right-4 h-12 w-12 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="p-4 pt-8 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 dark:text-white">{store.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 mb-4">{store.description}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700 mt-auto">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Package className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                      <span>{storeProductsCount} منتجات</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{storeRating > 0 ? storeRating.toFixed(1) : 'جديد'}</span>
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
