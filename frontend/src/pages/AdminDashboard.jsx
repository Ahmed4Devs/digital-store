import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AdminDashboard({ onNavigate }) {
  const { t, isRTL } = useLanguage();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'audit'
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new product
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    price_cents: 2999,
    status: 'published',
    description_ar: '',
    description_en: '',
    thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, ordersRes, auditRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ stats: null })),
        api.get('/admin/products').catch(() => ({ products: [] })),
        api.get('/admin/orders').catch(() => ({ orders: [] })),
        api.get('/admin/audit-logs').catch(() => ({ audit_logs: [] })),
      ]);

      setStats(statsRes.stats || null);
      setProducts(productsRes.products || []);
      setOrders(ordersRes.orders || []);
      setAuditLogs(auditRes.audit_logs || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل بيانات لوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.post('/admin/products', {
        ...formData,
        price_cents: Number(formData.price_cents),
      });
      setSuccessMsg('تم إنشاء المنتج بنجاح وتوثيقه في سجل التدقيق');
      setShowAddModal(false);
      setFormData({
        title_ar: '',
        title_en: '',
        price_cents: 2999,
        status: 'published',
        description_ar: '',
        description_en: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      });
      loadData();
    } catch (err) {
      setError(err.message || 'تعذر إنشاء المنتج');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await api.put(`/admin/products/${productId}`, { status: newStatus });
      setSuccessMsg('تم تحديث حالة المنتج بنجاح');
      loadData();
    } catch (err) {
      setError(err.message || 'فشل تحديث الحالة');
    }
  };

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedProduct) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = new FormData();
      data.append('file', uploadFile);

      await api.post(`/admin/products/${selectedProduct.id}/assets`, data);
      setSuccessMsg(`تم رفع وتشفير الأصل الرقمي للمنتج (${selectedProduct.title_ar || selectedProduct.title}) بنجاح`);
      setShowUploadModal(false);
      setUploadFile(null);
      loadData();
    } catch (err) {
      setError(err.message || 'فشل رفع الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">غير مصرح بالوصول</h2>
        <p className="text-sm text-slate-500 mt-2">يتطلب هذا القسم صلاحيات مسؤول النظام (Admin).</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.adminTitle}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.adminSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>{t.adminBtnNewProduct}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}
      {successMsg && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">إجمالي المنتجات</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_products}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">({stats.published_products} منشور)</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">الطلبات المكتملة</span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_orders}</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">الإيرادات المحسوبة</span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${stats.total_revenue}</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">العملاء المسجلين</span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_customers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 gap-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'products'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {t.adminTabProducts} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'orders'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {t.adminTabOrders} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'audit'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {t.adminTabAudit} ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">المنتج</th>
                  <th className="px-6 py-4">السعر</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">الأصول الرقمية</th>
                  <th className="px-6 py-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{p.title_ar || p.title}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      ${p.price}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                          p.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : p.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <option value="published">منشور (Published)</option>
                        <option value="draft">مسودة (Draft)</option>
                        <option value="archived">مؤرشف (Archived)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {p.asset_count > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ أصل مرفوع ({p.asset_count})</span>
                      ) : (
                        <span className="text-amber-500 font-medium">قيد الانتظار</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowUploadModal(true);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        رفع أصل رقمي
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">رقم الطلب</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">المبلغ</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">بوابة الدفع</th>
                  <th className="px-6 py-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{o.order_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{o.username}</div>
                      <div className="text-xs text-slate-400">{o.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${o.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {o.provider || 'mock'} ({o.payment_ref || 'OK'})
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{o.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">الحدث (Action)</th>
                  <th className="px-6 py-4">المسؤول</th>
                  <th className="px-6 py-4">الكيان والنتيجة</th>
                  <th className="px-6 py-4">معرف الطلب (Request ID)</th>
                  <th className="px-6 py-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors font-mono text-xs">
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{log.action}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{log.actor_username} ({log.actor_email})</td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900 dark:text-white font-semibold">{log.entity_type} #{log.entity_id}</span>
                      <span className={`mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${log.result === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 select-all">{log.request_id}</td>
                    <td className="px-6 py-4 text-slate-500">{log.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">إضافة منتج رقمي جديد</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  عنوان المنتج (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Product Title (English) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    السعر بالسنت (Minor Units) *
                  </label>
                  <input
                    type="number"
                    required
                    dir="ltr"
                    min="100"
                    step="50"
                    value={formData.price_cents}
                    onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    يساوي ${(Number(formData.price_cents || 0) / 100).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    حالة النشر *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm cursor-pointer"
                  >
                    <option value="published">منشور فوراً (Published)</option>
                    <option value="draft">مسودة خاصة (Draft)</option>
                    <option value="archived">مؤرشف (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  الوصف (بالعربية)
                </label>
                <textarea
                  rows="2"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description (English)
                </label>
                <textarea
                  rows="2"
                  dir="ltr"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  رابط صورة المعاينة (Thumbnail URL)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Asset */}
      {showUploadModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">رفع أصل رقمي محمي</h3>
            <p className="text-xs text-slate-500 mb-6">
              المنتج: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedProduct.title_ar || selectedProduct.title}</span>
            </p>

            <form onSubmit={handleUploadAsset} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  id="asset-upload-input"
                  required
                  accept=".zip,.pdf,.epub,.json"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label htmlFor="asset-upload-input" className="cursor-pointer">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {uploadFile ? (
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block">{uploadFile.name}</span>
                      <span className="text-xs text-slate-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 block">انقر لاختيار ملف الأصل</span>
                      <span className="text-xs text-slate-400">الملفات المدعومة: ZIP, PDF, EPUB (بحد أقصى 100MB)</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadFile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الفحص والتشفير والرفع...' : 'بدء الرفع الآمن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
