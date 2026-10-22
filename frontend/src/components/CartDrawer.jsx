import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useLanguage } from '../context/LanguageContext';
import { X, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, getTotal, clearCart } = useCartStore();
  const { t, language, isRtl } = useLanguage();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const total = getTotal();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={closeCart}
      />

      <div className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} max-w-full flex pl-10`}>
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.cartTitle}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                {items.length}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{t.cartEmpty}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.cartEmptySub}</p>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const title = language === 'ar' ? (item.title_ar || item.title) : (item.title_en || item.title);
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex gap-4 items-center"
                  >
                    <img
                      src={item.thumbnail_url}
                      alt={title}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-950 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</h4>
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-1">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title={t.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 space-y-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t.cartSubtotal}</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                <button
                  id="cart-checkout-btn"
                  onClick={handleCheckout}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
                >
                  <span>{t.cartCheckoutBtn}</span>
                  <ArrowIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {t.cartClear}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
