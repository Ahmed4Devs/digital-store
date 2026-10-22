import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export default function ForgotPassword({ onNavigate }) {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.message);
      if (res.dev_reset_token) {
        setDevToken(res.dev_reset_token);
      }
    } catch (err) {
      setError(err.message || 'فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/50">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t.forgotTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t.forgotSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-700 dark:text-emerald-300">
            <p>{message}</p>
            {devToken && (
              <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs">
                <span className="font-semibold block mb-1">رمز الاختبار المحلي (Dev Reset Token):</span>
                <code className="break-all font-mono text-indigo-600 dark:text-indigo-400 select-all">{devToken}</code>
                <button
                  type="button"
                  onClick={() => onNavigate('reset-password', { token: devToken })}
                  className="mt-2 block w-full text-center py-1.5 px-3 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors"
                >
                  الانتقال لصفحة تعيين كلمة المرور بهذا الرمز
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
          >
            {loading ? t.orderProcessing : t.btnSendResetLink}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}
