import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, Star, ChevronLeft, Search, Package } from 'lucide-react';

export const Home: React.FC = () => {
  const { stores, products, subscriptions } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Only show stores with active subscriptions
  const activeStores = stores.filter(store => {
    const sub = subscriptions.find(s => s.sellerId === store.ownerId);
    return sub?.status === 'active';
  });

  const activeStoreIds = activeStores.map(s => s.id);
  const activeProducts = products.filter(p => activeStoreIds.includes(p.storeId));

  const filteredProducts = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStores = activeStores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-indigo-600 dark:bg-indigo-800 rounded-2xl p-6 md:p-12 text-white text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">مرحباً بك في سوق</h1>
        <p className="text-indigo-100 dark:text-indigo-300 mb-8 max-w-xl mx-auto text-lg">اكتشف أفضل المتاجر والمنتجات المحلية في مكان واحد</p>
        
        <div className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتجات أو متاجر..."
            className="w-full px-6 py-4 rounded-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600 shadow-lg text-lg pr-14"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-6 w-6" />
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
              return (
                <Link key={store.id} to={`/store/${store.id}`} className="snap-start shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 relative shrink-0">
                    <img src={store.coverUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-6 right-4 h-12 w-12 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="p-4 pt-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white">{store.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-4 flex-1">{store.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700 mt-auto">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Package className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                        <span>{storeProductsCount} منتجات</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                </Link>
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
                <Link key={product.id} to={`/product/${product.id}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      <span className="truncate">{store?.name}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">{product.name}</h3>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{product.price} د.ع</span>
                    </div>
                  </div>
                </Link>
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
