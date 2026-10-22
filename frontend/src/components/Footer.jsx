import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-950/60 backdrop-blur-md mt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200/80 dark:border-slate-800/60">
          
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-white block">
                {t.brandName}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {t.footerDesc}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
            <a href="/" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t.navHome}</a>
            <a href="/store" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t.navStore}</a>
            <a href="/my-downloads" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{t.navMyDownloads}</a>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>{t.footerRights}</p>
        </div>
      </div>
    </footer>
  );
}
