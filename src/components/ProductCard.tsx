import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Heart, Tag } from 'lucide-react';
import { Product, Store as StoreType, User, Offer } from '../types';
import { useAppContext } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  store?: StoreType;
  currentUser: User | null;
  toggleWishlist: (productId: string) => Promise<void>;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, store, currentUser, toggleWishlist }) => {
  const navigate = useNavigate();
  const { offers } = useAppContext();

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
    
    return true; // Store-wide offer
  });

  const discountedPrice = activeOffer ? (
    activeOffer.discountType === 'percentage' 
      ? product.price * (1 - activeOffer.value / 100)
      : Math.max(0, product.price - activeOffer.value)
  ) : null;

  return (
    <Link to={`/product/${product.id}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group relative hover:shadow-md transition-shadow">
      {activeOffer && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 shadow-sm flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {activeOffer.discountType === 'percentage' ? `${activeOffer.value}% خصم` : 'عرض خاص'}
        </div>
      )}
      
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <img 
          src={product.imageUrl || product.images?.[0] || 'https://picsum.photos/seed/product/400/400'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          referrerPolicy="no-referrer" 
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
              navigate('/auth');
              return;
            }
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 left-2 p-2 rounded-full shadow-md transition-all z-10 ${
            currentUser?.wishlist?.includes(product.id)
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart className={`h-4 w-4 ${currentUser?.wishlist?.includes(product.id) ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        {store && (
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 truncate">
            <Store className="h-3 w-3 shrink-0" />
            <span className="truncate">{store.name}</span>
          </div>
        )}
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
        <div className="mt-auto flex flex-col">
          {discountedPrice !== null ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600 dark:text-red-400">{Math.round(discountedPrice)} د.ع</span>
              <span className="text-[10px] text-gray-400 line-through">{product.price} د.ع</span>
            </div>
          ) : (
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{product.price} د.ع</span>
          )}
        </div>
      </div>
    </Link>
  );
};
