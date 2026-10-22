import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Search,
  CheckCircle2,
  Download,
  Clock,
  Check,
  Loader2
} from 'lucide-react';

export default function Home() {
  const { t, language, isRtl } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });

  const products = data?.products || [];

  // Filter products by category tab or search query
  const filteredProducts = products.filter((p) => {
    const title = (language === 'ar' ? (p.title_ar || p.title) : (p.title_en || p.title)).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'books') return p.slug.includes('guide') || p.slug.includes('book');
    if (activeFilter === 'templates') return p.slug.includes('saas') || p.slug.includes('kit');
    if (activeFilter === 'security') return p.slug.includes('security') || p.slug.includes('audit');
    if (activeFilter === 'icons') return p.slug.includes('icon');
    return true;
  });

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 dark:bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[250px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t.heroBadge}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            {t.heroTitlePrefix}{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>{' '}
            {t.heroTitleSuffix}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#store-catalog"
              className="px-8 py-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>{t.heroCtaStore}</span>
              <ArrowIcon className="w-4 h-4" />
            </a>
            <Link
              to="/my-downloads"
              className="px-8 py-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t.heroCtaMyDownloads}</span>
            </Link>
          </div>

          {/* Trust Metric Counters */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">تسليم فوري ومباشر</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">+10,000</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">عملية تنزيل ناجحة</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">+500</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">أصل رقمي متاح</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">24/7</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">دعم فني مستمر</div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.featureInstantTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.featureInstantDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.featureSecurityTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.featureSecurityDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.featureModernTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.featureModernDesc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.featureGuaranteeTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.featureGuaranteeDesc}</p>
          </div>

        </div>
      </section>

      {/* Catalog Section */}
      <section id="store-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.catalogTitle}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.catalogSubtitle}</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث عن منتج...' : 'Search products...'}
              className={`w-full py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm ${
                isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
              }`}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'books', label: t.filterBooks },
            { id: 'templates', label: t.filterTemplates },
            { id: 'security', label: t.filterSecurity },
            { id: 'icons', label: t.filterIcons },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">جارٍ جلب المنتجات الموثوقة...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-6">
            تعذر تحميل المنتجات من الخادم. يرجى التحقق من اتصال السيرفر.
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            لا توجد منتجات تطابق بحثك حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </section>

      {/* Customer Trust & Guarantees Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 shadow-md dark:shadow-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>ضمان الجودة والأمان الرقمي</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                تسوق بثقة مع ضمان التسليم الفوري والحماية الكاملة
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                جميع مشترياتك الرقمية تصلك فوراً بروابط تحميل خاصة ومحمية، مع إمكانية الوصول إلى ملفاتك وتنزيلها في أي وقت عبر حسابك الشخصي بكل سهولة وبدون تعقيدات.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  تسليم فوري ومباشر
                </span>
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ترخيص تجاري معتمد
                </span>
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  روابط تحميل خاصة ومحمية
                </span>
              </div>
            </div>

            {/* Visual Highlights Card */}
            <div className="bg-white/90 dark:bg-slate-950/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">تحميل سريع وموثوق</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">سيرفرات فائقة السرعة لتنزيل الملفات بضغطة زر</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">صلاحية كافية وتنزيلات متعددة</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">إمكانية تنزيل كل منتج حتى 5 مرات خلال 7 أيام</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">حساب محمي وخاص</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">جميع تنزيلاتك محفوظة في لوحة تحكم حسابك الخاصة</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
