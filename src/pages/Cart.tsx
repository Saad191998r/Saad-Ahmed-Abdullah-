import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useBlocker } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Trash2, ShoppingBag, ArrowRight, CreditCard, AlertTriangle } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, placeOrder, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  // Block navigation if cart has items and not submitting order
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      cart.length > 0 && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0 && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart.length, isSubmitting]);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <ShoppingBag className="h-16 w-16 mb-4 text-gray-300" />
        <h2 className="text-xl font-medium mb-2">السلة فارغة</h2>
        <p className="mb-6">لم تقم بإضافة أي منتجات إلى السلة بعد.</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('الرجاء تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }
    setShowConfirmationModal(true);
  };

  const confirmOrderPlacement = () => {
    setIsSubmitting(true);
    // Use setTimeout to ensure state update is processed before navigation
    setTimeout(() => {
      placeOrder(buyerPhone, buyerAddress);
      navigate('/profile');
    }, 0);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-2/3 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">سلة المشتريات</h1>
        {cart.map(item => (
          <div key={item.product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
            <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 truncate block">
                {item.product.name}
              </Link>
              <div className="text-sm text-gray-500 mt-1">الكمية: {item.quantity}</div>
              <div className="font-bold text-indigo-600 mt-1">{item.product.price * item.quantity} د.ع</div>
            </div>
            <button 
              onClick={() => removeFromCart(item.product.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="md:w-1/3">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ملخص الطلب</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{total} د.ع</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>التوصيل</span>
              <span>مجاني</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
              <span>الإجمالي</span>
              <span>{total} د.ع</span>
            </div>
          </div>

          {!isCheckingOut ? (
            <button 
              onClick={() => {
                if (!currentUser) {
                  navigate('/auth');
                } else {
                  setIsCheckingOut(true);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              متابعة الدفع
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-4 border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                بيانات الدفع والتوصيل
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">رقم الهاتف للتواصل</label>
                <input 
                  type="tel" 
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="07xxxxxxxx" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  required 
                  dir="ltr" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">عنوان التوصيل</label>
                <textarea 
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="المدينة، الحي، الشارع..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                  rows={2}
                  required 
                />
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <a 
                  href={`https://wa.me/9647XXXXXXXXX?text=${encodeURIComponent(`مرحباً، أرغب في إتمام طلب شراء المنتجات التالية:\n${cart.map(item => `- ${item.product.name} (الكمية: ${item.quantity})`).join('\n')}\nالإجمالي: ${total} د.ع\n\nالعنوان: ${buyerAddress}\nرقم الهاتف: ${buyerPhone}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  تأكيد الطلب عبر واتساب
                </a>
              </div>
              <button 
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
              >
                إلغاء
              </button>
            </form>
          )}
        </div>
      </div>
      
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الطلب</h3>
              <div className="text-right w-full bg-gray-50 p-4 rounded-xl mb-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">عدد المنتجات:</span>
                  <span className="font-bold">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">الإجمالي:</span>
                  <span className="font-bold text-indigo-600">{total} د.ع</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="mb-1">
                  <span className="text-gray-500 block mb-1">العنوان:</span>
                  <span className="font-medium text-gray-900">{buyerAddress}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">رقم الهاتف:</span>
                  <span className="font-medium text-gray-900" dir="ltr">{buyerPhone}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">سيتم توجيهك إلى واتساب لإتمام الطلب.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                مراجعة
              </button>
              <a 
                href={`https://wa.me/9647XXXXXXXXX?text=${encodeURIComponent(`مرحباً، أرغب في إتمام طلب شراء المنتجات التالية:\n${cart.map(item => `- ${item.product.name} (الكمية: ${item.quantity})`).join('\n')}\nالإجمالي: ${total} د.ع\n\nالعنوان: ${buyerAddress}\nرقم الهاتف: ${buyerPhone}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={confirmOrderPlacement}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-center"
              >
                تأكيد الطلب
              </a>
            </div>
          </div>
        </div>
      )}

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">هل أنت متأكد من المغادرة؟</h3>
              <p className="text-gray-600">لديك منتجات في السلة. إذا غادرت الآن، قد تفقد تقدمك في عملية الشراء.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => blocker.reset()}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                البقاء في السلة
              </button>
              <button 
                onClick={() => blocker.proceed()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                مغادرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
