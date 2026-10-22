import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Download, 
  ShoppingBag, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const { t, language, isRtl } = useLanguage();
  const navigate = useNavigate();

  const [cardHolder, setCardHolder] = useState('Ahmed Developer');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const total = getTotal();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Handle Checkout submission
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (items.length === 0) return;

    setError('');
    setIsProcessing(true);

    try {
      const productIds = items.map((item) => item.id);
      const res = await api.post('/orders/checkout', { product_ids: productIds });

      setOrderResult(res);
      clearCart();
    } catch (err) {
      setError(err.code === 'CHECKOUT_DISABLED' ? t.checkoutDisabledNotice : (err.message || 'فشلت عملية إتمام الطلب. يرجى إعادة المحاولة.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // If purchase completed, show Success & Download links
  if (orderResult) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-8 text-center transition-colors duration-200">
          
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t.orderSuccessTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.orderSuccessSub}
            </p>
          </div>

          {/* Order Details Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">{t.orderNumberLabel}</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {orderResult.order_number}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">المبلغ الإجمالي</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                ${parseFloat(orderResult.total_amount).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">صلاحية الروابط</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                7 أيام (5 تنزيلات)
              </span>
            </div>
          </div>

          {/* Download Items */}
          <div className="space-y-3 text-right">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              مفاتيح التحميل المباشرة:
            </h3>
            <div className="space-y-2">
              {orderResult.downloads?.map((dl) => (
                <div
                  key={dl.token}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {language === 'ar' ? dl.product_title : dl.product_title_en}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {dl.downloads_remaining} مرات متبقية • ينتهي: {dl.expires_at}
                    </p>
                  </div>

                  <a
                    href={dl.download_url}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
                    download
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل مباشر</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Action */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/my-downloads"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-all"
            >
              {t.goToDownloads}
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              العودة للمتجر
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.cartEmpty}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.cartEmptySub}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
        >
          <span>تصفح المتجر الآن</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t.checkoutTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{t.checkoutSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Order Items summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t.orderSummary} ({items.length})</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {items.map((item) => {
                const title = language === 'ar' ? (item.title_ar || item.title) : (item.title_en || item.title);
                return (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.thumbnail_url}
                        alt={title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-950 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{title}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">تنزيل رقمي مباشر (ZIP)</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono flex-shrink-0">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t.cartSubtotal}</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Security Guarantee Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>حماية وتشفير عالي المستوى</span>
            </div>
            <p className="leading-relaxed">
              عملية الشراء مشفرة بتوقيع أمني صارم. بعد إتمام الدفع مباشرة، ستحصل على روابط تحميل فريدة ومحمية ضد الوصول غير المصرح.
            </p>
          </div>
        </div>

        {/* Payment Simulation Form */}
        <div className="lg:col-span-5 p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <CreditCard className="w-4 h-4" />
              <span>{t.paymentMethod}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.paymentNotice}</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-2">
              <p className="font-bold">يرجى تسجيل الدخول قبل إتمام الطلب للتمكن من ربط التنزيلات بحسابك.</p>
              <Link
                to="/login"
                state={{ from: { pathname: '/checkout' } }}
                className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-100"
              >
                تسجيل الدخول الآن
              </Link>
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            
            {/* Cardholder */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.cardHolderName}
              </label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.cardNumber}
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            {/* Expiry & CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.cardExpiry}
                </label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 text-center shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.cardCvc}
                </label>
                <input
                  type="text"
                  required
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="CVC"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 text-center shadow-sm"
                />
              </div>
            </div>

            {/* Pay Button */}
            <button
              id="confirm-checkout-btn"
              type="submit"
              disabled={isProcessing || !isAuthenticated}
              className="w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.orderProcessing}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t.orderBtnPay} (${total.toFixed(2)})</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
