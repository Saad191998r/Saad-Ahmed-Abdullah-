import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Users, Store, ShoppingBag, CreditCard, TrendingUp, AlertCircle, 
  CheckCircle, XCircle, Search, BarChart2, DollarSign, Package 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { currentUser, stores, users, orders, subscriptions, products, updateStoreStatus } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'subscriptions' | 'payments' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.type !== 'admin') {
    return <div className="text-center py-20">غير مصرح لك بالدخول</div>;
  }

  // Stats Calculation
  const totalSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  
  const activeStores = stores.filter(s => s.status === 'active' || !s.status).length;
  const suspendedStores = stores.filter(s => s.status === 'suspended').length;
  const totalUsers = users.filter(u => u.type === 'buyer').length;
  const totalSellers = users.filter(u => u.type === 'seller').length;

  // Mock Payments Data (derived from subscriptions and orders for demo)
  const payments = [
    ...subscriptions.map(s => ({
      id: `sub_${s.sellerId}`,
      type: 'subscription',
      amount: 25000,
      date: s.renewalDate,
      status: 'completed',
      user: users.find(u => u.id === s.sellerId)?.name || 'Unknown'
    })),
    ...orders.slice(0, 10).map(o => ({
      id: o.id,
      type: 'order',
      amount: o.total,
      date: o.date,
      status: o.status === 'cancelled' ? 'failed' : 'completed',
      user: users.find(u => u.id === o.buyerId)?.name || 'Unknown'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Top Sellers Logic
  const topSellers = stores.map(store => {
    const storeOrders = orders.filter(o => o.storeId === store.id && o.status === 'delivered');
    const revenue = storeOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      ...store,
      revenue,
      ordersCount: storeOrders.length
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top Products Logic
  const topProducts = products.map(product => {
    const soldCount = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((count, order) => {
        const item = order.items.find(i => i.product.id === product.id);
        return count + (item ? item.quantity : 0);
      }, 0);
    return {
      ...product,
      soldCount
    };
  }).sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>النظام يعمل بكفاءة</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: BarChart2 },
          { id: 'stores', label: 'إدارة المتاجر', icon: Store },
          { id: 'subscriptions', label: 'الاشتراكات', icon: Users },
          { id: 'payments', label: 'المدفوعات', icon: CreditCard },
          { id: 'reports', label: 'التقارير', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            className={`pb-4 px-6 font-medium text-sm transition-colors relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
              </div>
              <span className="text-gray-500 font-medium block mb-1">إجمالي الإيرادات</span>
              <div className="text-3xl font-bold text-gray-900">{totalSales} <span className="text-lg text-gray-400">د.ع</span></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <Store className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{activeStores} نشط</span>
              </div>
              <span className="text-gray-500 font-medium block mb-1">المتاجر</span>
              <div className="text-3xl font-bold text-gray-900">{stores.length}</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{totalSellers} تاجر</span>
              </div>
              <span className="text-gray-500 font-medium block mb-1">المستخدمين</span>
              <div className="text-3xl font-bold text-gray-900">{users.length}</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              </div>
              <span className="text-gray-500 font-medium block mb-1">الطلبات</span>
              <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Sellers Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">أفضل التجار أداءً</h3>
              <div className="space-y-4">
                {topSellers.map((store, idx) => (
                  <div key={store.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <span className="font-bold text-gray-400 w-6 text-center">#{idx + 1}</span>
                    <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-500">{store.ordersCount} طلب مكتمل</div>
                    </div>
                    <div className="font-bold text-indigo-600">{store.revenue} د.ع</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">أحدث العمليات المالية</h3>
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${payment.type === 'subscription' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {payment.type === 'subscription' ? <CreditCard className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{payment.user}</div>
                        <div className="text-xs text-gray-500">{payment.type === 'subscription' ? 'تجديد اشتراك' : 'طلب شراء'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{payment.amount} د.ع</div>
                      <div className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text"
                placeholder="بحث عن متجر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">المتجر</th>
                  <th className="p-4 font-medium">المالك</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">المبيعات</th>
                  <th className="p-4 font-medium text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stores
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(store => {
                    const owner = users.find(u => u.id === store.ownerId);
                    const storeRevenue = orders
                      .filter(o => o.storeId === store.id && o.status === 'delivered')
                      .reduce((sum, o) => sum + o.total, 0);
                    
                    return (
                      <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{store.name}</div>
                            <div className="text-xs text-gray-500">{store.location}</div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{owner?.name || 'Unknown'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            store.status === 'suspended' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {store.status === 'suspended' ? 'موقوف' : 'نشط'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{storeRevenue} د.ع</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {store.status === 'suspended' ? (
                              <button 
                                onClick={() => updateStoreStatus(store.id, 'active')}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                              >
                                تفعيل
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateStoreStatus(store.id, 'suspended')}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                إيقاف
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <tr>
                <th className="p-4 font-medium">التاجر</th>
                <th className="p-4 font-medium">تاريخ التجديد</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((sub, idx) => {
                const seller = users.find(u => u.id === sub.sellerId);
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        {seller?.avatarUrl ? (
                          <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{seller?.name.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{seller?.name}</span>
                    </td>
                    <td className="p-4 text-gray-600" dir="ltr">{new Date(sub.renewalDate).toLocaleDateString('en-US')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {sub.status === 'active' ? 'نشط' : 'منتهي'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">25,000 د.ع</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <tr>
                <th className="p-4 font-medium">رقم العملية</th>
                <th className="p-4 font-medium">المستخدم</th>
                <th className="p-4 font-medium">النوع</th>
                <th className="p-4 font-medium">المبلغ</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-500">{payment.id}</td>
                  <td className="p-4 font-medium text-gray-900">{payment.user}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.type === 'subscription' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {payment.type === 'subscription' ? 'اشتراك' : 'طلب شراء'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">{payment.amount} د.ع</td>
                  <td className="p-4 text-gray-600 text-sm">{new Date(payment.date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {payment.status === 'completed' ? 'مكتمل' : 'فشل'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">أكثر المنتجات مبيعاً</h3>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 border border-gray-50 rounded-xl">
                    <span className="font-bold text-gray-400 w-6 text-center">#{idx + 1}</span>
                    <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden shrink-0">
                      <img src={product.imageUrl || product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.price} د.ع</div>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm">
                      {product.soldCount} مبيعة
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">توزيع المستخدمين</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'مشترين', count: totalUsers },
                    { name: 'تجار', count: totalSellers },
                    { name: 'متاجر نشطة', count: activeStores },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
