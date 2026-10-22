import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useCartStore } from '../store/useCartStore';
import { 
  ArrowLeft, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Download, 
  FileCheck2, 
  Lock, 
  Clock, 
  Check, 
  Loader2 
} from 'lucide-react';

export default function ProductDetails() {
  const { slug } = useParams();
  const { t, language, isRtl } = useLanguage();
  const { addItem, isInCart } = useCartStore();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });

  const product = data?.product;
  const inCart = product ? isInCart(product.id) : false;

  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextArrow = isRtl ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">جارٍ جلب تفاصيل المنتج الرقمي...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.productNotFound}</h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{t.backToCatalog}</span>
        </Link>
      </div>
    );
  }

  const title = language === 'ar' ? (product.title_ar || product.title) : (product.title_en || product.title);
  const description = language === 'ar' ? (product.description_ar || product.description) : (product.description_en || product.description);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleBuyNow = () => {
    if (!inCart) {
      addItem(product);
    }
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{t.backToCatalog}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Thumbnail Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-2xl aspect-[16/10]">
            <img
              src={product.thumbnail_url}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 inset-x-4 flex justify-between pointer-events-none">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                {t.activeBadge}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {formatSize(product.file_size)}
              </span>
            </div>
          </div>

          {/* Security Notice Card */}
          <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p>{t.secureDownloadNotice}</p>
          </div>
        </div>

        {/* Details & Action Panel */}
        <div className="lg:col-span-5 space-y-8 p-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t.priceCurrency}</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                ${parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                <span>تسليم فوري مضمون</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBuyNow}
              className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <span>{t.buyNow}</span>
              <NextArrow className="w-4 h-4" />
            </button>

            <button
              onClick={() => addItem(product)}
              disabled={inCart}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                inCart
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.inCart}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.addToCart}</span>
                </>
              )}
            </button>
          </div>

          {/* Technical Specifications */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              {t.productSpecs}
            </h3>
            
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 text-slate-600 dark:text-slate-400">
              <span>{t.specFormat}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">ZIP Archive (Signed)</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 text-slate-600 dark:text-slate-400">
              <span>{t.specDelivery}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{t.specInstantDelivery}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40 text-slate-600 dark:text-slate-400">
              <span>{t.specLicense}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{t.specCommercialLicense}</span>
            </div>

            <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
              <span>{t.specCompatibility}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{t.specCompatibilityValue}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
