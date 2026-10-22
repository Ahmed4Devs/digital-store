import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCartStore } from '../store/useCartStore';
import { ShoppingBag, ArrowRight, ArrowLeft, Download, ShieldCheck, Check } from 'lucide-react';

export default function ProductCard({ product }) {
  const { t, language, isRtl } = useLanguage();
  const { addItem, isInCart } = useCartStore();
  const navigate = useNavigate();

  const title = language === 'ar' ? (product.title_ar || product.title) : (product.title_en || product.title);
  const description = language === 'ar' ? (product.description_ar || product.description) : (product.description_en || product.description);

  const inCart = isInCart(product.id);

  // Format file size nicely
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleBuyNow = () => {
    if (!inCart) {
      addItem(product);
    }
    navigate('/checkout');
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/90 transition-all duration-300 flex flex-col overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      
      {/* Thumbnail Container */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img
          src={product.thumbnail_url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 dark:opacity-100" />
        
        {/* Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            {t.activeBadge}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md">
            <Download className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            {formatSize(product.file_size)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Security Feature tag */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>تشفير مؤقت • 5 محاولات تحميل</span>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <span className="text-xs text-slate-400 block">{t.priceCurrency}</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${parseFloat(product.price).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addItem(product)}
              disabled={inCart}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                inCart
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={inCart ? t.inCart : t.addToCart}
              aria-label={t.addToCart}
            >
              {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </button>

            <button
              onClick={handleBuyNow}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>{t.buyNow}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
