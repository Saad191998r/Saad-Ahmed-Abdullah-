import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Store, Product, CartItem, Order, Subscription, Review, Chat, Message, Notification as AppNotification, Offer } from '../types';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, updateDoc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppState {
  currentUser: User | null;
  users: User[];
  stores: Store[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  subscriptions: Subscription[];
  chats: Chat[];
  messages: Message[];
  notifications: AppNotification[];
  offers: Offer[];
  isAuthReady: boolean;
}

interface AppContextType extends AppState {
  login: (type: 'buyer' | 'seller') => Promise<void>;
  logout: () => Promise<void>;
  register: (user: User) => Promise<void>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (buyerPhone?: string, buyerAddress?: string) => Promise<void>;
  addStore: (store: Store) => Promise<void>;
  updateStore: (store: Store) => Promise<void>;
  toggleFollowStore: (storeId: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  paySubscription: (sellerId: string) => Promise<void>;
  cancelSubscription: (sellerId: string) => Promise<void>;
  updateProfile: (user: User) => Promise<void>;
  addReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  createChat: (participantId: string, storeId?: string) => Promise<string>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addOffer: (offer: Offer) => Promise<void>;
  updateOffer: (offer: Offer) => Promise<void>;
  deleteOffer: (offerId: string) => Promise<void>;
  toggleOfferStatus: (offerId: string) => Promise<void>;
  incrementStoreViews: (storeId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      setStores(snapshot.docs.map(doc => doc.data() as Store));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stores'));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => doc.data() as Product));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => doc.data() as Order));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubSubscriptions = onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => doc.data() as Subscription));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscriptions'));

    const unsubChats = onSnapshot(collection(db, 'chats'), (snapshot) => {
      setChats(snapshot.docs.map(doc => doc.data() as Chat));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data() as Message));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => doc.data() as AppNotification));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    const unsubOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
      setOffers(snapshot.docs.map(doc => doc.data() as Offer));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'offers'));

    return () => {
      unsubUsers();
      unsubStores();
      unsubProducts();
      unsubOrders();
      unsubSubscriptions();
      unsubChats();
      unsubMessages();
      unsubNotifications();
      unsubOffers();
    };
  }, [isAuthReady]);

  const login = async (type: 'buyer' | 'seller') => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          id: result.user.uid,
          name: result.user.displayName || 'مستخدم جديد',
          email: result.user.email || '',
          type,
          avatarUrl: result.user.photoURL || `https://picsum.photos/seed/${result.user.uid}/100/100`,
          wishlist: []
        };
        await setDoc(doc(db, 'users', result.user.uid), newUser);
        setCurrentUser(newUser);
      } else {
        setCurrentUser(userDoc.data() as User);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const register = async (user: User) => {
    // Handled by login now
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const addNotification = async (userId: string, type: 'order' | 'review', title: string, message: string, relatedId?: string) => {
    try {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: AppNotification = {
        id,
        userId,
        type,
        title,
        message,
        date: new Date().toISOString(),
        read: false,
        relatedId,
      };
      await setDoc(doc(db, 'notifications', id), newNotification);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const placeOrder = async (buyerPhone?: string, buyerAddress?: string) => {
    if (!currentUser || cart.length === 0) return;
    
    const itemsByStore = cart.reduce((acc, item) => {
      if (!acc[item.product.storeId]) acc[item.product.storeId] = [];
      acc[item.product.storeId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    try {
      for (const [storeId, items] of Object.entries(itemsByStore) as [string, CartItem[]][]) {
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newOrder: Order = {
          id: orderId,
          buyerId: currentUser.id,
          storeId,
          items,
          total,
          status: 'new',
          date: new Date().toISOString(),
          buyerPhone,
          buyerAddress,
        };

        await setDoc(doc(db, 'orders', orderId), newOrder);

        const store = stores.find(s => s.id === storeId);
        if (store) {
          await addNotification(store.ownerId, 'order', 'طلب جديد', `لديك طلب جديد بقيمة ${total} د.ع`, orderId);
        }
      }
      clearCart();
      alert('تم إرسال الطلب بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const addStore = async (store: Store) => {
    try {
      await setDoc(doc(db, 'stores', store.id), store);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stores/${store.id}`);
    }
  };

  const updateStore = async (store: Store) => {
    try {
      const storeData = Object.fromEntries(
        Object.entries(store).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'stores', store.id), storeData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${store.id}`);
    }
  };
  
  const toggleFollowStore = async (storeId: string) => {
    if (!currentUser) return;
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;
      
      const followers = store.followers || [];
      const isFollowing = followers.includes(currentUser.id);
      const newFollowers = isFollowing 
        ? followers.filter(id => id !== currentUser.id)
        : [...followers, currentUser.id];
        
      await updateDoc(doc(db, 'stores', storeId), { followers: newFollowers });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${storeId}`);
    }
  };
  
  const addProduct = async (product: Product) => {
    const store = stores.find(s => s.id === product.storeId);
    if (store) {
        const subscription = subscriptions.find(s => s.sellerId === store.ownerId);
        if (!subscription || subscription.status !== 'active') {
            throw new Error('لا يمكنك إضافة منتج لأن اشتراكك غير نشط.');
        }
    }

    try {
      await setDoc(doc(db, 'products', product.id), product);
      
      if (store && store.followers) {
        for (const followerId of store.followers) {
          await addNotification(followerId, 'order', 'منتج جديد', `قام متجر ${store.name} بإضافة منتج جديد: ${product.name}`, product.id);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const productData = Object.fromEntries(
        Object.entries(product).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'products', product.id), productData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      const order = orders.find(o => o.id === orderId);
      if (order && status !== 'new') {
        let statusText = '';
        switch (status) {
          case 'processing': statusText = 'قيد التنفيذ'; break;
          case 'shipped': statusText = 'تم الشحن'; break;
          case 'delivered': statusText = 'تم التسليم'; break;
          case 'cancelled': statusText = 'ملغي'; break;
        }
        
        if (currentUser?.type === 'seller') {
          await addNotification(order.buyerId, 'order', 'تحديث حالة الطلب', `تم تغيير حالة طلبك #${order.id.split('_')[2]} إلى ${statusText}`, order.id);
        }
        
        if (currentUser?.type === 'buyer' && status === 'cancelled') {
          const store = stores.find(s => s.id === order.storeId);
          if (store) {
            await addNotification(store.ownerId, 'order', 'إلغاء طلب', `قام المشتري بإلغاء الطلب #${order.id.split('_')[2]}`, order.id);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const paySubscription = async (sellerId: string) => {
    try {
      const subId = `sub_${sellerId}`;
      const sub: Subscription = {
        sellerId,
        status: 'pending',
        renewalDate: new Date().toISOString()
      };
      await setDoc(doc(db, 'subscriptions', subId), sub);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `subscriptions/sub_${sellerId}`);
    }
  };

  const cancelSubscription = async (sellerId: string) => {
    try {
      const subId = `sub_${sellerId}`;
      await updateDoc(doc(db, 'subscriptions', subId), { status: 'inactive' });
      alert('تم إلغاء الاشتراك بنجاح.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subscriptions/sub_${sellerId}`);
    }
  };

  const updateProfile = async (user: User) => {
    try {
      const userData = Object.fromEntries(
        Object.entries(user).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'users', user.id), userData);
      if (currentUser?.id === user.id) {
        setCurrentUser(user);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const addReview = async (productId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    try {
      const newReview: Review = {
        ...reviewData,
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
      };

      const product = products.find(p => p.id === productId);
      if (product) {
        const updatedReviews = [...(product.reviews || []), newReview];
        await updateDoc(doc(db, 'products', productId), { reviews: updatedReviews });

        const store = stores.find(s => s.id === product.storeId);
        if (store) {
          await addNotification(store.ownerId, 'review', 'تقييم جديد', `تم إضافة تقييم جديد لمنتجك "${product.name}"`, productId);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const sendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return;
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newMessage: Message = {
        id: messageId,
        chatId,
        senderId: currentUser.id,
        text,
        timestamp: new Date().toISOString(),
        read: false,
      };
      await setDoc(doc(db, 'messages', messageId), newMessage);
      await updateDoc(doc(db, 'chats', chatId), { lastMessage: newMessage });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `messages`);
    }
  };

  const createChat = async (participantId: string, storeId?: string) => {
    if (!currentUser) return '';
    try {
      const existingChat = chats.find(c => 
        c.participants.includes(currentUser.id) && 
        c.participants.includes(participantId) &&
        (!storeId || c.storeId === storeId)
      );
      
      if (existingChat) return existingChat.id;

      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newChat: Chat = {
        id: chatId,
        participants: [currentUser.id, participantId],
        storeId,
      };
      
      await setDoc(doc(db, 'chats', chatId), newChat);
      return chatId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats`);
      return '';
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!currentUser) return;
    try {
      const wishlist = currentUser.wishlist || [];
      const isWishlisted = wishlist.includes(productId);
      const newWishlist = isWishlisted 
        ? wishlist.filter(id => id !== productId)
        : [...wishlist, productId];
        
      await updateDoc(doc(db, 'users', currentUser.id), { wishlist: newWishlist });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const addOffer = async (offer: Offer) => {
    try {
      await setDoc(doc(db, 'offers', offer.id), offer);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `offers/${offer.id}`);
    }
  };

  const updateOffer = async (offer: Offer) => {
    try {
      const offerData = Object.fromEntries(
        Object.entries(offer).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'offers', offer.id), offerData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `offers/${offer.id}`);
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      await deleteDoc(doc(db, 'offers', offerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `offers/${offerId}`);
    }
  };

  const toggleOfferStatus = async (offerId: string) => {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
        await updateDoc(doc(db, 'offers', offerId), { isActive: !offer.isActive });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `offers/${offerId}`);
    }
  };

  const incrementStoreViews = async (storeId: string) => {
    try {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        await updateDoc(doc(db, 'stores', storeId), { views: (store.views || 0) + 1 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${storeId}`);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, stores, products, cart, orders, subscriptions, chats, messages, notifications, offers, isAuthReady,
      login, logout, register, addToCart, removeFromCart, clearCart, placeOrder,
      addStore, updateStore, toggleFollowStore, addProduct, updateProduct, deleteProduct, updateOrderStatus,
      paySubscription, cancelSubscription, updateProfile, addReview, sendMessage, createChat, markNotificationAsRead, toggleWishlist,
      addOffer, updateOffer, deleteOffer, toggleOfferStatus, incrementStoreViews
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
