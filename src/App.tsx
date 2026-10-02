import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Download,
  Copy,
  Check,
  Lock,
  Send,
  Moon,
  Sun,
  Star,
  ExternalLink,
  Loader2,
  X,
  MessageSquarePlus,
  Share2,
  Sparkles,
  CheckCircle2,
  Menu
} from 'lucide-react';
import {
  VaultFile,
  AppVersionItem,
  HubSettings,
  HubStats,
  AppRequestItem,
  BrokenLinkReportItem,
  formatDateBn,
  getFileExtension
} from './types';
import { AppDownloadFlowPage } from './components/AppDownloadFlowPage';
import { SecretAdminPage } from './components/SecretAdminPage';

function checkIsAdminRoute(): boolean {
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    pathname.endsWith('/saruar_780780') ||
    hash.includes('saruar_780780') ||
    search.includes('saruar_780780')
  );
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminRoute());
  const [isDark, setIsDark] = useState<boolean>(true);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [requests, setRequests] = useState<AppRequestItem[]>([]);
  const [reports, setReports] = useState<BrokenLinkReportItem[]>([]);
  const [settings, setSettings] = useState<HubSettings>({
    brandName: 'TF OFFICIAL',
    brandLogoUrl: '',
    heroBannerUrl: '',
    heroIconUrl: '',
    heroLinks: [],
    popupEnabled: true,
    popupBannerUrl: '',
    popupTitle: 'স্বাগতম আমাদের ওয়েবসাইটে!',
    popupText:
      'সকল নতুন প্রিমিয়াম অ্যাপস ও আপডেট সবার আগে পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।',
    popupButtons: [
      {
        id: 'popup_btn_1',
        label: 'Join Telegram Channel',
        mode: 'link',
        url: 'https://t.me/TF_Official_Channel',
        color: 'violet'
      }
    ],
    tickerEnabled: true,
    tickerLabel: '🔥 নোটিশ',
    tickerText:
      'সকল নতুন প্রিমিয়াম ও আনলকড প্রো অ্যাপস একদম ফ্রিতে ডাউনলোড করুন! কোনো অ্যাপ না পেলে "অ্যাপ রিকোয়েস্ট" বাটনে ক্লিক করে জানান — দ্রুত আপলোড করে দেওয়া হবে।',
    tickerLink: '',
    hubTitle: 'Welcome to',
    hubHighlightText: 'Our Website',
    hubAnnouncement:
      'আমাদের এই ওয়েবসাইট থেকে, সকল ধরনের প্রিমিয়াম ও প্রো অ্যাপস এবং ফাইল সম্পূর্ণ ফ্রিতে ডাউনলোড করতে পারবেন।',
    telegramChannelId: '@TF_Official_Channel',
    telegramChannelUrl: 'https://t.me/TF_Official_Channel',
    allowPublicUpload: false
  });
  const [, setStats] = useState<HubStats>({
    totalFiles: 0,
    totalBytes: 0,
    totalDownloads: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(true);
  const [showNavMenu, setShowNavMenu] = useState<boolean>(false);

  // App Request Modal & Form State
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [reqAppName, setReqAppName] = useState<string>('');
  const [reqVersionNote, setReqVersionNote] = useState<string>('');
  const [reqUserName, setReqUserName] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  // Card Quick Share Modal State
  const [shareModalFile, setShareModalFile] = useState<VaultFile | null>(null);
  const [copiedCardShareLink, setCopiedCardShareLink] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimerRef = useRef<number | null>(null);

  const triggerSearchFeedback = () => {
    setIsSearching(true);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setIsSearching(false);
    }, 420);
  };

  // Selected App for Multi-Step Download Page
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Admin PIN (strictly in-memory; never auto-unlocked)
  const [adminPin, setAdminPin] = useState<string>('');

  // Clipboard & Toast feedback
  const [copiedTelegramId, setCopiedTelegramId] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [pinPromptState, setPinPromptState] = useState<{
    file: VaultFile;
    customUrl?: string;
    customFileName?: string;
    mode?: 'file' | 'link';
  } | null>(null);
  const [pinPromptInput, setPinPromptInput] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  useEffect(() => {
    const onRouteChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  const navigateToAdmin = () => {
    try {
      window.history.pushState({}, '', '/saruar_780780');
    } catch {
      window.location.hash = '#/saruar_780780';
    }
    setIsAdminRoute(true);
  };

  const exitAdminRoute = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
    sessionStorage.removeItem('tf_admin_pin');
    setAdminPin('');
    setIsAdminRoute(false);
  };

  const openAppDownloadPage = (fileId: string) => {
    setActiveFileId(fileId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeAppDownloadPage = () => {
    setActiveFileId(null);
    if (window.location.search.includes('file=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchRepositoryData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setFiles(data.files || []);
      if (Array.isArray(data.requests)) setRequests(data.requests);
      if (Array.isArray(data.reports)) setReports(data.reports);
      if (data.settings) setSettings(data.settings);
      if (data.stats) setStats(data.stats);

      const params = new URLSearchParams(window.location.search);
      const linkedFileId = params.get('file');
      if (linkedFileId && !activeFileId) {
        const exists = (data.files || []).some((f: VaultFile) => f.id === linkedFileId);
        if (exists) setActiveFileId(linkedFileId);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositoryData();
  }, []);

  const handleSubmitAppRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAppName.trim()) return;
    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: reqAppName.trim(),
          versionOrNote: reqVersionNote.trim(),
          requesterName: reqUserName.trim() || 'ভিজিটর'
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.requests)) {
        setRequests(data.requests);
        setReqAppName('');
        setReqVersionNote('');
        showToast('আপনার অ্যাপ রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
        setShowRequestModal(false);
      }
    } catch {
      showToast('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSaveAdminPin = (pin: string) => {
    setAdminPin(pin);
    sessionStorage.removeItem('tf_admin_pin');
  };

  const handleUpdateFile = async (
    id: string,
    patch: {
      title?: string;
      description?: string;
      category?: string;
      isPinned?: boolean;
      thumbnailUrl?: string;
      version?: string;
      badge?: string;
      externalUrl?: string;
      tutorialVideoUrl?: string;
      tutorialVideoTitle?: string;
      versions?: AppVersionItem[];
      modFeatures?: string[];
      screenshots?: string[];
    }
  ) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminPin) headers['X-Admin-Pin'] = adminPin;

      const res = await fetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (res.ok && data.file) {
        setFiles((prev) => prev.map((f) => (f.id === id ? data.file : f)));
        showToast('সফলভাবে আপডেট করা হয়েছে।');
      }
    } catch {
      showToast('নেটওয়ার্ক ত্রুটি ঘটেছে।');
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (adminPin) headers['X-Admin-Pin'] = adminPin;

      const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        fetchRepositoryData(true);
        showToast('ফাইলটি মুছে ফেলা হয়েছে।');
      }
    } catch {
      showToast('নেটওয়ার্ক ত্রুটি ঘটেছে।');
    }
  };

  const triggerFileDownload = async (
    file: VaultFile,
    customUrl?: string,
    customFileName?: string,
    mode?: 'file' | 'link',
    pin?: string
  ) => {
    if (file.hasDownloadPin && !pin) {
      setPinPromptState({ file, customUrl, customFileName, mode });
      setPinPromptInput('');
      return;
    }

    const finalFileName =
      customFileName ||
      file.originalName ||
      `${file.title.replace(/\s+/g, '_')}_${file.version || 'Pro'}.apk`;

    const isFastFileDownload = mode === 'file';

    const queryParts: string[] = [];
    if (pin) queryParts.push(`pin=${encodeURIComponent(pin)}`);
    queryParts.push(`dlName=${encodeURIComponent(finalFileName)}`);
    if (isFastFileDownload) {
      queryParts.push('forceFile=1');
    }
    if (customUrl && customUrl.trim()) {
      queryParts.push(`targetUrl=${encodeURIComponent(customUrl.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `/api/files/${file.id}/download${qs}`;

    if (file.hasDownloadPin && pin) {
      const checkRes = await fetch(url, { method: 'HEAD' });
      if (!checkRes.ok) {
        showToast('ভুল ডাউনলোড পিন! সঠিক পিন প্রদান করুন।');
        return;
      }
    }

    const isExternalLinkMode =
      !isFastFileDownload && Boolean(customUrl && customUrl.trim().startsWith('http'));

    const a = document.createElement('a');
    a.href = url;
    if (!isExternalLinkMode) {
      // Fast Download: Forces direct download into the user's File Manager / Downloads folder
      a.download = finalFileName;
    } else {
      // Direct Download: Opens the external link configured on the button
      a.target = '_blank';
      a.rel = 'noreferrer';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f))
    );
    setPinPromptState(null);
    showToast(
      isExternalLinkMode
        ? 'ডাউনলোড লিংক ওপেন হয়েছে!'
        : `"${finalFileName}" সরাসরি আপনার ফাইল ম্যানেজারে ডাউনলোড শুরু হয়েছে!`
    );
  };

  const handleCopyTelegramId = () => {
    navigator.clipboard.writeText(settings.telegramChannelId || '@TF_Official_Channel');
    setCopiedTelegramId(true);
    showToast(`টেলিগ্রাম চ্যানেল আইডি (${settings.telegramChannelId}) কপি হয়েছে!`);
    setTimeout(() => setCopiedTelegramId(false), 2000);
  };

  const handleSearchChange = (val: string) => {
    const cleaned = val.trim().toLowerCase();
    if (cleaned === 'saruar_780780' || cleaned === '/saruar_780780') {
      setSearchQuery('');
      navigateToAdmin();
      return;
    }
    setSearchQuery(val);
    triggerSearchFeedback();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchQuery.trim().toLowerCase();
    if (cleaned === 'saruar_780780' || cleaned === '/saruar_780780') {
      setSearchQuery('');
      navigateToAdmin();
      return;
    }
    triggerSearchFeedback();
  };

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = files.filter((file) => {
      if (!q) return true;
      return (
        file.title.toLowerCase().includes(q) ||
        file.originalName.toLowerCase().includes(q) ||
        (file.description || '').toLowerCase().includes(q) ||
        (file.version || '').toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }, [files, searchQuery]);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || null,
    [files, activeFileId]
  );

  // Hidden Admin Route
  if (isAdminRoute) {
    return (
      <SecretAdminPage
        files={files}
        requests={requests}
        reports={reports}
        settings={settings}
        adminPin={adminPin}
        onSetAdminPin={handleSaveAdminPin}
        onExitAdmin={exitAdminRoute}
        onRefreshData={() => fetchRepositoryData(true)}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          if (newSettings.popupEnabled !== false) {
            setShowWelcomePopup(true);
          }
        }}
        onUpdateFile={handleUpdateFile}
        onDeleteFile={handleDeleteFile}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDark ? 'bg-[#08080C] text-white' : 'bg-[#F4F6FB] text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'border-zinc-800/80 bg-[#08080C]/90'
            : 'border-slate-200/80 bg-white/90 shadow-xs'
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Circular Brand Logo + Brand Name (No admin link exposed) */}
          <div className="flex items-center gap-2.5">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveFileId(null);
                setSearchQuery('');
              }}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 font-extrabold text-sm text-white shadow-md transition-transform active:scale-95"
            >
              {settings.brandLogoUrl ? (
                <img
                  src={settings.brandLogoUrl}
                  alt={settings.brandName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full border-2 border-violet-500 object-cover"
                />
              ) : (
                'TF'
              )}
            </a>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveFileId(null);
                setSearchQuery('');
              }}
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 bg-clip-text text-base font-extrabold tracking-wide text-transparent sm:text-lg uppercase"
            >
              {settings.brandName || 'TF OFFICIAL'}
            </a>
          </div>

          {/* Right: Theme Toggle + Menu Icon Button at the very end */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                isDark
                  ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="থিম পরিবর্তন করুন"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNavMenu((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-900 text-violet-400 hover:bg-zinc-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="মেনু"
              >
                <Menu className="h-4 w-4" />
              </button>

              {showNavMenu && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl border p-1.5 shadow-2xl z-50 ${
                    isDark ? 'border-zinc-800 bg-[#121217] text-white' : 'border-slate-200 bg-white text-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowNavMenu(false);
                      setShowRequestModal(true);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${
                      isDark ? 'hover:bg-violet-950/50 text-violet-300' : 'hover:bg-violet-50 text-violet-700'
                    }`}
                  >
                    <MessageSquarePlus className="h-4 w-4 text-violet-400" />
                    <span>APP Request</span>
                  </button>

                  <a
                    href={settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowNavMenu(false)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Send className="h-4 w-4 text-[#24A1DE]" />
                    <span>Telegram Channel</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Scrolling Notice Bar / Breaking News Ticker (চলমান নোটিশ বার) */}
      {settings.tickerEnabled !== false && settings.tickerText && (
        <div
          className={`border-b overflow-hidden ${
            isDark
              ? 'border-zinc-800/80 bg-[#0E0E15] text-zinc-200'
              : 'border-slate-200 bg-amber-50/70 text-slate-800'
          }`}
        >
          <div className="mx-auto flex max-w-3xl items-center">
            <div className="z-10 flex shrink-0 items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-[11px] font-extrabold text-black shadow-md sm:px-3.5">
              <span>{settings.tickerLabel || '🔥 নোটিশ'}</span>
            </div>

            <div className="relative flex-1 overflow-hidden py-1.5">
              {settings.tickerLink && settings.tickerLink.trim().startsWith('http') ? (
                <a
                  href={settings.tickerLink.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-ticker-marquee items-center text-xs font-medium hover:text-amber-400"
                >
                  <span className="mx-6 whitespace-nowrap">{settings.tickerText}</span>
                  <span className="mx-6 whitespace-nowrap text-amber-400">•</span>
                  <span className="mx-6 whitespace-nowrap">{settings.tickerText}</span>
                  <span className="mx-6 whitespace-nowrap text-amber-400">•</span>
                </a>
              ) : (
                <div
                  onClick={() => setShowRequestModal(true)}
                  className="animate-ticker-marquee cursor-pointer items-center text-xs font-medium"
                >
                  <span className="mx-6 whitespace-nowrap">{settings.tickerText}</span>
                  <span className="mx-6 whitespace-nowrap text-violet-400">•</span>
                  <span className="mx-6 whitespace-nowrap">{settings.tickerText}</span>
                  <span className="mx-6 whitespace-nowrap text-violet-400">•</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* If an App is selected, show the 2-Step Download Flow Page */}
      {activeFile ? (
        <main className="flex-1">
          <AppDownloadFlowPage
            file={activeFile}
            isDark={isDark}
            settings={settings}
            onBackToHome={closeAppDownloadPage}
            onTriggerDownload={(f, customUrl, customFileName, mode) =>
              triggerFileDownload(f, customUrl, customFileName, mode)
            }
            onReportSubmitted={() => fetchRepositoryData(true)}
            onShowToast={showToast}
          />
        </main>
      ) : (
        /* Main Home Storefront Container */
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {/* Welcome Hero Section: 1. Welcome Text -> 2. Banner Below Welcome -> 3. Direct Link Buttons -> 4. Search Bar */}
          <section className="text-center">
            {/* 1. Customizable Welcome Heading & Subtitle at the Top */}
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              <span className={isDark ? 'text-white' : 'text-slate-900'}>
                {settings.hubTitle || 'Welcome to'}{' '}
              </span>
              <span className="bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                {settings.hubHighlightText || 'Our Website'}
              </span>
            </h1>

            {settings.hubAnnouncement && (
              <p
                className={`mx-auto mt-2.5 max-w-lg text-xs leading-relaxed sm:text-sm ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                {settings.hubAnnouncement}
              </p>
            )}

            {/* 2. Hero Banner Image Placed BELOW Welcome Text (wlc এর নিচে ব্যানার) */}
            {settings.heroBannerUrl && (
              <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-2xl border border-zinc-800/80 shadow-lg">
                <img
                  src={settings.heroBannerUrl}
                  alt={settings.hubTitle || 'Banner'}
                  referrerPolicy="no-referrer"
                  className="max-h-48 w-full object-cover sm:max-h-60"
                />
              </div>
            )}

            {/* 3. Direct Download Style Link Buttons Above Search Bar */}
            {(() => {
              const activeHeroLinks =
                Array.isArray(settings.heroLinks) &&
                settings.heroLinks.filter((b) => b.url && b.url.trim().length > 0).length > 0
                  ? settings.heroLinks.filter((b) => b.url && b.url.trim().length > 0)
                  : settings.heroIconUrl && settings.heroIconUrl.trim().startsWith('http')
                  ? [
                      {
                        id: 'fallback_hero_link',
                        label: 'Direct Download / Join Link',
                        mode: 'link' as const,
                        url: settings.heroIconUrl.trim(),
                        color: 'violet' as const
                      }
                    ]
                  : [];

              if (activeHeroLinks.length === 0) return null;

              const getHeroBtnClass = (color?: string) => {
                switch (color) {
                  case 'emerald':
                    return 'from-emerald-500 to-teal-600 shadow-emerald-600/25';
                  case 'sky':
                    return 'from-sky-500 to-blue-600 shadow-sky-600/25';
                  case 'amber':
                    return 'from-amber-500 to-orange-600 shadow-amber-600/25';
                  case 'violet':
                  default:
                    return 'from-violet-600 to-indigo-600 shadow-violet-600/25';
                }
              };

              return (
                <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2.5">
                  {activeHeroLinks.map((btn, idx) => (
                    <a
                      key={btn.id || idx}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-transform active:scale-[0.99] hover:opacity-95 sm:text-sm ${getHeroBtnClass(
                        btn.color
                      )}`}
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <span>{btn.label || 'Direct Download'}</span>
                    </a>
                  ))}
                </div>
              );
            })()}

            {/* 4. Search Bar ("Search for Apps....." + Purple Search Button + Pulsing & Progress Indicator) */}
            <form
              onSubmit={handleSearchSubmit}
              className={`relative mx-auto mt-4 flex max-w-xl items-center overflow-hidden rounded-xl border p-1 transition-all duration-200 ${
                isSearching
                  ? isDark
                    ? 'border-violet-500/90 bg-[#151520] ring-2 ring-violet-500/25 shadow-lg shadow-violet-600/20'
                    : 'border-violet-500 bg-white ring-2 ring-violet-500/20 shadow-md shadow-violet-500/15'
                  : isDark
                  ? 'border-zinc-800 bg-[#121218] shadow-lg shadow-black/40'
                  : 'border-slate-200 bg-white shadow-md shadow-slate-200/60'
              }`}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search for Apps....."
                className={`w-full bg-transparent px-4 py-2.5 text-xs sm:text-sm focus:outline-none ${
                  isDark
                    ? 'text-white placeholder:text-zinc-500'
                    : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    triggerSearchFeedback();
                  }}
                  aria-label="Clear search"
                  className={`mr-1.5 rounded-full p-1 transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="submit"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95 sm:text-sm ${
                  isSearching ? 'animate-pulse shadow-violet-500/40' : ''
                }`}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>

              {/* Animated Bottom Progress Bar Indicator while filtering */}
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-200 ${
                  isSearching ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-violet-500 via-cyan-400 to-indigo-500" />
              </div>
            </form>

            {/* Subtle Filter Feedback Pill below Search Bar */}
            {(isSearching || searchQuery.trim().length > 0) && (
              <div className="mx-auto mt-2 flex max-w-xl items-center justify-center gap-2 text-[11px] font-medium">
                {isSearching ? (
                  <span className="inline-flex items-center gap-1.5 text-violet-400 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                    রেজাল্ট ফিল্টার করা হচ্ছে...
                  </span>
                ) : (
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                    “<span className="font-semibold text-violet-400">{searchQuery.trim()}</span>” এর জন্য{' '}
                    <span className="font-bold text-emerald-400">{filteredFiles.length}টি</span> ফলাফল পাওয়া গেছে
                  </span>
                )}
              </div>
            )}
          </section>

          {/* 2-Column App Grid (এক সারিতে দুইটা এপস — কোনো ক্যাটাগরি ফিল্টার ছাড়াই সরাসরি অ্যাপস দেখাবে) */}
          <section className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-52 rounded-2xl border p-4 animate-pulse ${
                      isDark ? 'border-zinc-800 bg-[#121218]' : 'border-slate-200 bg-white'
                    }`}
                  />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div
                className={`rounded-2xl border p-12 text-center ${
                  isDark ? 'border-zinc-800 bg-[#121218]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-sm font-semibold">কোনো অ্যাপ বা ফাইল পাওয়া যায়নি</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    triggerSearchFeedback();
                  }}
                  className="mt-3 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-bold text-white"
                >
                  সব অ্যাপ দেখুন
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 gap-3.5 transition-opacity duration-200 sm:gap-5 ${
                  isSearching ? 'opacity-70 animate-pulse' : 'opacity-100'
                }`}
              >
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => openAppDownloadPage(file.id)}
                    className={`group relative flex cursor-pointer flex-col items-center rounded-2xl border p-4 pt-7 text-center transition-all duration-150 hover:-translate-y-0.5 sm:p-5 sm:pt-8 ${
                      isDark
                        ? 'border-zinc-800/90 bg-[#121218] hover:border-violet-500/60 shadow-lg shadow-black/40'
                        : 'border-slate-200/80 bg-white hover:border-violet-400 shadow-sm'
                    }`}
                  >
                    {/* Top-Left Green PRO Badge */}
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                      {file.badge || 'PRO'}
                    </span>

                    {/* Top-Right Quick Share & Lock Icons */}
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                      {file.hasDownloadPin && (
                        <Lock
                          className="h-3.5 w-3.5 text-amber-400"
                          aria-label="পিন সুরক্ষিত"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalFile(file);
                        }}
                        title="শেয়ার করুন"
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-violet-500 hover:text-white'
                            : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Square Rounded App Icon */}
                    <div className="relative mt-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-md sm:h-20 sm:w-20">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 font-mono text-sm font-extrabold text-white sm:text-base">
                          {getFileExtension(file.originalName)}
                        </div>
                      )}
                    </div>

                    {/* App Title */}
                    <h2
                      className={`mt-3 w-full truncate text-xs font-bold sm:text-base ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {file.title}
                    </h2>

                    {/* 5-Star Rating + Version Row */}
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <Star className="h-3 w-3 fill-amber-400" />
                        <Star className="h-3 w-3 fill-amber-400" />
                        <Star className="h-3 w-3 fill-amber-400" />
                        <Star className="h-3 w-3 fill-amber-400" />
                      </div>
                      <span
                        className={`font-mono ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {file.version || 'v1.0'}
                      </span>
                    </div>

                    {/* Mod Feature / Unlocked Pill */}
                    {Array.isArray(file.modFeatures) && file.modFeatures.length > 0 && (
                      <div className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <Sparkles className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{file.modFeatures[0]}</span>
                      </div>
                    )}

                    {/* Download Counter */}
                    <div
                      className={`mt-1 flex items-center justify-center gap-1 font-mono text-[11px] tabular-nums ${
                        isDark ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      <span>{file.downloads}</span>
                    </div>

                    {/* Download Button -> Opens Serial Version Selection Page */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAppDownloadPage(file.id);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 sm:py-2.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>



          {/* Bottom Telegram Channel ID & Link Section */}
          <section
            className={`mt-6 rounded-2xl border p-5 sm:p-6 ${
              isDark ? 'border-zinc-800 bg-[#121218]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#24A1DE]">
                  <Send className="h-3.5 w-3.5" /> OFFICIAL TELEGRAM CHANNEL
                </span>
                <h3
                  className={`mt-1 text-base font-bold sm:text-lg ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  সকল নতুন প্রো অ্যাপস ও আপডেট পেতে টেলিগ্রামে জয়েন করুন
                </h3>
                <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  চ্যানেল আইডি:{' '}
                  <span className="font-mono font-bold text-violet-400">
                    {settings.telegramChannelId || '@TF_Official_Channel'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyTelegramId}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                    isDark
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {copiedTelegramId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> আইডি কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> আইডি কপি করুন
                    </>
                  )}
                </button>

                <a
                  href={settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#24A1DE] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-95 whitespace-nowrap"
                >
                  <Send className="h-3.5 w-3.5" /> Join Telegram{' '}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Footer with Telegram Channel ID Link */}
      <footer
        className={`mt-6 border-t px-4 py-5 text-center text-xs ${
          isDark
            ? 'border-zinc-800/80 bg-[#050508] text-zinc-500'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© 2026 {settings.brandName || 'TF OFFICIAL'} · All Rights Reserved</span>
          <a
            href={settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#24A1DE] hover:underline"
          >
            <Send className="h-3 w-3" /> Telegram: {settings.telegramChannelId}
          </a>
        </div>
      </footer>

      {/* PIN Prompt Modal */}
      {pinPromptState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#121217] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <Lock className="h-5 w-5" />
              <h3 className="text-sm font-semibold">পিন সুরক্ষিত ফাইল</h3>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              <span className="font-semibold text-white">{pinPromptState.file.title}</span> ডাউনলোড করার জন্য পিন কোড লিখুন:
            </p>
            <input
              type="password"
              value={pinPromptInput}
              onChange={(e) => setPinPromptInput(e.target.value)}
              placeholder="পিন কোড..."
              className="mt-3 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-white focus:border-violet-500 focus:outline-none"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPinPromptState(null)}
                className="px-3 py-1.5 text-xs text-zinc-400"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerFileDownload(
                    pinPromptState.file,
                    pinPromptState.customUrl,
                    pinPromptState.customFileName,
                    pinPromptState.mode,
                    pinPromptInput.trim()
                  )
                }
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-white"
              >
                ডাউনলোড করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Entry Popup Modal (সাইটে ঢোকার সময় পপআপ: ব্যানার, টেক্সট এবং নিচে লিংক বাটন) */}
      {!loading &&
        showWelcomePopup &&
        settings.popupEnabled !== false &&
        Boolean(
          settings.popupBannerUrl ||
            settings.popupTitle ||
            settings.popupText ||
            (Array.isArray(settings.popupButtons) && settings.popupButtons.length > 0)
        ) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
            <div
              className={`relative w-full max-w-md overflow-hidden rounded-2xl border p-5 text-center shadow-2xl sm:p-6 ${
                isDark
                  ? 'border-violet-500/40 bg-[#121218] text-white shadow-black/70'
                  : 'border-slate-200 bg-white text-slate-900 shadow-slate-900/20'
              }`}
            >
              {/* Top-Right Close Button */}
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                aria-label="পপআপ বন্ধ করুন"
                className={`absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  isDark
                    ? 'border-zinc-700 bg-black/70 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <X className="h-4 w-4" />
              </button>

              {/* 1. Popup Banner Image (ব্যানার) */}
              {settings.popupBannerUrl && (
                <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800/80 shadow-md">
                  <img
                    src={settings.popupBannerUrl}
                    alt={settings.popupTitle || 'Welcome Banner'}
                    referrerPolicy="no-referrer"
                    className="max-h-52 w-full object-cover"
                  />
                </div>
              )}

              {/* 2. Popup Title & Text (টেক্সট) */}
              {settings.popupTitle && (
                <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
                  <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    {settings.popupTitle}
                  </span>
                </h2>
              )}

              {settings.popupText && (
                <p
                  className={`mt-2 text-xs leading-relaxed sm:text-sm ${
                    isDark ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  {settings.popupText}
                </p>
              )}

              {/* 3. Popup Link Buttons below Banner / Text (ব্যানার বা টেক্সটের নিচে লিংক বাটন) */}
              {(() => {
                const activePopupBtns = Array.isArray(settings.popupButtons)
                  ? settings.popupButtons.filter((b) => b.url && b.url.trim().length > 0)
                  : [];

                const getPopupBtnColor = (color?: string) => {
                  switch (color) {
                    case 'emerald':
                      return 'from-emerald-500 to-teal-600 shadow-emerald-600/25';
                    case 'sky':
                      return 'from-sky-500 to-blue-600 shadow-sky-600/25';
                    case 'amber':
                      return 'from-amber-500 to-orange-600 shadow-amber-600/25';
                    case 'violet':
                    default:
                      return 'from-violet-600 to-indigo-600 shadow-violet-600/25';
                  }
                };

                return (
                  <div className="mt-5 flex flex-col gap-2.5">
                    {activePopupBtns.map((btn, idx) => (
                      <a
                        key={btn.id || idx}
                        href={btn.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 text-xs font-extrabold text-white shadow-lg transition-transform active:scale-[0.99] hover:opacity-95 sm:text-sm ${getPopupBtnColor(
                          btn.color
                        )}`}
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span>{btn.label || 'ওপেন করুন'}</span>
                      </a>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowWelcomePopup(false)}
                      className={`w-full rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                        isDark
                          ? 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      বন্ধ করুন / সাইটে প্রবেশ করুন
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      {/* App Request Modal (অ্যাপ রিকোয়েস্ট বক্স পপআপ) */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6 ${
              isDark
                ? 'border-violet-500/40 bg-[#121218] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="absolute right-3.5 top-3.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-violet-400">
              <MessageSquarePlus className="h-5 w-5" />
              <h3 className="text-base font-extrabold">পছন্দের অ্যাপ রিকোয়েস্ট করুন</h3>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              আপনার যে প্রিমিয়াম বা মড অ্যাপটি প্রয়োজন তার নাম লিখুন — অ্যাডমিন দ্রুত ওয়েবসাইটে আপলোড করে দেবেন।
            </p>

            <form onSubmit={handleSubmitAppRequest} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  অ্যাপের নাম (যেমন: InShot Pro / KineMaster Pro) *
                </label>
                <input
                  type="text"
                  required
                  value={reqAppName}
                  onChange={(e) => setReqAppName(e.target.value)}
                  placeholder="অ্যাপের নাম লিখুন..."
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:border-violet-500 focus:outline-none ${
                    isDark
                      ? 'border-zinc-700 bg-black text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  ভার্সন বা কোন প্রো ফিচার লাগবে? (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={reqVersionNote}
                  onChange={(e) => setReqVersionNote(e.target.value)}
                  placeholder="যেমন: Latest Version, No Watermark, VIP Unlocked..."
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-violet-500 focus:outline-none ${
                    isDark
                      ? 'border-zinc-700 bg-black text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  আপনার নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={reqUserName}
                  onChange={(e) => setReqUserName(e.target.value)}
                  placeholder="আপনার নাম..."
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-xs focus:border-violet-500 focus:outline-none ${
                    isDark
                      ? 'border-zinc-700 bg-black text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg hover:opacity-95"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  {submittingRequest ? 'জমা হচ্ছে...' : 'রিকোয়েস্ট পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Quick Share Modal (অ্যাপ কার্ড শেয়ার পপআপ) */}
      {shareModalFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShareModalFile(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
              isDark
                ? 'border-zinc-800 bg-[#121218] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setShareModalFile(null)}
              className="absolute right-3.5 top-3.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-violet-400">
              <Share2 className="h-5 w-5" />
              <h3 className="text-sm font-extrabold sm:text-base">অ্যাপটি শেয়ার করুন</h3>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span className="font-bold text-emerald-400">{shareModalFile.title}</span> সরাসরি বন্ধুদের সাথে শেয়ার করুন:
            </p>

            {(() => {
              const cardShareUrl = `${window.location.origin}/?file=${encodeURIComponent(
                shareModalFile.id
              )}`;
              const cardShareText = `${shareModalFile.title} (${
                shareModalFile.version || 'PRO'
              }) — প্রিমিয়াম আনলকড অ্যাপ ফ্রি ডাউনলোড করুন:`;
              return (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(
                        cardShareUrl
                      )}&text=${encodeURIComponent(cardShareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#24A1DE] px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      <Send className="h-3.5 w-3.5" /> Telegram
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `${cardShareText} ${cardShareUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> WhatsApp
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        cardShareUrl
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Facebook-এ শেয়ার করুন
                    </a>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      ডিরেক্ট ডাউনলোড লিংক:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={cardShareUrl}
                        className={`w-full rounded-lg border px-3 py-2 font-mono text-[11px] ${
                          isDark
                            ? 'border-zinc-700 bg-black text-zinc-200'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(cardShareUrl);
                          setCopiedCardShareLink(true);
                          showToast('অ্যাপের লিংক কপি হয়েছে!');
                          setTimeout(() => setCopiedCardShareLink(false), 2000);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500"
                      >
                        {copiedCardShareLink ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> কপি হয়েছে
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> কপি
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-violet-500/40 bg-[#121218] px-4 py-2.5 text-xs font-medium text-white shadow-2xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
