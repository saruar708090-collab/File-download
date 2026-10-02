import React, { useState } from 'react';
import {
  ArrowLeft,
  Zap,
  ShieldCheck,
  Star,
  ChevronRight,
  ChevronLeft,
  Send,
  ExternalLink,
  Layers,
  CheckCircle2,
  PlayCircle,
  FolderDown,
  Sparkles,
  Image as ImageIcon,
  Share2,
  Flag,
  Copy,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import {
  VaultFile,
  AppVersionItem,
  DownloadButtonConfig,
  HubSettings,
  createDefaultVersions,
  getFileExtension
} from '../types';

interface AppDownloadFlowPageProps {
  file: VaultFile;
  isDark: boolean;
  settings: HubSettings;
  onBackToHome: () => void;
  onTriggerDownload: (
    file: VaultFile,
    customUrl?: string,
    customFileName?: string,
    mode?: 'file' | 'link'
  ) => void;
  onReportSubmitted?: () => void;
  onShowToast?: (msg: string) => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed;
    }
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

const REPORT_REASONS = [
  'ডাউনলোড লিংক কাজ করছে না (Broken Link)',
  'ফাইল ডাউনলোড হচ্ছে না / সার্ভার এরর',
  'অ্যাপ ফোনে ইনস্টল বা ওপেন হচ্ছে না',
  'অ্যাপের নতুন আপডেট ভার্সন প্রয়োজন'
];

export const AppDownloadFlowPage: React.FC<AppDownloadFlowPageProps> = ({
  file,
  isDark,
  settings,
  onBackToHome,
  onTriggerDownload,
  onReportSubmitted,
  onShowToast
}) => {
  const versions: AppVersionItem[] =
    Array.isArray(file.versions) && file.versions.length > 0
      ? file.versions
      : createDefaultVersions(file.version || 'v18.80', file.externalUrl || '');

  const modFeatures: string[] = Array.isArray(file.modFeatures)
    ? file.modFeatures.filter((m) => m && m.trim().length > 0)
    : [];

  const screenshots: string[] = Array.isArray(file.screenshots)
    ? file.screenshots.filter((s) => s && s.trim().length > 0)
    : [];

  // null = Step 1 (Serial Version List: Latest Version, New Version, etc.)
  // non-null = Step 2 (Fast Download / Direct Download to File Manager)
  const [selectedVersion, setSelectedVersion] = useState<AppVersionItem | null>(null);
  const [downloadingBtnId, setDownloadingBtnId] = useState<string | null>(null);
  const [alternatePromptBtn, setAlternatePromptBtn] = useState<DownloadButtonConfig | null>(null);

  // Screenshot Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Broken Link Report Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const shareUrl = `${window.location.origin}/?file=${encodeURIComponent(file.id)}`;
  const shareText = `${file.title} (${file.version || 'PRO'}) — ১০০% আনলকড প্রো ভার্সন ফ্রি ডাউনলোড করুন:`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    if (onShowToast) onShowToast('অ্যাপের ডাউনলোড লিংক কপি হয়েছে!');
    setTimeout(() => setCopiedShareLink(false), 2200);
  };

  const handleNativeOrModalShare = async () => {
    setShowShareModal(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          fileTitle: `${file.title} (${file.version || 'PRO'})`,
          reason: reportReason,
          details: reportDetails.trim()
        })
      });
      if (res.ok) {
        setReportSuccess(true);
        setReportDetails('');
        if (onReportSubmitted) onReportSubmitted();
        if (onShowToast) {
          onShowToast('আপনার রিপোর্ট অ্যাডমিনের কাছে পাঠানো হয়েছে। ধন্যবাদ!');
        }
        setTimeout(() => {
          setReportSuccess(false);
          setShowReportModal(false);
        }, 1800);
      }
    } catch {
      if (onShowToast) onShowToast('রিপোর্ট পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getButtonColorClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-600/25';
      case 'sky':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-600/25';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-600/25';
      case 'violet':
      default:
        return 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-600/25';
    }
  };

  const handleButtonClick = (btn: DownloadButtonConfig) => {
    if (btn.isDisabled) {
      setAlternatePromptBtn(btn);
      return;
    }
    setDownloadingBtnId(btn.id);
    const resolvedMode: 'file' | 'link' =
      btn.mode || (btn.label.toLowerCase().includes('fast') ? 'file' : 'link');

    const downloadFileName =
      btn.fileName ||
      file.originalName ||
      `${file.title.replace(/\s+/g, '_')}_${file.version || 'Pro'}.apk`;

    onTriggerDownload(file, btn.url, downloadFileName, resolvedMode);
    setTimeout(() => {
      setDownloadingBtnId((prev) => (prev === btn.id ? null : prev));
    }, 2500);
  };

  const ytEmbedUrl = file.tutorialVideoUrl ? getYouTubeEmbedUrl(file.tutorialVideoUrl) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
      {/* Top Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between">
        {selectedVersion ? (
          <button
            type="button"
            onClick={() => setSelectedVersion(null)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
              isDark
                ? 'border-zinc-800 bg-[#121218] text-zinc-200 hover:border-violet-500'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="h-4 w-4 text-violet-500" /> ভার্সন তালিকায় ফিরে যান
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
              isDark
                ? 'border-zinc-800 bg-[#121218] text-zinc-200 hover:border-violet-500'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="h-4 w-4 text-violet-500" /> হোম পেজে ফিরে যান
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNativeOrModalShare}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
              isDark
                ? 'border-violet-500/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/40'
                : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" /> শেয়ার করুন
          </button>
        </div>
      </div>

      {/* App Header Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-6 ${
          isDark
            ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md sm:h-20 sm:w-20">
            {file.thumbnailUrl ? (
              <img
                src={file.thumbnailUrl}
                alt={file.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 font-mono text-base font-extrabold text-white">
                {getFileExtension(file.originalName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                {file.badge || 'PRO'}
              </span>
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {file.category}
              </span>
            </div>

            <h1
              className={`mt-1 truncate text-base font-extrabold sm:text-xl ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {file.title}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
              </div>
              <span className="font-mono text-emerald-400">{file.version || 'v1.0'}</span>
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                · {file.downloads} Downloads
              </span>
            </div>
          </div>
        </div>

        {file.description && (
          <p
            className={`mt-3.5 border-t pt-3 text-xs leading-relaxed sm:text-sm ${
              isDark ? 'border-zinc-800/80 text-zinc-300' : 'border-slate-100 text-slate-600'
            }`}
          >
            {file.description}
          </p>
        )}

        {/* Quick Share & Report Broken Link Bar */}
        <div
          className={`mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${
            isDark ? 'border-zinc-800/80' : 'border-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              isDark
                ? 'border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-violet-500 hover:text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Share2 className="h-3.5 w-3.5 text-violet-400" /> বন্ধুদের শেয়ার করুন
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isDark
                ? 'border-amber-500/30 bg-amber-950/25 text-amber-300 hover:bg-amber-950/40'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Flag className="h-3.5 w-3.5 text-amber-400" /> লিংক কাজ করছে না? রিপোর্ট করুন
          </button>
        </div>
      </div>

      {/* STEP 1 PAGE: CLEAN SERIAL VERSION LIST (Latest Version, New Version, Old Version...) */}
      {!selectedVersion ? (
        <div
          className={`mt-4 rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-500" />
              <h2
                className={`text-sm font-extrabold sm:text-lg ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Select Version to Download
              </h2>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              {versions.length} {versions.length === 1 ? 'Version' : 'Versions'}
            </span>
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            নিচের ভার্সনে ক্লিক করে সরাসরি ডাউনলোড পেজে যান:
          </p>

          {/* Single-Line Serial Stack */}
          <div className="mt-4 flex flex-col gap-3">
            {versions.map((ver, index) => (
              <button
                key={ver.id || index}
                type="button"
                onClick={() => setSelectedVersion(ver)}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all hover:border-violet-500 sm:px-4 sm:py-4 ${
                  isDark
                    ? 'border-zinc-800 bg-[#09090D] hover:bg-[#101018]'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                {/* Left Serial Number + Version Name + Single-line Meta */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600/25 to-indigo-600/25 font-mono text-xs font-extrabold text-violet-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-xs font-extrabold sm:text-base ${
                          isDark
                            ? 'text-white group-hover:text-violet-400'
                            : 'text-slate-900 group-hover:text-violet-600'
                        }`}
                      >
                        {ver.title}
                      </span>
                      {ver.badge && (
                        <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-400">
                          {ver.badge}
                        </span>
                      )}
                    </div>

                    <div
                      className={`mt-0.5 flex items-center gap-2 truncate font-mono text-[11px] ${
                        isDark ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      <span>{ver.sizeText || '85 MB'}</span>
                      <span>•</span>
                      <span className="text-emerald-400">100% Unlocked</span>
                    </div>
                  </div>
                </div>

                {/* Right Compact Download Pill */}
                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-transform group-hover:scale-105">
                  <span>Download</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* STEP 2 PAGE: FAST DOWNLOAD (DIRECT TO FILE MANAGER) & DIRECT DOWNLOAD BUTTONS */
        <div
          className={`mt-4 rounded-2xl border p-5 text-center sm:p-6 ${
            isDark
              ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-400">
            <FolderDown className="h-4 w-4" /> সরাসরি আপনার ফোনের ফাইল ম্যানেজারে ডাউনলোড হবে
          </div>

          <h2
            className={`mt-3 text-base font-extrabold sm:text-xl ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {selectedVersion.title}
          </h2>

          <p
            className={`mt-1 font-mono text-xs ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            File: {file.originalName} · Size: {selectedVersion.sizeText || '85 MB'}
          </p>

          {/* Dynamic Download Buttons: Direct Download (Link) & Fast Download (Direct to File Manager) */}
          <div className="mx-auto mt-5 max-w-md space-y-3">
            {(selectedVersion.buttons && selectedVersion.buttons.length > 0
              ? selectedVersion.buttons
              : [
                  {
                    id: 'default_direct',
                    label: 'Direct Download',
                    mode: 'link' as const,
                    url: file.externalUrl || settings.telegramChannelUrl || '',
                    color: 'violet' as const
                  },
                  {
                    id: 'default_fast',
                    label: 'Fast Download',
                    mode: 'file' as const,
                    url: '',
                    color: 'emerald' as const
                  }
                ]
            ).map((btn, idx) => {
              const resolvedMode: 'file' | 'link' =
                btn.mode || (btn.label.toLowerCase().includes('fast') ? 'file' : 'link');
              const isFastFile = resolvedMode === 'file';
              const isDownloading = downloadingBtnId === btn.id;
              return (
                <button
                  key={btn.id || idx}
                  type="button"
                  onClick={() => handleButtonClick(btn)}
                  className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-xs font-extrabold shadow-lg transition-transform active:scale-98 hover:opacity-95 sm:text-sm ${getButtonColorClasses(
                    btn.color
                  )}`}
                >
                  {isDownloading ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 animate-bounce" />
                      <span>
                        {isFastFile
                          ? 'ফাইল ম্যানেজারে ডাউনলোড হচ্ছে...'
                          : 'ডাউনলোড লিংক ওপেন হচ্ছে...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {isFastFile ? (
                        <Zap className="h-4 w-4 shrink-0" />
                      ) : (
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      )}
                      <span>{btn.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className={`mt-5 flex items-center justify-center gap-2 text-xs ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>এক ক্লিকে সরাসরি ফোনের File Manager / Downloads ফোল্ডারে সেভ হবে</span>
          </div>
        </div>
      )}

      {/* HOW TO USE VIDEO TUTORIAL SECTION (একটা এপস এর ভিতর কিভাবে ব্যবহার করবে ভিডিও) */}
      {file.tutorialVideoUrl && (
        <div
          className={`mt-4 rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-emerald-400" />
            <h3
              className={`text-sm font-extrabold sm:text-base ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {file.tutorialVideoTitle ||
                'অ্যাপটি কিভাবে ইনস্টল ও ব্যবহার করবেন দেখুন (Video Tutorial)'}
            </h3>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-black">
            {ytEmbedUrl ? (
              <div className="relative aspect-video w-full">
                <iframe
                  src={ytEmbedUrl}
                  title={file.tutorialVideoTitle || file.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={file.tutorialVideoUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-[420px] w-full bg-black object-contain"
              >
                আপনার ব্রাউজার ভিডিও প্লে সাপোর্ট করে না।
              </video>
            )}
          </div>
        </div>
      )}

      {/* MOD FEATURES LIST SECTION (মড ও আনলকড প্রিমিয়াম ফিচার লিস্ট) */}
      {modFeatures.length > 0 && (
        <div
          className={`mt-4 rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h3
              className={`text-sm font-extrabold sm:text-base ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              মড ও আনলকড প্রিমিয়াম ফিচারসমূহ (Mod Features)
            </h3>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {modFeatures.map((feat, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                  isDark
                    ? 'border-emerald-500/20 bg-[#09090D] text-zinc-200'
                    : 'border-emerald-200/80 bg-emerald-50/50 text-slate-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className=" leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APP SCREENSHOT GALLERY SECTION (অ্যাপের স্ক্রিনশট গ্যালারি) */}
      {screenshots.length > 0 && (
        <div
          className={`mt-4 rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? 'border-zinc-800 bg-[#121218] shadow-xl shadow-black/50'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-400" />
              <h3
                className={`text-sm font-extrabold sm:text-base ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                অ্যাপের স্ক্রিনশট প্রিভিউ (Screenshots)
              </h3>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              বড় করে দেখতে ছবিতে ক্লিক করুন
            </span>
          </div>

          <div className="mt-3.5 flex gap-3 overflow-x-auto pb-2">
            {screenshots.map((shotUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`group relative h-56 w-32 shrink-0 overflow-hidden rounded-xl border transition-transform hover:scale-[1.02] sm:h-64 sm:w-36 ${
                  isDark
                    ? 'border-zinc-800 bg-[#09090D] hover:border-violet-500'
                    : 'border-slate-200 bg-slate-100 hover:border-violet-500'
                }`}
              >
                <img
                  src={shotUrl}
                  alt={`${file.title} Screenshot ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className=" inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-violet-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    প্রিভিউ #{idx + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Telegram Channel Card */}
      <div
        className={`mt-4 rounded-2xl border p-4 sm:p-5 ${
          isDark ? 'border-zinc-800 bg-[#121218]' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div>
            <span className="font-mono text-xs font-bold text-[#24A1DE]">
              TELEGRAM CHANNEL: {settings.telegramChannelId}
            </span>
            <p
              className={`mt-1 text-xs ${
                isDark ? 'text-zinc-300' : 'text-slate-600'
              }`}
            >
              ডাউনলোড করতে সমস্যা হলে বা নতুন আপডেট পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।
            </p>
          </div>
          <a
            href={settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#24A1DE] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95"
          >
            <Send className="h-3.5 w-3.5" /> Join Telegram <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* LIGHTBOX SCREENSHOT PREVIEW MODAL */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-md flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -right-2 -top-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={screenshots[lightboxIndex]}
              alt={`${file.title} Preview`}
              referrerPolicy="no-referrer"
              className="max-h-[78vh] w-auto rounded-2xl border border-zinc-800 object-contain shadow-2xl"
            />

            {screenshots.length > 1 && (
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null
                        ? (prev - 1 + screenshots.length) % screenshots.length
                        : 0
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white hover:border-violet-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs text-zinc-300">
                  {lightboxIndex + 1} / {screenshots.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev + 1) % screenshots.length : 0
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white hover:border-violet-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARE APP MODAL */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShowShareModal(false)}
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
              onClick={() => setShowShareModal(false)}
              className="absolute right-3.5 top-3.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-violet-400">
              <Share2 className="h-5 w-5" />
              <h3 className="text-sm font-extrabold sm:text-base">অ্যাপটি বন্ধুদের শেয়ার করুন</h3>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span className="font-bold text-emerald-400">{file.title}</span> এর ডিরেক্ট ডাউনলোড লিংক শেয়ার করুন:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(
                  shareUrl
                )}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#24A1DE] px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                <Send className="h-3.5 w-3.5" /> Telegram
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${shareText} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                <ExternalLink className="h-3.5 w-3.5" /> WhatsApp
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Facebook-এ শেয়ার করুন
              </a>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] text-zinc-400 mb-1">ডিরেক্ট অ্যাপ লিংক:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={`w-full rounded-lg border px-3 py-2 font-mono text-[11px] ${
                    isDark
                      ? 'border-zinc-700 bg-black text-zinc-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500"
                >
                  {copiedShareLink ? (
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
          </div>
        </div>
      )}

      {/* BROKEN LINK REPORT MODAL */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShowReportModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
              isDark
                ? 'border-zinc-800 bg-[#121218] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="absolute right-3.5 top-3.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-extrabold sm:text-base">
                ব্রোকেন লিংক বা ডাউনলোড সমস্যা রিপোর্ট করুন
              </h3>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span className="font-bold text-white">{file.title}</span> ডাউনলোড করতে সমস্যা হলে নিচে জানান, অ্যাডমিন দ্রুত লিংক ঠিক করে দেবেন।
            </p>

            {reportSuccess ? (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
                <p className="mt-2 text-xs font-bold text-emerald-300">
                  আপনার রিপোর্ট সফলভাবে জমা হয়েছে! খুব শীঘ্রই এটি সমাধান করা হবে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    সমস্যার ধরন সিলেক্ট করুন:
                  </label>
                  <div className="space-y-1.5">
                    {REPORT_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
                          reportReason === reason
                            ? 'border-amber-500/60 bg-amber-500/10 font-bold text-amber-300'
                            : isDark
                            ? 'border-zinc-800 bg-black/50 text-zinc-300'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason)}
                          className="accent-amber-500"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    বিস্তারিত তথ্য (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="যেমন: Fast Download বাটন কাজ করছে না..."
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:border-amber-500 focus:outline-none ${
                      isDark
                        ? 'border-zinc-700 bg-black text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-lg px-3.5 py-2 text-xs text-zinc-400 hover:text-white"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-extrabold text-black hover:bg-amber-400"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {submittingReport ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Alternative Download Suggestion Modal ("অন্যটি চেষ্টা করতে বলবে") */}
      {alternatePromptBtn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setAlternatePromptBtn(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm rounded-2xl border p-5 sm:p-6 text-center shadow-2xl ${
              isDark
                ? 'border-amber-500/40 bg-[#121218] text-white shadow-black/80'
                : 'border-slate-200 bg-white text-slate-900 shadow-slate-900/10'
            }`}
          >
            <button
              type="button"
              onClick={() => setAlternatePromptBtn(null)}
              className="absolute right-3.5 top-3.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-base font-extrabold">
              {alternatePromptBtn.label} বন্ধ আছে
            </h3>

            <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              {alternatePromptBtn.disabledMessage ||
                'এই ডাউনলোড অপশনটি সাময়িকভাবে বন্ধ আছে। অনুগ্রহ করে অন্য ডাউনলোড বাটনটি ব্যবহার করুন!'}
            </p>

            {(() => {
              const otherBtn = (selectedVersion?.buttons || []).find(
                (b) => b.id !== alternatePromptBtn.id && !b.isDisabled
              );
              return (
                <div className="mt-5 space-y-2">
                  {otherBtn && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = otherBtn;
                        setAlternatePromptBtn(null);
                        handleButtonClick(target);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-transform active:scale-98 hover:opacity-95"
                    >
                      <Zap className="h-4 w-4" />
                      <span>{otherBtn.label} দিয়ে ডাউনলোড করুন</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAlternatePromptBtn(null)}
                    className={`w-full rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                      isDark
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    বন্ধ করুন
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
