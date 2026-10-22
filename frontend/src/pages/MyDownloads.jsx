import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { 
  Download, 
  ShieldCheck, 
  Clock, 
  FileCheck2, 
  AlertTriangle, 
  ShoppingBag, 
  Loader2, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export default function MyDownloads() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [downloadingToken, setDownloadingToken] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-downloads'],
    queryFn: () => api.get('/orders/my-downloads'),
  });

  const downloads = data?.downloads || [];

  const handleDownload = async (item) => {
    if (!item.is_valid) return;

    setDownloadingToken(item.token);

    try {
      // Trigger native browser download directly via endpoint
      const link = document.createElement('a');
      link.href = item.download_url;
      link.setAttribute('download', `${item.slug || 'product'}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh list after brief moment to show updated downloads_remaining
      setTimeout(() => {
        refetch();
        setDownloadingToken(null);
      }, 1500);
    } catch (e) {
      console.error('Download trigger error', e);
      setDownloadingToken(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Download className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>{t.downloadsTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t.downloadsSubtitle}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>تحديث التنزيلات</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">جارٍ جلب مفاتيح التنزيل الآمنة...</p>
        </div>
      ) : isError ? (
        <div className="py-12 p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-center">
          تعذر تحميل قائمة التنزيلات. يرجى إعادة المحاولة لاحقاً.
        </div>
      ) : downloads.length === 0 ? (
        <div className="py-20 text-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
            <Download className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.downloadsEmpty}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.downloadsEmptySub}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>تصفح المتجر</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {downloads.map((item) => {
            const title = language === 'ar' ? (item.title_ar || item.title) : (item.title_en || item.title);
            const isDownloading = downloadingToken === item.token;

            return (
              <div
                key={item.token}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm dark:shadow-xl"
              >
                {/* Product Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <img
                    src={item.thumbnail_url}
                    alt={title}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-950 flex-shrink-0"
                  />
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{item.order_number}</span>
                      <span>•</span>
                      <span>حجم الملف: {formatSize(item.file_size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        ينتهي: {item.expires_at}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800/80">
                  
                  {/* Remaining Counter */}
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-black font-mono ${
                        item.downloads_remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {item.downloads_remaining} / 5
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t.timesRemaining}</span>
                    </div>

                    <div className="mt-1">
                      {item.is_depleted ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                          {t.badgeDepleted}
                        </span>
                      ) : item.is_expired ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          {t.badgeExpired}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          صالح للتحميل
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Download Trigger */}
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={!item.is_valid || isDownloading}
                    className={`py-3 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      item.is_valid
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.downloadStarting}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t.btnDownloadNow}</span>
                      </>
                    )}
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Security Info Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          جميع التنزيلات يتم تسليمها مباشرة عبر روابط تحميل آمنة ومحمية خاصة بحسابك. يمكنك تنزيل ملفاتك حتى 5 مرات خلال فترة الصلاحية بكل سهولة وموثوقية.
        </p>
      </div>

    </div>
  );
}
