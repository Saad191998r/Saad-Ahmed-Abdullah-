import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, Star, ChevronLeft, Search, Package, Heart, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const { stores, products, subscriptions, currentUser, toggleWishlist, toggleFollowStore } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Only show stores with active subscriptions
  const activeStores = useMemo(() => stores.filter(store => {
    const sub = subscriptions.find(s => s.sellerId === store.ownerId);
    return sub?.status === 'active';
  }), [stores, subscriptions]);

  const activeStoreIds = useMemo(() => activeStores.map(s => s.id), [activeStores]);
  const activeProducts = useMemo(() => products.filter(p => activeStoreIds.includes(p.storeId)), [products, activeStoreIds]);

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

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [activeProducts, searchQuery]);

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-indigo-600 dark:bg-indigo-800 rounded-2xl p-6 md:p-12 text-white text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">مرحباً بك في سوق</h1>
        <p className="text-indigo-100 dark:text-indigo-300 mb-8 max-w-xl mx-auto text-lg">اكتشف أفضل المتاجر والمنتجات المحلية في مكان واحد</p>
        
        <div className="max-w-2xl mx-auto relative flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتجات أو متاجر..."
              className="w-full px-6 py-4 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600 shadow-lg text-lg pr-14"
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-6 w-6" />
            
            {/* Auto-suggestions */}
            {searchQuery && (filteredProducts.length > 0 || filteredStores.length > 0) && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden text-right">
                {filteredStores.slice(0, 3).map(store => (
                  <Link 
                    key={`suggest-store-${store.id}`} 
                    to={`/store/${store.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                  >
                    <Store className="h-5 w-5 text-indigo-500" />
                    <span className="text-gray-900 dark:text-gray-100">{store.name}</span>
                    <span className="text-xs text-gray-500 mr-auto">متجر</span>
                  </Link>
                ))}
                {filteredProducts.slice(0, 5).map(product => (
                  <Link 
                    key={`suggest-product-${product.id}`} 
                    to={`/product/${product.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                  >
                    <Package className="h-5 w-5 text-indigo-500" />
                    <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
                    <span className="text-xs text-gray-500 mr-auto">منتج</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Stores */}
      {filteredStores.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">متاجر مميزة</h2>
            <Link to="/stores" className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
            {filteredStores.map(store => {
              const storeProductsCount = products.filter(p => p.storeId === store.id).length;
              const storeRating = getStoreRating(store.id);
              return (
                <div key={store.id} className="snap-start shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
                  <Link to={`/store/${store.id}`} className="block h-24 bg-gray-200 dark:bg-gray-700 relative shrink-0">
                    <img src={store.coverUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-4 right-3 h-10 w-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </Link>
                  
                  {currentUser && currentUser.id !== store.ownerId && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFollowStore(store.id);
                      }}
                      className={`absolute top-2 left-2 p-1.5 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 ${
                        store.followers?.includes(currentUser.id)
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-white/80 text-gray-400 hover:bg-white hover:text-indigo-600'
                      }`}
                      title={store.followers?.includes(currentUser.id) ? "إلغاء المتابعة" : "متابعة المتجر"}
                    >
                      {store.followers?.includes(currentUser.id) ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  <Link to={`/store/${store.id}`} className="p-3 pt-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xl truncate">{store.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3 flex-1">{store.description}</p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700 mt-auto">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300">
                        <Package className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                        <span>{storeProductsCount} منتجات</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-gray-700 dark:text-gray-200">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{storeRating > 0 ? storeRating.toFixed(1) : 'جديد'}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Products */}
      {filteredProducts.length > 0 ? (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {searchQuery ? 'نتائج البحث' : 'وصل حديثاً'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const store = stores.find(s => s.id === product.storeId);
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  store={store} 
                  currentUser={currentUser} 
                  toggleWishlist={toggleWishlist} 
                />
              );
            })}
          </div>
        </section>
      ) : (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          لم يتم العثور على نتائج للبحث "{searchQuery}"
        </div>
      )}
    </div>
  );
};
