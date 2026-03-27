import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Package, Plus, Edit, Trash2, TrendingUp, ShoppingBag, CreditCard, CheckCircle, Store as StoreIcon, Settings, Upload, AlertCircle, ArrowLeft, Star, Tag, Calendar, Eye, MessageCircle, AlertTriangle, Square, CheckSquare, ChevronDown } from 'lucide-react';
import { Product, Offer } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ConfirmModal } from '../components/ConfirmModal';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropperModal } from '../components/ImageCropperModal';

export const SellerDashboard: React.FC = () => {
  const { currentUser, stores, products, orders, subscriptions, updateOrderStatus, addStore, addProduct, updateProduct, deleteProduct, updateStore, offers, addOffer, deleteOffer, toggleOfferStatus, paySubscription, cancelSubscription } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'subscription' | 'settings' | 'performance' | 'offers'>(
    (location.state as any)?.tab || 'overview'
  );
  const [confirmCancelOrder, setConfirmCancelOrder] = useState<{ isOpen: boolean; orderId: string | null }>({ isOpen: false, orderId: null });

  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
      // Clear the state so it doesn't re-trigger on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  const [newStoreShippingPolicy, setNewStoreShippingPolicy] = useState('');
  const [newStoreLogo, setNewStoreLogo] = useState<File | string | null>(null);
  const [newStoreCover, setNewStoreCover] = useState<File | string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', desc: '', category: '', images: [] as (string | File)[] });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  
  // Image Cropper State
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [currentCropImage, setCurrentCropImage] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    name: '',
    type: 'discount',
    discountType: 'percentage',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isFollowersOnly: false,
    isActive: true
  });

  useEffect(() => {
    setSelectedOrderIds([]);
  }, [activeTab]);

  const store = useMemo(() => stores.find(s => s.ownerId === currentUser?.id), [stores, currentUser]);

  useEffect(() => {
    if (store && activeTab === 'settings') {
      setNewStoreName(store.name);
      setNewStoreDesc(store.description);
      setNewStorePhone(store.phone || '');
      setNewStoreLocation(store.location || '');
      setNewStoreShippingPolicy(store.shippingPolicy || '');
    }
  }, [store, activeTab]);

  const subscription = useMemo(() => subscriptions.find(s => s.sellerId === currentUser?.id), [subscriptions, currentUser]);
  const storeProducts = useMemo(() => products.filter(p => p.storeId === store?.id), [products, store]);
  const storeOrders = useMemo(() => orders.filter(o => o.storeId === store?.id), [orders, store]);

  const totalSales = useMemo(() => storeOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + order.total, 0), [storeOrders]);

  const salesData = useMemo(() => {
    if (!storeOrders) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = storeOrders.filter(o => o.date.startsWith(date) && o.status !== 'cancelled');
      const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        date: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
        sales,
        orders: dayOrders.length
      };
    });
  }, [storeOrders]);

  const recentOrders = useMemo(() => storeOrders
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5), [storeOrders]);

  if (currentUser?.type !== 'seller') {
    return <div className="text-center py-20">غير مصرح لك بالدخول</div>;
  }
  
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <StoreIcon className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">إنشاء متجرك الأول</h2>
        <p className="text-gray-500 mb-8">أدخل تفاصيل متجرك للبدء في البيع</p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (isSavingStore) return;
          setIsSavingStore(true);
          const storeId = `s_${Date.now()}`;
          let finalLogoUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
          let finalCoverUrl = `https://picsum.photos/seed/${Date.now() + 1}/800/400`;

          if (newStoreLogo && typeof newStoreLogo !== 'string') {
            const storageRef = ref(storage, `stores/${storeId}/logo_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, newStoreLogo);
            finalLogoUrl = await getDownloadURL(snapshot.ref);
          }

          if (newStoreCover && typeof newStoreCover !== 'string') {
            const storageRef = ref(storage, `stores/${storeId}/cover_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, newStoreCover);
            finalCoverUrl = await getDownloadURL(snapshot.ref);
          }

          try {
            await addStore({
              id: storeId,
              ownerId: currentUser!.id,
              name: newStoreName,
              description: newStoreDesc,
              logoUrl: finalLogoUrl,
              coverUrl: finalCoverUrl,
              coverImage: finalCoverUrl,
              phone: newStorePhone,
              location: newStoreLocation,
            });
          } catch (error) {
            console.error("Error creating store:", error);
            alert("حدث خطأ أثناء إنشاء المتجر: " + (error instanceof Error ? error.message : String(error)));
          } finally {
            setIsSavingStore(false);
          }
        }} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شعار المتجر</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setNewStoreLogo(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">صورة الغلاف</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setNewStoreCover(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input 
              type="text" 
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم هاتف المتجر</label>
            <input 
              type="tel" 
              value={newStorePhone}
              onChange={(e) => setNewStorePhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موقع المتجر</label>
            <input 
              type="text" 
              value={newStoreLocation}
              onChange={(e) => setNewStoreLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المتجر</label>
            <textarea 
              value={newStoreDesc}
              onChange={(e) => setNewStoreDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSavingStore}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSavingStore ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <StoreIcon className="h-5 w-5" />
                إنشاء المتجر
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = Array.from(files);
    
    // Filter by size (10MB)
    const validImages = newImages.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validImages.length < newImages.length) {
      alert("بعض الصور تتجاوز الحجم المسموح به (10 ميجابايت) وتم استبعادها.");
    }

    if (newProduct.images.length + validImages.length > 4) {
      alert("يمكنك اختيار 4 صور كحد أقصى للمنتج");
      return;
    }

    // Directly add images to state without cropping for now to ensure it works
    setNewProduct(prev => ({ ...prev, images: [...prev.images, ...validImages] }));
    
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: File) => {
    console.log("handleCropComplete called with:", croppedImage);
    setNewProduct(prev => ({ ...prev, images: [...prev.images, croppedImage] }));
    
    if (cropQueue.length > 0) {
      setCurrentCropImage(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setIsCropperOpen(false);
      setCurrentCropImage(null);
    }
  };

  const handleCropCancel = () => {
    if (cropQueue.length > 0) {
      setCurrentCropImage(cropQueue[0]);
      setCropQueue(prev => prev.slice(1));
    } else {
      setIsCropperOpen(false);
      setCurrentCropImage(null);
    }
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            resolve(new File([blob as Blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleAddProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) {
      alert("يجب إنشاء متجر أولاً");
      return;
    }

    setIsSavingProduct(true);
    try {
      console.log("Starting product save process...");
      const uploadedImageUrls: string[] = [];

      // Handle image uploads
      for (const img of newProduct.images) {
        console.log("Processing image:", img);
        if (typeof img === 'string') {
          uploadedImageUrls.push(img);
        } else {
          try {
            // Compress image before upload
            const compressedImg = await compressImage(img);
            console.log("Image compressed, original size:", img.size, "compressed size:", compressedImg.size);
            
            const storageRef = ref(storage, `products/${Date.now()}_${compressedImg.name}`);
            console.log("Uploading to storage:", storageRef.fullPath);
            
            const snapshot = await uploadBytes(storageRef, compressedImg);
            
            const url = await getDownloadURL(snapshot.ref);
            console.log("Image uploaded, URL:", url);
            uploadedImageUrls.push(url);
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw new Error("فشل رفع الصورة: " + (uploadError instanceof Error ? uploadError.message : String(uploadError)));
          }
        }
      }

      console.log("All images processed, URLs:", uploadedImageUrls);
      const finalImageUrl = uploadedImageUrls.length > 0 
        ? uploadedImageUrls[0] 
        : `https://picsum.photos/seed/${Date.now()}/400/400`;

      if (editingProduct) {
        console.log("Updating existing product...");
        await updateProduct({
          ...editingProduct,
          name: newProduct.name,
          price: Number(newProduct.price),
          description: newProduct.desc,
          category: newProduct.category,
          images: uploadedImageUrls,
          imageUrl: finalImageUrl,
          productImage: finalImageUrl,
          image: finalImageUrl,
          picture: finalImageUrl
        });
        setEditingProduct(null);
      } else {
        console.log("Adding new product...");
        await addProduct({
          id: `p_${Date.now()}`,
          storeId: store.id,
          name: newProduct.name,
          price: Number(newProduct.price),
          description: newProduct.desc,
          category: newProduct.category,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [finalImageUrl],
          imageUrl: finalImageUrl,
          productImage: finalImageUrl,
          image: finalImageUrl,
          picture: finalImageUrl
        });
      }
      
      console.log("Product saved successfully.");
      alert("تم حفظ المنتج بنجاح!");
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: '', desc: '', category: '', images: [] });
    } catch (error) {
      console.error("Error saving product:", error);
      // More descriptive error alert
      alert("خطأ أثناء الحفظ: " + (error instanceof Error ? error.message : String(error)) + "\n\nيرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      desc: product.description,
      category: product.category || '',
      images: product.images
    });
    setIsAddingProduct(true);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
  };

  const handleBulkStatusUpdate = async (newStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    if (selectedOrderIds.length === 0) return;
    
    setIsBulkUpdating(true);
    try {
      await Promise.all(selectedOrderIds.map(id => updateOrderStatus(id, newStatus)));
      setSelectedOrderIds([]);
      alert(`تم تحديث حالة ${selectedOrderIds.length} طلبات بنجاح`);
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      alert("حدث خطأ أثناء تحديث الطلبات");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === storeOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(storeOrders.map(o => o.id));
    }
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  const handleToggleFeatured = (productId: string) => {
    if (!store) return;
    
    const currentFeatured = store.featuredProductIds || [];
    const isFeatured = currentFeatured.includes(productId);
    
    let newFeatured;
    if (isFeatured) {
      newFeatured = currentFeatured.filter(id => id !== productId);
    } else {
      newFeatured = [...currentFeatured, productId];
    }
    
    updateStore({
      ...store,
      featuredProductIds: newFeatured
    });
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || isSavingStore) return;

    setIsSavingStore(true);
    try {
      let finalLogoUrl = store.logoUrl;
      let finalCoverUrl = store.coverUrl;

      if (newStoreLogo && typeof newStoreLogo !== 'string') {
        const storageRef = ref(storage, `stores/${store.id}/logo_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, newStoreLogo);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      if (newStoreCover && typeof newStoreCover !== 'string') {
        const storageRef = ref(storage, `stores/${store.id}/cover_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, newStoreCover);
        finalCoverUrl = await getDownloadURL(snapshot.ref);
      }

      await updateStore({
        ...store,
        name: newStoreName || store.name,
        description: newStoreDesc || store.description,
        phone: newStorePhone || store.phone,
        location: newStoreLocation || store.location,
        shippingPolicy: newStoreShippingPolicy || store.shippingPolicy,
        logoUrl: finalLogoUrl,
        coverUrl: finalCoverUrl,
        coverImage: finalCoverUrl,
      });
      
      alert('تم حفظ المعلومات بنجاح');
      setNewStoreLogo(null);
      setNewStoreCover(null);
      navigate('/');
    } catch (error) {
      console.error("Error updating store:", error);
      alert("حدث خطأ أثناء تحديث المتجر: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    addOffer({
      id: `off_${Date.now()}`,
      storeId: store.id,
      name: newOffer.name || 'عرض جديد',
      type: newOffer.type as 'discount' | 'coupon',
      discountType: newOffer.discountType as 'percentage' | 'fixed',
      value: Number(newOffer.value),
      code: newOffer.code,
      startDate: newOffer.startDate || new Date().toISOString(),
      endDate: newOffer.endDate || new Date().toISOString(),
      isFollowersOnly: newOffer.isFollowersOnly || false,
      isActive: true,
      productIds: [] // For now, store-wide
    });

    setIsAddingOffer(false);
    setNewOffer({
      name: '',
      type: 'discount',
      discountType: 'percentage',
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isFollowersOnly: false,
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المتجر</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
          subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 
          subscription?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
        }`}>
          {subscription?.status === 'active' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>اشتراك نشط</span>
            </>
          ) : subscription?.status === 'pending' ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>قيد الانتظار</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>اشتراك غير نشط</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          نظرة عامة
          {activeTab === 'overview' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'products' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('products')}
        >
          المنتجات
          {activeTab === 'products' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'orders' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('orders')}
        >
          الطلبات
          {activeTab === 'orders' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'subscription' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('subscription')}
        >
          الاشتراك
          {activeTab === 'subscription' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'performance' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('performance')}
        >
          الأداء والتقارير
          {activeTab === 'performance' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'offers' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('offers')}
        >
          العروض والخصومات
          {activeTab === 'offers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('settings')}
        >
          إعدادات المتجر
          {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <StoreIcon className="h-10 w-10 text-indigo-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">مرحباً، {store.name} 👋</h2>
                <p className="text-gray-500 mt-1">إليك نظرة عامة على أداء متجرك اليوم.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveTab('products')}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Package className="h-4 w-4" />
                إدارة المنتجات
              </button>
              <button 
                onClick={() => {
                  if (subscription?.status !== 'active') {
                    setActiveTab('subscription');
                    return;
                  }
                  setActiveTab('products');
                  setIsAddingProduct(true);
                }}
                className={`${subscription?.status !== 'active' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm`}
              >
                {subscription?.status !== 'active' ? <CreditCard className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {subscription?.status !== 'active' ? 'اشترك لإضافة منتجات' : 'منتج جديد'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% هذا الأسبوع</span>
                </div>
                <span className="text-gray-500 font-medium block mb-1">إجمالي المبيعات</span>
                <div className="text-3xl font-bold text-gray-900">{totalSales} <span className="text-lg text-gray-400 font-medium">د.ع</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{storeOrders.filter(o => o.status === 'new').length} طلب جديد</span>
                </div>
                <span className="text-gray-500 font-medium block mb-1">إجمالي الطلبات</span>
                <div className="text-3xl font-bold text-gray-900">{storeOrders.length}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">نشط حالياً</span>
                </div>
                <span className="text-gray-500 font-medium block mb-1">المنتجات</span>
                <div className="text-3xl font-bold text-gray-900">{storeProducts.length}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                    <Eye className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">مشاهدات المتجر</span>
                </div>
                <span className="text-gray-500 font-medium block mb-1">عدد الزيارات</span>
                <div className="text-3xl font-bold text-gray-900">{store.views || 0}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">أداء المبيعات</h3>
                <select className="text-sm border-gray-200 rounded-lg text-gray-500 outline-none focus:border-indigo-500">
                  <option>آخر 7 أيام</option>
                  <option>آخر 30 يوم</option>
                  <option>هذا العام</option>
                </select>
              </div>
              <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">أحدث الطلبات</h3>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  عرض الكل
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>لا توجد طلبات حديثة</p>
                  </div>
                ) : (
                  recentOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50 hover:border-gray-100">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        order.status === 'new' ? 'bg-yellow-100 text-yellow-600' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-gray-900 text-sm">#{order.id.split('_')[2]}</span>
                          <span className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 truncate">{order.buyerPhone || 'عميل'}</span>
                          <span className="font-bold text-indigo-600 text-sm">{order.total} د.ع</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  إدارة جميع الطلبات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          {subscription?.status !== 'active' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-4 mb-6">
              <div className="bg-orange-100 p-2 rounded-full shrink-0">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-orange-800 font-bold mb-1">الاشتراك غير نشط</h3>
                <p className="text-orange-700 text-sm mb-3">
                  عذراً، لا يمكنك إضافة منتجات جديدة لأن اشتراكك الحالي غير نشط. يرجى تجديد الاشتراك للتمتع بكافة مزايا المتجر.
                </p>
                <button 
                  onClick={() => setActiveTab('subscription')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  تجديد الاشتراك
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button 
              onClick={() => setIsAddingProduct(true)}
              disabled={subscription?.status !== 'active'}
              className={`${subscription?.status !== 'active' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors`}
            >
              <Plus className="h-4 w-4" /> إضافة منتج
            </button>
          </div>

          {isAddingProduct && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                    <input 
                      type="text" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر (د.ع)</label>
                    <input 
                      type="number" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنتج</label>
                  <textarea 
                    value={newProduct.desc}
                    onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                  <input 
                    type="text" 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="مثال: إلكترونيات، ملابس..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">صور المنتج (الحد الأقصى 4 صور، 10 ميجابايت للصورة)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {console.log("newProduct.images:", newProduct.images)}
                    {newProduct.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                        <img 
                          src={typeof img === 'string' ? img : URL.createObjectURL(img as File)} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {newProduct.images.length < 4 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">إضافة صورة</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                      setNewProduct({ name: '', price: '', desc: '', category: '', images: [] });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingProduct}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingProduct ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      editingProduct ? 'تحديث المنتج' : 'حفظ المنتج'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <tr>
                    <th className="p-4 font-medium">المنتج</th>
                    <th className="p-4 font-medium">السعر</th>
                    <th className="p-4 font-medium text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {storeProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden shrink-0">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="p-4 text-gray-600">{product.price} د.ع</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleToggleFeatured(product.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              store.featuredProductIds?.includes(product.id) 
                                ? 'text-yellow-500 hover:bg-yellow-50' 
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                            }`}
                            title={store.featuredProductIds?.includes(product.id) ? 'إزالة من المميزة' : 'إضافة للمميزة'}
                          >
                            <Star className={`h-4 w-4 ${store.featuredProductIds?.includes(product.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(product)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {storeOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
              لا توجد طلبات حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleSelectAllOrders}
                    className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
                  >
                    {selectedOrderIds.length === storeOrders.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">تحديد الكل ({storeOrders.length})</span>
                </div>
                {selectedOrderIds.length > 0 && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-sm text-gray-500">{selectedOrderIds.length} طلبات محددة</span>
                    <div className="relative group">
                      <select 
                        disabled={isBulkUpdating}
                        onChange={(e) => handleBulkStatusUpdate(e.target.value as any)}
                        className="text-sm font-medium px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 outline-none cursor-pointer hover:bg-indigo-100 transition-colors appearance-none pr-10"
                        defaultValue=""
                      >
                        <option value="" disabled>تحديث الحالة للمحدد</option>
                        <option value="new">جديد</option>
                        <option value="processing">قيد التنفيذ</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                      <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600" />
                    </div>
                  </div>
                )}
              </div>

              {storeOrders.map(order => (
                <div key={order.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${selectedOrderIds.includes(order.id) ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => toggleOrderSelection(order.id)}
                        className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors mt-1"
                      >
                        {selectedOrderIds.includes(order.id) ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">رقم الطلب: {order.id.split('_')[2]}</div>
                        <div className="text-sm text-gray-500 mb-2">{new Date(order.date).toLocaleDateString('ar-SA')}</div>
                        {order.buyerPhone && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">رقم التواصل:</span> <span dir="ltr">{order.buyerPhone}</span>
                          </div>
                        )}
                        {order.buyerAddress && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">العنوان:</span> {order.buyerAddress}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border outline-none ${
                          order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'new' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <option value="new">جديد</option>
                        <option value="processing">قيد التنفيذ</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                      {order.status !== 'cancelled' && (
                        <button 
                          onClick={() => setConfirmCancelOrder({ isOpen: true, orderId: order.id })}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-4">
                    <div className="text-sm text-gray-600 mb-4 font-medium">تفاصيل المنتجات:</div>
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                          <div className="h-12 w-12 rounded bg-white overflow-hidden shrink-0 border border-gray-100">
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{item.product.name}</h4>
                            <div className="text-xs text-gray-500 mt-1">
                              السعر: {item.product.price} د.ع | الكمية: {item.quantity}
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <div className="text-xs text-gray-500 mb-1">الإجمالي الفرعي</div>
                            <div className="text-sm font-bold text-gray-900">{item.product.price * item.quantity} د.ع</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-base font-bold text-gray-900">الإجمالي النهائي</span>
                      <span className="text-lg font-bold text-indigo-600">{order.total} د.ع</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">اشتراك التاجر</h2>
            <p className="text-gray-500 mb-8">تمتع بكافة مزايا البيع وإدارة المتجر باشتراك شهري قدره 10,000 دينار عراقي</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-right">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-700 font-medium">حالة الاشتراك</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 
                  subscription?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {subscription?.status === 'active' ? 'نشط' : 
                   subscription?.status === 'pending' ? 'قيد الانتظار' : 'غير نشط'}
                </span>
              </div>
              {subscription?.status === 'active' && (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">الأيام المتبقية</span>
                      <span className="font-bold text-indigo-600">{Math.max(0, Math.ceil((new Date(subscription.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} يوم</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (Math.max(0, Math.ceil((new Date(subscription.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) / 30) * 100)}%` }}></div>
                    </div>
                  </div>

                  {Math.max(0, Math.ceil((new Date(subscription.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) <= 2 && (
                    <button 
                      onClick={() => {
                        paySubscription(currentUser!.id);
                        window.open('https://wa.me/9647819741646', '_blank');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors mt-4"
                    >
                      تجديد الاشتراك
                    </button>
                  )}
                </>
              )}
              {subscription?.status === 'pending' && (
                <div className="text-yellow-700 font-bold py-3">طلبك قيد الانتظار، سيتم تفعيله قريباً من قبل الإدارة.</div>
              )}
              {subscription?.status !== 'active' && subscription?.status !== 'pending' && (
                <button 
                  onClick={() => {
                    paySubscription(currentUser!.id);
                    window.open('https://wa.me/9647819741646', '_blank');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors mt-4"
                >
                  اشترك الآن (10,000 د.ع)
                </button>
              )}
            </div>

            <div className="space-y-4 text-right mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-gray-700">إضافة عدد غير محدود من المنتجات</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-gray-700">استقبال الطلبات وإدارتها</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-gray-700">إحصائيات وتقارير المبيعات</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
            </div>
          </div>
        </div>
      )}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          {/* Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 font-medium mb-2">إجمالي المبيعات</h3>
              <div className="text-3xl font-bold text-gray-900">{totalSales} <span className="text-lg text-gray-400">د.ع</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 font-medium mb-2">عدد الطلبات المكتملة</h3>
              <div className="text-3xl font-bold text-gray-900">{storeOrders.filter(o => o.status === 'delivered').length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 font-medium mb-2">متوسط التقييم</h3>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {(() => {
                  const allReviews = storeProducts.flatMap(p => p.reviews || []);
                  const avg = allReviews.length > 0 
                    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) 
                    : '0.0';
                  return (
                    <>
                      {avg}
                      <Star className="h-6 w-6 text-yellow-500 fill-current" />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Products Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">المنتجات الأكثر مبيعاً</h3>
              <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={(() => {
                      const productSales: Record<string, number> = {};
                      storeOrders.forEach(order => {
                        if (order.status !== 'cancelled') {
                          order.items.forEach(item => {
                            productSales[item.product.id] = (productSales[item.product.id] || 0) + item.quantity;
                          });
                        }
                      });
                      return storeProducts
                        .map(p => ({
                          name: p.name,
                          sales: productSales[p.id] || 0,
                        }))
                        .sort((a, b) => b.sales - a.sales)
                        .slice(0, 5);
                    })()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[0, 4, 4, 0]} name="المبيعات" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">أحدث التقييمات</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {(() => {
                  const allReviews = storeProducts.flatMap(p => 
                    (p.reviews || []).map(r => ({ ...r, productName: p.name }))
                  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                   .slice(0, 10);

                  if (allReviews.length === 0) {
                    return <div className="text-center text-gray-500 py-8">لا توجد تقييمات بعد</div>;
                  }

                  return allReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{review.productName}</div>
                          <div className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString('ar-SA')}</div>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">العروض والخصومات</h2>
              <p className="text-gray-500 text-sm">إدارة الخصومات والكوبونات الخاصة بمتجرك</p>
            </div>
            <button 
              onClick={() => setIsAddingOffer(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              عرض جديد
            </button>
          </div>

          {isAddingOffer && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة عرض جديد</h3>
              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم العرض</label>
                    <input 
                      type="text" 
                      value={newOffer.name}
                      onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                      placeholder="مثال: خصم الصيف"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع العرض</label>
                    <select 
                      value={newOffer.type}
                      onChange={(e) => setNewOffer({ ...newOffer, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="discount">خصم مباشر</option>
                      <option value="coupon">كوبون خصم</option>
                    </select>
                  </div>
                </div>

                {newOffer.type === 'coupon' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">كود الكوبون</label>
                    <input 
                      type="text" 
                      value={newOffer.code || ''}
                      onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      required
                      placeholder="SUMMER2024"
                      dir="ltr"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم</label>
                    <select 
                      value={newOffer.discountType}
                      onChange={(e) => setNewOffer({ ...newOffer, discountType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (د.ع)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الخصم</label>
                    <input 
                      type="number" 
                      value={newOffer.value}
                      onChange={(e) => setNewOffer({ ...newOffer, value: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
                    <input 
                      type="date" 
                      value={newOffer.startDate}
                      onChange={(e) => setNewOffer({ ...newOffer, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                    <input 
                      type="date" 
                      value={newOffer.endDate}
                      onChange={(e) => setNewOffer({ ...newOffer, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isFollowersOnly"
                    checked={newOffer.isFollowersOnly}
                    onChange={(e) => setNewOffer({ ...newOffer, isFollowersOnly: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isFollowersOnly" className="text-sm font-medium text-gray-700">
                    حصري للمتابعين فقط
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddingOffer(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                  >
                    حفظ العرض
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.filter(o => o.storeId === store.id).length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد عروض نشطة حالياً</p>
              </div>
            ) : (
              offers.filter(o => o.storeId === store.id).map(offer => (
                <div key={offer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-1 h-full ${offer.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{offer.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          offer.type === 'coupon' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {offer.type === 'coupon' ? 'كوبون' : 'خصم مباشر'}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 mb-1">
                        {offer.value} {offer.discountType === 'percentage' ? '%' : 'د.ع'}
                      </div>
                      {offer.code && (
                        <div className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm inline-block text-gray-700 border border-gray-200 border-dashed">
                          {offer.code}
                        </div>
                      )}
                    </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toggleOfferStatus(offer.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              offer.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={offer.isActive ? 'إيقاف العرض' : 'تفعيل العرض'}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => setOfferToDelete(offer.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف العرض"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(offer.startDate).toLocaleDateString('ar-SA')} - {new Date(offer.endDate).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {offer.isFollowersOnly && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span>حصري للمتابعين فقط</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="h-6 w-6 text-indigo-600" />
              إعدادات المتجر
            </h2>
            <form onSubmit={handleUpdateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شعار المتجر</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewStoreLogo(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة الغلاف</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewStoreCover(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
                <input 
                  type="text" 
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم هاتف المتجر</label>
                <input 
                  type="tel" 
                  value={newStorePhone}
                  onChange={(e) => setNewStorePhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موقع المتجر</label>
                <input 
                  type="text" 
                  value={newStoreLocation}
                  onChange={(e) => setNewStoreLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المتجر</label>
                <textarea 
                  value={newStoreDesc}
                  onChange={(e) => setNewStoreDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سياسة الشحن والتوصيل</label>
                <textarea 
                  value={newStoreShippingPolicy}
                  onChange={(e) => setNewStoreShippingPolicy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="أدخل تفاصيل الشحن والتوصيل الخاصة بمتجرك..."
                />
              </div>
              <button 
                type="submit"
                disabled={isSavingStore}
                className={`w-full ${isSavingStore ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 rounded-xl transition-colors mt-4`}
              >
                {isSavingStore ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
      />
      <ConfirmModal 
        isOpen={isCancellingSubscription}
        onClose={() => setIsCancellingSubscription(false)}
        onConfirm={() => {
          cancelSubscription(currentUser!.id);
          setIsCancellingSubscription(false);
        }}
        title="تأكيد إلغاء الاشتراك"
        message="هل أنت متأكد من رغبتك في إلغاء الاشتراك؟ لن تتمكن من إضافة منتجات جديدة أو استقبال طلبات."
      />
      <ConfirmModal 
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={() => {
          if (offerToDelete) {
            deleteOffer(offerToDelete);
            setOfferToDelete(null);
          }
        }}
        title="حذف العرض"
        message="هل أنت متأكد أنك تريد حذف هذا العرض؟"
      />

      <ConfirmModal 
        isOpen={confirmCancelOrder.isOpen}
        onClose={() => setConfirmCancelOrder({ isOpen: false, orderId: null })}
        onConfirm={() => {
          if (confirmCancelOrder.orderId) {
            updateOrderStatus(confirmCancelOrder.orderId, 'cancelled');
          }
        }}
        title="إلغاء الطلب"
        message="هل أنت متأكد أنك تريد إلغاء هذا الطلب؟"
      />

      {isCropperOpen && currentCropImage && (
        <ImageCropperModal
          imageFile={currentCropImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};
