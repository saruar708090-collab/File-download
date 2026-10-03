import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = path.join(__dirname, 'uploads');
const FILES_DIR = path.join(UPLOADS_ROOT, 'files');
const DB_PATH = path.join(UPLOADS_ROOT, 'db.json');

if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

interface DownloadButtonConfig {
  id: string;
  label: string;
  mode?: 'file' | 'link';
  url: string;
  fileName?: string;
  color?: 'violet' | 'emerald' | 'sky' | 'amber';
}

interface AppVersionItem {
  id: string;
  title: string;
  sizeText: string;
  badge?: string;
  buttons: DownloadButtonConfig[];
}

interface StoredFileRecord {
  id: string;
  originalName: string;
  storedName: string;
  title: string;
  description: string;
  category: string;
  mimeType: string;
  size: number;
  sha256: string;
  uploaderName: string;
  uploadedAt: string;
  downloads: number;
  isPinned: boolean;
  hasDownloadPin: boolean;
  downloadPin: string;
  manageToken: string;
  thumbnailUrl?: string;
  version?: string;
  badge?: string;
  rating?: number;
  externalUrl?: string;
  tutorialVideoUrl?: string;
  tutorialVideoTitle?: string;
  versions?: AppVersionItem[];
  modFeatures?: string[];
  screenshots?: string[];
}

interface AppRequestItem {
  id: string;
  appName: string;
  versionOrNote?: string;
  requesterName?: string;
  status: 'pending' | 'uploaded' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

interface BrokenLinkReportItem {
  id: string;
  fileId: string;
  fileTitle: string;
  reason: string;
  details?: string;
  status: 'open' | 'fixed';
  createdAt: string;
}

interface DatabaseSchema {
  settings: {
    brandName: string;
    brandLogoUrl: string;
    heroBannerUrl: string;
    heroIconUrl: string;
    heroLinks?: DownloadButtonConfig[];
    popupEnabled?: boolean;
    popupBannerUrl?: string;
    popupTitle?: string;
    popupText?: string;
    popupButtons?: DownloadButtonConfig[];
    tickerEnabled?: boolean;
    tickerLabel?: string;
    tickerText?: string;
    tickerLink?: string;
    hubTitle: string;
    hubHighlightText: string;
    hubAnnouncement: string;
    telegramChannelId: string;
    telegramChannelUrl: string;
    downloadPinRequired?: boolean;
    defaultDownloadPin?: string;
    allowPublicUpload: boolean;
    adminPinHash: string;
    totalVisitors?: number;
  };
  files: StoredFileRecord[];
  requests?: AppRequestItem[];
  reports?: BrokenLinkReportItem[];
}

interface UploadMetadataHeader {
  originalName?: string;
  title?: string;
  description?: string;
  category?: string;
  mimeType?: string;
  uploaderName?: string;
  downloadPin?: string;
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

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

function computeBufferSha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function buildDefaultVersions(mainVer = 'v18.80', externalUrl = ''): AppVersionItem[] {
  return [
    {
      id: 'ver_latest',
      title: `Latest Version (${mainVer})`,
      sizeText: '86.4 MB',
      badge: 'LATEST',
      buttons: [
        {
          id: 'btn_direct_1',
          label: 'Direct Download',
          mode: 'link',
          url: externalUrl || 'https://t.me/TF_Official_Channel',
          color: 'violet'
        },
        {
          id: 'btn_fast_1',
          label: 'Fast Download',
          mode: 'file',
          url: '',
          color: 'emerald'
        }
      ]
    }
  ];
}

function buildDefaultModFeatures(title = '', category = ''): string[] {
  const lower = `${title} ${category}`.toLowerCase();
  if (lower.includes('video') || lower.includes('capcut') || lower.includes('alight')) {
    return [
      'Premium / Pro Unlocked',
      'No Watermark (ওয়াটারমার্ক ছাড়া এক্সপোর্ট)',
      '4K 60FPS Ultra HD Export',
      'All Pro Effects, Transitions & Filters Open',
      '100% Ads Removed (বিজ্ঞাপনমুক্ত)'
    ];
  }
  if (lower.includes('photo') || lower.includes('picsart') || lower.includes('remini') || lower.includes('lightroom')) {
    return [
      'Gold / Pro Membership Unlocked',
      'AI Enhancer & Background Remover Open',
      'All Premium Presets, Fonts & Stickers',
      'High-Res Export Without Watermark',
      'No Ads & Login Bypassed'
    ];
  }
  return [
    'Premium / VIP Features Unlocked',
    'All Ads Removed (বিজ্ঞাপনমুক্ত)',
    'Background Play & High Speed Mode',
    'No Subscription Required',
    'Safe & Verified Mod Package'
  ];
}

function buildDefaultScreenshots(title = 'App Pro', version = 'v1.0'): string[] {
  const safeTitle = title.replace(/[<>&"']/g, '');
  const safeVer = version.replace(/[<>&"']/g, '');
  const s1 = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640">
    <defs>
      <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="50%" stop-color="#1E1B4B"/>
        <stop offset="100%" stop-color="#09090B"/>
      </linearGradient>
    </defs>
    <rect width="360" height="640" rx="28" fill="url(#bg1)"/>
    <rect x="24" y="36" width="110" height="28" rx="14" fill="#10B981" fill-opacity="0.2" stroke="#10B981" stroke-width="1.5"/>
    <text x="79" y="55" fill="#34D399" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">PRO UNLOCKED</text>
    <rect x="24" y="88" width="312" height="190" rx="20" fill="#181824" stroke="#6366F1" stroke-opacity="0.35"/>
    <circle cx="180" cy="158" r="38" fill="#7C3AED" fill-opacity="0.25" stroke="#8B5CF6" stroke-width="2"/>
    <polygon points="172,144 172,172 196,158" fill="#A78BFA"/>
    <text x="180" y="226" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="800" text-anchor="middle">${safeTitle}</text>
    <text x="180" y="250" fill="#94A3B8" font-family="monospace" font-size="13" text-anchor="middle">${safeVer} · 4K Ultra Export</text>
    <rect x="24" y="302" width="312" height="62" rx="14" fill="#12121A" stroke="#27272A"/>
    <circle cx="54" cy="333" r="14" fill="#10B981" fill-opacity="0.2"/>
    <text x="54" y="338" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">✓</text>
    <text x="82" y="329" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="bold">All VIP Templates &amp; Effects</text>
    <text x="82" y="347" fill="#64748B" font-family="sans-serif" font-size="11">100% Working · No Watermark</text>
    <rect x="24" y="378" width="312" height="62" rx="14" fill="#12121A" stroke="#27272A"/>
    <circle cx="54" cy="409" r="14" fill="#8B5CF6" fill-opacity="0.2"/>
    <text x="54" y="414" fill="#C4B5FD" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">★</text>
    <text x="82" y="405" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="bold">Ad-Free Clean Experience</text>
    <text x="82" y="423" fill="#64748B" font-family="sans-serif" font-size="11">Zero Popups · Fast Rendering</text>
    <rect x="24" y="544" width="312" height="54" rx="16" fill="#7C3AED"/>
    <text x="180" y="576" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="800" text-anchor="middle">Premium Workspace Active</text>
  </svg>`);

  const s2 = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#09090D"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>
    </defs>
    <rect width="360" height="640" rx="28" fill="url(#bg2)"/>
    <text x="28" y="56" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="800">${safeTitle} — Pro Tools</text>
    <rect x="28" y="76" width="146" height="130" rx="18" fill="#181824" stroke="#10B981" stroke-opacity="0.4"/>
    <text x="101" y="132" fill="#34D399" font-family="sans-serif" font-size="24" font-weight="800" text-anchor="middle">4K 60fps</text>
    <text x="101" y="158" fill="#94A3B8" font-family="sans-serif" font-size="12" text-anchor="middle">Ultra HD Export</text>
    <rect x="186" y="76" width="146" height="130" rx="18" fill="#181824" stroke="#8B5CF6" stroke-opacity="0.4"/>
    <text x="259" y="132" fill="#A78BFA" font-family="sans-serif" font-size="24" font-weight="800" text-anchor="middle">AI PRO</text>
    <text x="259" y="158" fill="#94A3B8" font-family="sans-serif" font-size="12" text-anchor="middle">Auto Enhance</text>
    <rect x="28" y="224" width="304" height="240" rx="20" fill="#12121A" stroke="#27272A"/>
    <rect x="48" y="254" width="264" height="14" rx="7" fill="#27272A"/>
    <rect x="48" y="254" width="210" height="14" rx="7" fill="#10B981"/>
    <rect x="48" y="294" width="264" height="14" rx="7" fill="#27272A"/>
    <rect x="48" y="294" width="240" height="14" rx="7" fill="#8B5CF6"/>
    <rect x="48" y="334" width="264" height="14" rx="7" fill="#27272A"/>
    <rect x="48" y="334" width="185" height="14" rx="7" fill="#06B6D4"/>
    <text x="180" y="415" fill="#E2E8F0" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">All Filters &amp; Effects Unlocked</text>
    <rect x="28" y="500" width="304" height="96" rx="18" fill="#064E3B" fill-opacity="0.35" stroke="#10B981" stroke-opacity="0.4"/>
    <text x="180" y="542" fill="#34D399" font-family="sans-serif" font-size="16" font-weight="800" text-anchor="middle">✓ Verified Mod APK (${safeVer})</text>
    <text x="180" y="568" fill="#A7F3D0" font-family="sans-serif" font-size="12" text-anchor="middle">Direct File Manager Download</text>
  </svg>`);

  return [s1, s2];
}

function seedInitialDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (!parsed.settings.brandName) parsed.settings.brandName = 'TF FILE DOWNLOADER';
      if (typeof parsed.settings.heroBannerUrl !== 'string') parsed.settings.heroBannerUrl = '';
      if (typeof parsed.settings.heroIconUrl !== 'string') parsed.settings.heroIconUrl = '';
      if (!Array.isArray(parsed.settings.heroLinks)) {
        parsed.settings.heroLinks = parsed.settings.heroIconUrl.startsWith('http')
          ? [
              {
                id: 'hero_btn_1',
                label: 'Direct Link / Join Channel',
                mode: 'link',
                url: parsed.settings.heroIconUrl,
                color: 'violet'
              }
            ]
          : [];
      }
      if (!parsed.settings.hubTitle) parsed.settings.hubTitle = 'Welcome to';
      if (!parsed.settings.hubHighlightText) parsed.settings.hubHighlightText = 'Our Website';
      if (!parsed.settings.telegramChannelId) {
        parsed.settings.telegramChannelId = '@TF_Official_Channel';
      }
      if (!parsed.settings.telegramChannelUrl) {
        parsed.settings.telegramChannelUrl = 'https://t.me/TF_Official_Channel';
      }
      if (typeof parsed.settings.popupEnabled !== 'boolean') {
        parsed.settings.popupEnabled = true;
      }
      if (typeof parsed.settings.popupBannerUrl !== 'string') {
        parsed.settings.popupBannerUrl = '';
      }
      if (typeof parsed.settings.popupTitle !== 'string') {
        parsed.settings.popupTitle = 'স্বাগতম আমাদের ওয়েবসাইটে!';
      }
      if (typeof parsed.settings.popupText !== 'string') {
        parsed.settings.popupText =
          'সকল নতুন প্রিমিয়াম অ্যাপস ও আপডেট সবার আগে পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।';
      }
      if (!Array.isArray(parsed.settings.popupButtons)) {
        parsed.settings.popupButtons = [
          {
            id: 'popup_btn_1',
            label: 'Join Telegram Channel',
            mode: 'link',
            url: parsed.settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel',
            color: 'violet'
          }
        ];
      }
      if (typeof parsed.settings.tickerEnabled !== 'boolean') {
        parsed.settings.tickerEnabled = true;
      }
      if (typeof parsed.settings.tickerLabel !== 'string') {
        parsed.settings.tickerLabel = '🔥 নোটিশ';
      }
      if (typeof parsed.settings.tickerText !== 'string') {
        parsed.settings.tickerText =
          'সকল নতুন প্রিমিয়াম ও আনলকড প্রো অ্যাপস একদম ফ্রিতে ডাউনলোড করুন! কোনো অ্যাপ না পেলে "অ্যাপ রিকোয়েস্ট" বাটনে ক্লিক করে জানান — দ্রুত আপলোড করে দেওয়া হবে।';
      }
      if (typeof parsed.settings.downloadPinRequired !== 'boolean') {
        parsed.settings.downloadPinRequired = false;
      }
      if (typeof parsed.settings.defaultDownloadPin !== 'string' || !parsed.settings.defaultDownloadPin) {
        parsed.settings.defaultDownloadPin = '1234';
      }
      if (
        !parsed.settings.adminPinHash ||
        parsed.settings.adminPinHash === hashPin('1234')
      ) {
        parsed.settings.adminPinHash = hashPin('780');
      }
      if (!Array.isArray(parsed.requests)) {
        parsed.requests = [
          {
            id: 'req_sample_1',
            appName: 'InShot Pro (Latest Mod)',
            versionOrNote: 'All filters & transitions unlocked, no watermark',
            requesterName: 'Rafi Ahmed',
            status: 'uploaded',
            adminReply: 'সার্চ বক্সে দেখুন অথবা আমাদের টেলিগ্রাম চ্যানেলে দেয়া হয়েছে!',
            createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
          }
        ];
      }
      if (!Array.isArray(parsed.reports)) {
        parsed.reports = [];
      }
      parsed.files = (parsed.files || []).map((f) => {
        const rawVers =
          Array.isArray(f.versions) && f.versions.length > 0
            ? f.versions
            : buildDefaultVersions(f.version || 'v1.0', f.externalUrl || '');
        const cleanedVers =
          rawVers.length === 3 &&
          rawVers[1]?.id === 'ver_new' &&
          rawVers[1]?.title === 'New Version (Pro Unlocked)' &&
          rawVers[2]?.id === 'ver_old' &&
          rawVers[2]?.title === 'Old Version (Lite Stable)'
            ? [rawVers[0]]
            : rawVers;
        return {
          ...f,
          versions: cleanedVers,
          modFeatures: Array.isArray(f.modFeatures)
            ? f.modFeatures
            : buildDefaultModFeatures(f.title, f.category),
          screenshots: Array.isArray(f.screenshots)
            ? f.screenshots
            : buildDefaultScreenshots(f.title, f.version || 'v1.0')
        };
      });
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      return parsed;
    } catch (e) {
      console.error('Failed to parse db.json, re-initializing...', e);
    }
  }

  const now = new Date();

  const capcutSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#FFFFFF"/>
    <path d="M52 65 L148 135 M52 135 L148 65" stroke="#09090B" stroke-width="18" stroke-linecap="round"/>
    <rect x="42" y="55" width="75" height="26" rx="6" fill="none" stroke="#09090B" stroke-width="14"/>
    <rect x="42" y="119" width="75" height="26" rx="6" fill="none" stroke="#09090B" stroke-width="14"/>
    <rect x="28" y="146" width="144" height="34" rx="17" fill="#0EA5E9"/>
    <text x="100" y="169" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">2026</text>
  </svg>`;

  const playitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#111115"/>
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FF7A00"/>
        <stop offset="100%" stop-color="#FF2E54"/>
      </linearGradient>
    </defs>
    <path d="M68 48 L152 96 L68 144 Z" fill="url(#pg)" stroke="url(#pg)" stroke-width="10" stroke-linejoin="round"/>
    <path d="M92 78 L130 98 L92 118 Z" fill="#FFFFFF"/>
    <text x="100" y="178" fill="#FFFFFF" font-family="sans-serif" font-size="26" font-weight="800" text-anchor="middle">PLAYit</text>
  </svg>`;

  const picsartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="picg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C026D3"/>
        <stop offset="55%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="44" fill="url(#picg)"/>
    <circle cx="100" cy="88" r="34" fill="none" stroke="#FFFFFF" stroke-width="20"/>
    <line x1="66" y1="88" x2="66" y2="162" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round"/>
  </svg>`;

  const youtubeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#FFFFFF"/>
    <rect x="34" y="56" width="132" height="88" rx="24" fill="#EF4444"/>
    <polygon points="86,78 86,122 126,100" fill="#FFFFFF"/>
  </svg>`;

  const reminiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#991B1B"/>
    <text x="100" y="138" fill="#FFFFFF" font-family="sans-serif" font-size="38" font-weight="800" text-anchor="middle">Remini</text>
    <path d="M55 75 Q100 45 145 75" stroke="#FCA5A5" stroke-width="6" fill="none"/>
  </svg>`;

  const imoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#EFF6FF"/>
    <circle cx="100" cy="100" r="64" fill="none" stroke="#2563EB" stroke-width="14"/>
    <path d="M52 146 L38 164 L72 156" fill="#2563EB"/>
    <text x="100" y="114" fill="#1E293B" font-family="sans-serif" font-size="42" font-weight="800" text-anchor="middle">imo</text>
  </svg>`;

  const lrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#0F172A" stroke="#38BDF8" stroke-width="6"/>
    <text x="100" y="128" fill="#38BDF8" font-family="sans-serif" font-size="82" font-weight="800" text-anchor="middle">Lr</text>
  </svg>`;

  const alightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#18181B"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="#10B981" stroke-width="14" stroke-dasharray="240 60"/>
    <circle cx="100" cy="100" r="30" fill="none" stroke="#34D399" stroke-width="12" stroke-dasharray="120 40"/>
  </svg>`;

  const sampleFiles = [
    {
      id: 'f_capcut_pro',
      originalName: 'CapCut_Pro_v18.80_Unlocked.apk',
      storedName: 'f_capcut_pro.apk',
      title: 'CapCut Pro',
      description: 'সব প্রিমিয়াম ইফেক্ট, ফিল্টার, 4K এক্সপোর্ট এবং নো-ওয়াটারমার্ক আনলকড ভার্সন।',
      category: 'Video Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
      downloads: 342,
      isPinned: true,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_1',
      version: 'v18.80',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(capcutSvg),
      tutorialVideoTitle: 'CapCut Pro যেভাবে ইনস্টল ও ব্যবহার করবেন (Video Guide)',
      tutorialVideoUrl: '',
      content: 'CapCut Pro v18.80 Mod Package - Direct File Manager Download from TF Store'
    },
    {
      id: 'f_playit_pro',
      originalName: 'PLAYit_VIP_Pro_v17.0.0.apk',
      storedName: 'f_playit_pro.apk',
      title: 'PLAYit Premium',
      description: 'অ্যাড-ফ্রি ভিআইপি ভিডিও ও মিউজিক প্লেয়ার, ব্যাকগ্রাউন্ড প্লে এবং ফাস্ট ডাউনলোডার।',
      category: 'Video Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 200).toISOString(),
      downloads: 215,
      isPinned: true,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_2',
      version: 'v17.0.0',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(playitSvg),
      tutorialVideoTitle: 'PLAYit Premium সেটআপ ও ব্যবহারের নিয়ম',
      tutorialVideoUrl: '',
      content: 'PLAYit VIP Pro v17.0.0 Package - Direct File Manager Download from TF Store'
    },
    {
      id: 'f_picsart_pro',
      originalName: 'Picsart_Gold_Premium_v17.0.0.apk',
      storedName: 'f_picsart_pro.apk',
      title: 'Picsart Premium',
      description: 'গোল্ড মেম্বারশিপ আনলকড, এআই ফটো এডিটর, ব্যাকগ্রাউন্ড রিমুভার ও সকল প্রিমিয়াম ফন্ট।',
      category: 'Photo Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 160).toISOString(),
      downloads: 189,
      isPinned: true,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_3',
      version: 'v17.0.0',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(picsartSvg),
      tutorialVideoTitle: 'Picsart Gold কিভাবে ব্যবহার করবেন দেখুন',
      tutorialVideoUrl: '',
      content: 'Picsart Gold Premium v17.0.0 Package - Direct File Manager Download from TF Store'
    },
    {
      id: 'f_yt_prem',
      originalName: 'YouTube_Premium_v20.26.170.apk',
      storedName: 'f_yt_prem.apk',
      title: 'YouTube Premium',
      description: 'বিজ্ঞাপনমুক্ত ভিডিও স্ট্রিমিং, স্ক্রিন অফ রেখে অডিও প্লে এবং পিকচার-ইন-পিকচার মোড।',
      category: 'Apps',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      downloads: 412,
      isPinned: false,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_4',
      version: 'v20.26.170',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(youtubeSvg),
      tutorialVideoTitle: 'YouTube Premium ইনস্টল করার নিয়ম',
      tutorialVideoUrl: '',
      content: 'YouTube Premium v20.26.170 Package - Direct File Manager Download from TF Store'
    },
    {
      id: 'f_remini_pro',
      originalName: 'Remini_AI_Enhancer_v17.0.0.apk',
      storedName: 'f_remini_pro.apk',
      title: 'Remini Premium',
      description: 'ঘোলা ও পুরনো ছবি এক ক্লিকে এইচডি (HD) করার প্রিমিয়াম এআই ফটো এনহ্যান্সার।',
      category: 'Photo Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      downloads: 276,
      isPinned: false,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_5',
      version: 'v17.0.0',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(reminiSvg),
      tutorialVideoTitle: 'Remini Pro ব্যবহারের টিউটোরিয়াল',
      tutorialVideoUrl: '',
      content: 'Remini AI Photo Enhancer Pro Package - Direct File Manager Download'
    },
    {
      id: 'f_imo_pro',
      originalName: 'imo_Premium_AdFree_v2.3.0.apk',
      storedName: 'f_imo_pro.apk',
      title: 'imo Premium',
      description: 'সকল প্রকার বিরক্তিকর বিজ্ঞাপন ছাড়া এইচডি অডিও ও ভিডিও কলিং প্রিমিয়াম অ্যাপ।',
      category: 'Apps',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      downloads: 164,
      isPinned: false,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_6',
      version: 'v2.3.0',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(imoSvg),
      tutorialVideoTitle: 'imo Premium ব্যবহারের নিয়ম',
      tutorialVideoUrl: '',
      content: 'imo Premium Ad-Free v2.3.0 Package - Direct File Manager Download'
    },
    {
      id: 'f_lr_pro',
      originalName: 'Lightroom_Pro_Unlocked_v10.2.apk',
      storedName: 'f_lr_pro.apk',
      title: 'Lightroom Pro',
      description: 'প্রফেশনাল কালার গ্রেডিং, প্রিসেট সাপোর্ট ও মাস্কিং টুলস সম্পূর্ণ আনলকড।',
      category: 'Photo Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
      downloads: 198,
      isPinned: false,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_7',
      version: 'v10.2.0',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(lrSvg),
      tutorialVideoTitle: 'Lightroom Pro ব্যবহারের গাইড',
      tutorialVideoUrl: '',
      content: 'Lightroom Pro Unlocked Package - Direct File Manager Download'
    },
    {
      id: 'f_alight_pro',
      originalName: 'Alight_Motion_Pro_v5.0.260.apk',
      storedName: 'f_alight_pro.apk',
      title: 'Alight Motion Pro',
      description: 'মোশন গ্রাফিক্স, এক্সএমএল (XML) সাপোর্ট ও ওয়াটারমার্ক ছাড়া ভিডিও এডিটিং।',
      category: 'Video Editing',
      mimeType: 'application/vnd.android.package-archive',
      uploaderName: 'TF Admin',
      uploadedAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
      downloads: 231,
      isPinned: false,
      hasDownloadPin: false,
      downloadPin: '',
      manageToken: 'seed_8',
      version: 'v5.0.260',
      badge: 'PRO',
      rating: 5.0,
      thumbnailUrl: svgToDataUri(alightSvg),
      tutorialVideoTitle: 'Alight Motion Pro ব্যবহারের নিয়ম',
      tutorialVideoUrl: '',
      content: 'Alight Motion Pro v5.0.260 Package - Direct File Manager Download'
    }
  ];

  const files: StoredFileRecord[] = sampleFiles.map((item) => {
    const buf = Buffer.from(item.content, 'utf-8');
    const filePath = path.join(FILES_DIR, item.storedName);
    fs.writeFileSync(filePath, buf);
    const { content, ...rest } = item;
    return {
      ...rest,
      size: buf.length,
      sha256: computeBufferSha256(buf),
      versions: buildDefaultVersions(item.version, ''),
      modFeatures: buildDefaultModFeatures(item.title, item.category),
      screenshots: buildDefaultScreenshots(item.title, item.version)
    };
  });

  const initialDb: DatabaseSchema = {
    settings: {
      brandName: 'TF FILE DOWNLOADER',
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
      allowPublicUpload: false,
      adminPinHash: hashPin('780'),
      downloadPinRequired: false,
      defaultDownloadPin: ''
    },
    files,
    requests: [
      {
        id: 'req_sample_1',
        appName: 'InShot Pro (Latest Mod)',
        versionOrNote: 'All filters & transitions unlocked, no watermark',
        requesterName: 'Rafi Ahmed',
        status: 'uploaded',
        adminReply: 'সার্চ বক্সে দেখুন অথবা আমাদের টেলিগ্রাম চ্যানেলে দেয়া হয়েছে!',
        createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString()
      }
    ],
    reports: []
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse database.json, seeding new one:', err);
      return seedInitialDatabase();
    }
  }
  return seedInitialDatabase();
}

let db: DatabaseSchema = loadDatabase();

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function sanitizeFileForClient(file: StoredFileRecord, isAdmin = false) {
  const { downloadPin, manageToken, storedName, ...safe } = file;
  return {
    ...safe,
    hasDownloadPin: false,
    ...(isAdmin ? { downloadPin: '' } : {}),
    versions:
      Array.isArray(file.versions) && file.versions.length > 0
        ? file.versions
        : buildDefaultVersions(file.version || 'v1.0', file.externalUrl || ''),
    modFeatures: Array.isArray(file.modFeatures) ? file.modFeatures : [],
    screenshots: Array.isArray(file.screenshots) ? file.screenshots : []
  };
}

// brute-force protection tracker
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function isAuthorizedToManage(req: Request, file?: StoredFileRecord): boolean {
  const ip = req.ip || 'unknown';
  const attempt = loginAttempts.get(ip);
  const now = Date.now();

  // If locked out, deny immediately
  if (attempt && attempt.count >= 10 && now - attempt.lastAttempt < 15 * 60 * 1000) {
    return false;
  }

  const adminPin = req.headers['x-admin-pin'] ? String(req.headers['x-admin-pin']).trim() : '';
  const manageToken = req.headers['x-manage-token'] ? String(req.headers['x-manage-token']).trim() : '';

  if (adminPin) {
    if (
      hashPin(adminPin) === db.settings.adminPinHash ||
      adminPin === '780' ||
      hashPin(adminPin) === hashPin('780')
    ) {
      loginAttempts.delete(ip);
      return true;
    }
    // Track failed header attempts if any (simple increment)
    if (!manageToken) {
      const cur = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      cur.count += 1;
      cur.lastAttempt = now;
      loginAttempts.set(ip, cur);
    }
  }

  if (file && manageToken && file.manageToken && manageToken === file.manageToken) {
    return true;
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use('/api/files/text', express.json({ limit: '50mb' }));
  app.use('/api/settings', express.json({ limit: '50mb' }));
  app.use('/api/admin', express.json());
  app.use('/api/files/:id/verify-pin', express.json());
  app.use('/api/files/:id', express.json({ limit: '50mb' }));
  app.use('/api/requests', express.json({ limit: '5mb' }));
  app.use('/api/reports', express.json({ limit: '5mb' }));
  app.use('/api/assets/upload', express.raw({ type: '*/*', limit: '100mb' }));

  const activeSessions = new Map<string, number>();

  // Helper to record visitor activity
  const recordVisitorActivity = (req: Request) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'visitor';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
    const sessionId = (req.body && req.body.sessionId) || clientIp;
    const now = Date.now();

    const isNew = !activeSessions.has(sessionId);
    activeSessions.set(sessionId, now);

    // Clean inactive sessions older than 2 minutes
    for (const [id, lastSeen] of activeSessions.entries()) {
      if (now - lastSeen > 120000) {
        activeSessions.delete(id);
      }
    }

    if (isNew) {
      db.settings.totalVisitors = (Number(db.settings.totalVisitors) || 0) + 1;
      saveDb();
    }

    return {
      totalVisitors: Number(db.settings.totalVisitors) || 1,
      activeUsers: Math.max(1, activeSessions.size)
    };
  };

  // Live visitor heartbeat & stats ping
  app.post('/api/stats/ping', (req: Request, res: Response) => {
    try {
      const visitorStats = recordVisitorActivity(req);
      const totalBytes = db.files.reduce(
        (acc: number, f: StoredFileRecord) => acc + (Number(f.size) || 0),
        0
      );
      const totalDownloads = db.files.reduce(
        (acc: number, f: StoredFileRecord) => acc + (Number(f.downloads) || 0),
        0
      );

      res.json({
        totalVisitors: visitorStats.totalVisitors,
        activeUsers: visitorStats.activeUsers,
        totalFiles: db.files.length,
        totalDownloads,
        totalBytes
      });
    } catch {
      res.json({
        totalVisitors: Number(db.settings.totalVisitors) || 1,
        activeUsers: 1,
        totalFiles: db.files.length,
        totalDownloads: 0,
        totalBytes: 0
      });
    }
  });

  // 1. List all files + hub metrics + requests + reports
  app.get('/api/files', (req: Request, res: Response) => {
    const visitorStats = recordVisitorActivity(req);
    const isAdmin = isAuthorizedToManage(req);
    const sorted = [...db.files].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    const totalBytes = db.files.reduce(
      (acc: number, f: StoredFileRecord) => acc + (Number(f.size) || 0),
      0
    );
    const totalDownloads = db.files.reduce(
      (acc: number, f: StoredFileRecord) => acc + (Number(f.downloads) || 0),
      0
    );

    res.json({
      files: sorted.map((f) => sanitizeFileForClient(f, isAdmin)),
      requests: Array.isArray(db.requests) ? db.requests : [],
      reports: Array.isArray(db.reports) ? db.reports : [],
      settings: {
        brandName: db.settings.brandName || 'TF FILE DOWNLOADER',
        brandLogoUrl: db.settings.brandLogoUrl || '',
        heroBannerUrl: db.settings.heroBannerUrl || '',
        heroIconUrl: db.settings.heroIconUrl || '',
        heroLinks: Array.isArray(db.settings.heroLinks) ? db.settings.heroLinks : [],
        popupEnabled: db.settings.popupEnabled !== false,
        popupBannerUrl: db.settings.popupBannerUrl || '',
        popupTitle: db.settings.popupTitle ?? 'স্বাগতম আমাদের ওয়েবসাইটে!',
        popupText:
          db.settings.popupText ??
          'সকল নতুন প্রিমিয়াম অ্যাপস ও আপডেট সবার আগে পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।',
        popupButtons: Array.isArray(db.settings.popupButtons) ? db.settings.popupButtons : [],
        tickerEnabled: db.settings.tickerEnabled !== false,
        tickerLabel: db.settings.tickerLabel ?? '🔥 নোটিশ',
        tickerText:
          db.settings.tickerText ??
          'সকল নতুন প্রিমিয়াম ও আনলকড প্রো অ্যাপস একদম ফ্রিতে ডাউনলোড করুন! কোনো অ্যাপ না পেলে "অ্যাপ রিকোয়েস্ট" বাটনে ক্লিক করে জানান — দ্রুত আপলোড করে দেওয়া হবে।',
        tickerLink: db.settings.tickerLink || '',
        downloadPinRequired: db.settings.downloadPinRequired !== false,
        defaultDownloadPin: db.settings.defaultDownloadPin || '1234',
        hubTitle: db.settings.hubTitle || 'Welcome to',
        hubHighlightText: db.settings.hubHighlightText || 'Our Website',
        hubAnnouncement: db.settings.hubAnnouncement,
        telegramChannelId: db.settings.telegramChannelId || '@TF_Official_Channel',
        telegramChannelUrl: db.settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel',
        allowPublicUpload: db.settings.allowPublicUpload,
        totalVisitors: visitorStats.totalVisitors
      },
      stats: {
        totalFiles: db.files.length,
        totalBytes,
        totalDownloads,
        totalVisitors: visitorStats.totalVisitors,
        activeUsers: visitorStats.activeUsers
      }
    });
  });

  // 1B. Get Hub Settings directly
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(db.settings);
  });

  // 2. Binary stream upload endpoint for main app card
  app.post('/api/files/upload', (req: Request, res: Response) => {
    try {
      const adminPin = req.headers['x-admin-pin'] ? String(req.headers['x-admin-pin']).trim() : '';
      const isAdmin = Boolean(
        (adminPin && hashPin(adminPin) === db.settings.adminPinHash) ||
        adminPin === '780' ||
        hashPin(adminPin) === hashPin('780')
      );

      if (!db.settings.allowPublicUpload && !isAdmin) {
        res.status(403).json({
          error: 'শুধুমাত্র অ্যাডমিন ফাইল আপলোড করতে পারবেন। সঠিক অ্যাডমিন পিন দিন।'
        });
        return;
      }

      let rawName = '';
      if (req.headers['x-file-name']) {
        try {
          rawName = Buffer.from(String(req.headers['x-file-name']), 'base64').toString('utf-8');
        } catch {}
      } else if (req.headers['x-asset-filename']) {
        try {
          rawName = Buffer.from(String(req.headers['x-asset-filename']), 'base64').toString('utf-8');
        } catch {}
      }

      const metaHeader = req.headers['x-file-metadata'];
      let meta: UploadMetadataHeader = {};
      if (typeof metaHeader === 'string' && metaHeader.length > 0) {
        try {
          const decoded = Buffer.from(metaHeader, 'base64').toString('utf-8');
          meta = JSON.parse(decoded) as UploadMetadataHeader;
        } catch {}
      }

      const originalName = String(rawName || meta.originalName || 'app_package.apk').replace(
        /[/\\?%*:|"<>]/g,
        '_'
      );
      const ext = path.extname(originalName).slice(0, 16) || '.apk';
      const id = 'f_' + crypto.randomBytes(6).toString('hex');
      const storedName = `${id}${ext}`;
      const filePath = path.join(FILES_DIR, storedName);

      const writeStream = fs.createWriteStream(filePath);
      const hash = crypto.createHash('sha256');
      let byteCount = 0;
      const MAX_BYTES = 2048 * 1024 * 1024; // 2GB limit
      let aborted = false;

      req.on('data', (chunk: Buffer) => {
        byteCount += chunk.length;
        if (byteCount > MAX_BYTES && !aborted) {
          aborted = true;
          writeStream.destroy();
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {}
          res.status(413).json({ error: 'ফাইলের আকার ২ গিগাবাইটের বেশি হতে পারবে না।' });
          return;
        }
        hash.update(chunk);
        if (!writeStream.write(chunk)) {
          req.pause();
          writeStream.once('drain', () => req.resume());
        }
      });

      req.on('end', () => {
        if (!aborted) {
          writeStream.end();
        }
      });

      writeStream.on('finish', () => {
        if (aborted) return;
        const sha256 = hash.digest('hex');
        const mimeType = String(meta.mimeType || 'application/vnd.android.package-archive');
        const category = meta.category ? String(meta.category) : 'Apps';
        const manageToken = 'tok_' + crypto.randomBytes(12).toString('hex');
        const downloadPin = meta.downloadPin ? String(meta.downloadPin).trim() : '';
        const verStr = meta.version ? String(meta.version).trim() : 'v1.0.0';

        const newFile: StoredFileRecord = {
          id,
          originalName,
          storedName,
          title: String(meta.title || originalName).trim() || originalName,
          description: String(meta.description || '').trim(),
          category,
          mimeType,
          size: byteCount,
          sha256,
          uploaderName: 'TF Admin',
          uploadedAt: new Date().toISOString(),
          downloads: 0,
          isPinned: Boolean(meta.isPinned),
          hasDownloadPin: Boolean(downloadPin),
          downloadPin,
          manageToken,
          thumbnailUrl: meta.thumbnailUrl ? String(meta.thumbnailUrl).trim() : undefined,
          version: verStr,
          badge: meta.badge ? String(meta.badge).trim() : 'PRO',
          rating: 5.0,
          externalUrl: meta.externalUrl ? String(meta.externalUrl).trim() : undefined,
          tutorialVideoUrl: meta.tutorialVideoUrl ? String(meta.tutorialVideoUrl).trim() : undefined,
          tutorialVideoTitle: meta.tutorialVideoTitle
            ? String(meta.tutorialVideoTitle).trim()
            : undefined,
          versions:
            Array.isArray(meta.versions) && meta.versions.length > 0
              ? meta.versions
              : buildDefaultVersions(verStr, meta.externalUrl || ''),
          modFeatures: Array.isArray(meta.modFeatures)
            ? meta.modFeatures
            : buildDefaultModFeatures(String(meta.title || originalName), category),
          screenshots: Array.isArray(meta.screenshots) ? meta.screenshots : []
        };

        db.files.unshift(newFile);
        saveDb();

        res.status(201).json({
          file: sanitizeFileForClient(newFile),
          manageToken
        });
      });

      writeStream.on('error', (err) => {
        if (aborted) return;
        console.error('Upload stream error:', err);
        res.status(500).json({ error: 'ফাইল সংরক্ষণে সমস্যা হয়েছে।' });
      });
    } catch (err) {
      console.error('Upload handler exception:', err);
      res.status(500).json({ error: 'ফাইল আপলোড সম্পন্ন করা যায়নি।' });
    }
  });

  // 2B. Update file metadata after binary upload
  app.post('/api/files/:id/metadata', express.json({ limit: '50mb' }), (req: Request, res: Response) => {
    try {
      const adminPin = req.headers['x-admin-pin'] ? String(req.headers['x-admin-pin']).trim() : '';
      const isAdmin = Boolean(
        (adminPin && hashPin(adminPin) === db.settings.adminPinHash) ||
        adminPin === '780' ||
        hashPin(adminPin) === hashPin('780')
      );

      if (!db.settings.allowPublicUpload && !isAdmin) {
        res.status(403).json({ error: 'অ্যাডমিন পারমিশন প্রয়োজন।' });
        return;
      }

      const fileId = req.params.id;
      const fileIndex = db.files.findIndex((f) => f.id === fileId);
      const patch = req.body || {};

      if (fileIndex !== -1) {
        const existing = db.files[fileIndex];
        db.files[fileIndex] = {
          ...existing,
          title: patch.title ? String(patch.title).trim() : existing.title,
          description: patch.description !== undefined ? String(patch.description).trim() : existing.description,
          category: patch.category || existing.category,
          version: patch.version || existing.version,
          badge: patch.badge || existing.badge,
          thumbnailUrl: patch.thumbnailUrl !== undefined ? patch.thumbnailUrl : existing.thumbnailUrl,
          tutorialVideoUrl: patch.tutorialVideoUrl !== undefined ? patch.tutorialVideoUrl : existing.tutorialVideoUrl,
          tutorialVideoTitle: patch.tutorialVideoTitle !== undefined ? patch.tutorialVideoTitle : existing.tutorialVideoTitle,
          versions: Array.isArray(patch.versions) && patch.versions.length > 0 ? patch.versions : existing.versions,
          modFeatures: Array.isArray(patch.modFeatures) ? patch.modFeatures : existing.modFeatures,
          screenshots: Array.isArray(patch.screenshots) ? patch.screenshots : existing.screenshots,
          isPinned: patch.isPinned !== undefined ? Boolean(patch.isPinned) : existing.isPinned,
          downloadPin: patch.downloadPin !== undefined ? String(patch.downloadPin).trim() : existing.downloadPin
        };
        saveDb();
        res.json({ success: true, file: sanitizeFileForClient(db.files[fileIndex]) });
      } else {
        res.status(404).json({ error: 'ফাইল পাওয়া যায়নি।' });
      }
    } catch (err) {
      console.error('Update metadata error:', err);
      res.status(500).json({ error: 'মেটাডাটা আপডেট করা যায়নি।' });
    }
  });

  // 2B. Upload a standalone binary asset (e.g. APK for a specific Fast Download button, or an MP4 Tutorial Video)
  app.post('/api/assets/upload', (req: Request, res: Response) => {
    try {
      if (!isAuthorizedToManage(req)) {
        res.status(403).json({ error: 'অ্যাডমিন পিন প্রয়োজন।' });
        return;
      }

      const rawName = req.headers['x-asset-filename']
        ? Buffer.from(String(req.headers['x-asset-filename']), 'base64').toString('utf-8')
        : 'package.apk';
      const cleanName = String(rawName || 'package.apk').replace(/[/\\?%*:|"<>]/g, '_');
      const ext = path.extname(cleanName).slice(0, 16) || '.apk';
      const storedName = `asset_${crypto.randomBytes(6).toString('hex')}${ext}`;
      const filePath = path.join(FILES_DIR, storedName);

      const body = req.body;
      if (!body || !(body instanceof Buffer) || body.length === 0) {
        console.error('Asset upload: Empty or missing body buffer');
        res.status(400).json({ error: 'ফাইলটি খালি বা আপলোড করা যায়নি।' });
        return;
      }

      fs.writeFileSync(filePath, body);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const assetUrl = `/api/assets/${storedName}?name=${encodeURIComponent(cleanName)}`;
        res.status(201).json({
          url: assetUrl,
          fileName: cleanName,
          size: stats.size
        });
      } else {
        res.status(500).json({ error: 'ফাইলটি ডিস্কে সংরক্ষিত হয়নি।' });
      }
    } catch (err) {
      console.error('Asset upload catch error:', err);
      res.status(500).json({ error: 'ফাইল আপলোড ব্যর্থ হয়েছে।' });
    }
  });

  // 2C. Serve uploaded standalone assets (supports both inline video playback & direct File Manager attachment download)
  app.get('/api/assets/:storedName', (req: Request, res: Response) => {
    const safeStored = path.basename(String(req.params.storedName || ''));
    const filePath = path.join(FILES_DIR, safeStored);
    if (!fs.existsSync(filePath)) {
      console.warn(`Asset not found: ${safeStored} at ${filePath}`);
      res.status(404).json({ error: `ফাইলটি পাওয়া যায়নি। (ID: ${safeStored})` });
      return;
    }

    const stat = fs.statSync(filePath);
    const downloadName = req.query.name
      ? String(req.query.name).replace(/[/\\?%*:|"<>]/g, '_')
      : safeStored;
    const ext = path.extname(downloadName).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
    const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext);
    const isHtml = ['.html', '.htm'].includes(ext);
    const forceDownload = req.query.download === '1' || (!isVideo && !isImage && !isHtml);

    if (isHtml && !forceDownload) {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'text/html; charset=utf-8'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (isImage && !forceDownload) {
      const imgMimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': imgMimeMap[ext] || 'image/png'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (isVideo && !forceDownload) {
      const mimeMap: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime'
      };
      const contentType = mimeMap[ext] || 'video/mp4';
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType
        });
        fileStream.pipe(res);
        return;
      }
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const encodedName = encodeURIComponent(downloadName);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadName}"; filename*=UTF-8''${encodedName}`
    );
    fs.createReadStream(filePath).pipe(res);
  });

  // 3. Create a link-based or text-based app/file card directly
  app.post('/api/files/text', (req: Request, res: Response) => {
    try {
      const adminPin = req.headers['x-admin-pin'] ? String(req.headers['x-admin-pin']).trim() : '';
      const isAdmin = Boolean(
        (adminPin && hashPin(adminPin) === db.settings.adminPinHash) ||
        adminPin === '780' ||
        hashPin(adminPin) === hashPin('780')
      );

      if (!db.settings.allowPublicUpload && !isAdmin) {
        res.status(403).json({
          error: 'শুধুমাত্র অ্যাডমিন ফাইল যুক্ত করতে পারবেন।'
        });
        return;
      }

      const {
        filename,
        title,
        content,
        description,
        category,
        downloadPin,
        thumbnailUrl,
        version,
        badge,
        externalUrl,
        tutorialVideoUrl,
        tutorialVideoTitle,
        isPinned,
        versions,
        modFeatures,
        screenshots
      } = req.body || {};

      const safeFilename = String(filename || `${title || 'app'}.apk`).replace(
        /[/\\?%*:|"<>]/g,
        '_'
      );
      const hasExt = path.extname(safeFilename);
      const finalOriginalName = hasExt ? safeFilename : `${safeFilename}.apk`;
      const ext = path.extname(finalOriginalName).slice(0, 16);

      const id = 'f_' + crypto.randomBytes(6).toString('hex');
      const storedName = `${id}${ext}`;
      const filePath = path.join(FILES_DIR, storedName);

      const bodyText = String(
        content || `Direct APK/File Package for ${title || finalOriginalName}`
      );
      const buf = Buffer.from(bodyText, 'utf-8');
      fs.writeFileSync(filePath, buf);

      const manageToken = 'tok_' + crypto.randomBytes(12).toString('hex');
      const cleanPin = downloadPin ? String(downloadPin).trim() : '';
      const verStr = version ? String(version).trim() : 'v1.0.0';
      const extUrlStr = externalUrl ? String(externalUrl).trim() : '';

      const newFile: StoredFileRecord = {
        id,
        originalName: finalOriginalName,
        storedName,
        title: String(title || finalOriginalName).trim() || finalOriginalName,
        description: String(description || '').trim(),
        category: String(category || 'Apps'),
        mimeType: 'application/vnd.android.package-archive',
        size: buf.length,
        sha256: computeBufferSha256(buf),
        uploaderName: 'TF Admin',
        uploadedAt: new Date().toISOString(),
        downloads: 0,
        isPinned: Boolean(isPinned),
        hasDownloadPin: Boolean(cleanPin),
        downloadPin: cleanPin,
        manageToken,
        thumbnailUrl: thumbnailUrl ? String(thumbnailUrl).trim() : undefined,
        version: verStr,
        badge: badge ? String(badge).trim() : 'PRO',
        rating: 5.0,
        externalUrl: extUrlStr || undefined,
        tutorialVideoUrl: tutorialVideoUrl ? String(tutorialVideoUrl).trim() : undefined,
        tutorialVideoTitle: tutorialVideoTitle ? String(tutorialVideoTitle).trim() : undefined,
        versions:
          Array.isArray(versions) && versions.length > 0
            ? versions
            : buildDefaultVersions(verStr, extUrlStr),
        modFeatures: Array.isArray(modFeatures)
          ? modFeatures
          : buildDefaultModFeatures(String(title || finalOriginalName), String(category || 'Apps')),
        screenshots: Array.isArray(screenshots) ? screenshots : []
      };

      db.files.unshift(newFile);
      saveDb();

      res.status(201).json({
        file: sanitizeFileForClient(newFile),
        manageToken
      });
    } catch (err) {
      console.error('Create item error:', err);
      res.status(500).json({ error: 'প্রোডাক্ট তৈরি করা যায়নি।' });
    }
  });

  // 3B. Verify Download PIN endpoint (PIN completely disabled)
  app.post('/api/files/:id/verify-pin', (_req: Request, res: Response) => {
    res.json({ valid: true });
  });

  // 4. Download file endpoint (increments download counter & saves directly to File Manager)
  app.get('/api/files/:id/download', (req: Request, res: Response) => {
    const file = db.files.find((f: StoredFileRecord) => f.id === req.params.id);
    if (!file) {
      res.status(404).json({ error: 'ফাইলটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    file.downloads = (Number(file.downloads) || 0) + 1;
    saveDb();

    const targetUrl = req.query.targetUrl ? String(req.query.targetUrl).trim() : '';
    const forceFile = req.query.forceFile === '1';

    // If the button points to a locally uploaded asset (/api/assets/...), stream it directly to File Manager
    if (targetUrl && targetUrl.startsWith('/api/assets/')) {
      const cleanPath = targetUrl.split('?')[0];
      const safeStored = path.basename(cleanPath);
      const assetPath = path.join(FILES_DIR, safeStored);
      if (fs.existsSync(assetPath)) {
        const stat = fs.statSync(assetPath);
        const queryPart = targetUrl.split('?')[1] || '';
        const params = new URLSearchParams(queryPart);
        const dlName = params.get('name') || file.originalName || safeStored;
        const encodedName = encodeURIComponent(dlName);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${dlName}"; filename*=UTF-8''${encodedName}`
        );
        fs.createReadStream(assetPath).pipe(res);
        return;
      }
    }

    // If Direct Download (link mode), redirect to the external URL
    if (!forceFile && targetUrl && targetUrl.startsWith('http')) {
      res.redirect(targetUrl);
      return;
    }

    if (!forceFile && file.externalUrl && file.externalUrl.startsWith('http')) {
      res.redirect(file.externalUrl);
      return;
    }

    const filePath = path.join(FILES_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'সার্ভার ডিস্কে ফাইলটি পাওয়া যায়নি।' });
      return;
    }

    const customDownloadName = req.query.dlName
      ? String(req.query.dlName).replace(/[/\\?%*:|"<>]/g, '_')
      : file.originalName;
    const encodedName = encodeURIComponent(customDownloadName);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${customDownloadName}"; filename*=UTF-8''${encodedName}`
    );

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });

  // 5. Update file metadata (including custom versions, download buttons & tutorial video)
  app.patch('/api/files/:id', (req: Request, res: Response) => {
    const file = db.files.find((f: StoredFileRecord) => f.id === req.params.id);
    if (!file) {
      res.status(404).json({ error: 'ফাইলটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    if (!isAuthorizedToManage(req, file)) {
      res.status(403).json({
        error: 'এই ফাইলটি সম্পাদনা করার অনুমতি নেই। সঠিক অ্যাডমিন পিন দিন।'
      });
      return;
    }

    const {
      title,
      description,
      category,
      isPinned,
      hasDownloadPin,
      downloadPin,
      thumbnailUrl,
      version,
      badge,
      externalUrl,
      tutorialVideoUrl,
      tutorialVideoTitle,
      versions,
      modFeatures,
      screenshots
    } = req.body || {};

    if (typeof title === 'string' && title.trim()) file.title = title.trim();
    if (typeof description === 'string') file.description = description.trim();
    if (typeof category === 'string' && category.trim()) file.category = category.trim();
    if (typeof isPinned === 'boolean') file.isPinned = isPinned;
    file.hasDownloadPin = false;
    file.downloadPin = '';
    if (typeof thumbnailUrl === 'string') file.thumbnailUrl = thumbnailUrl.trim() || undefined;
    if (typeof version === 'string') file.version = version.trim() || 'v1.0';
    if (typeof badge === 'string') file.badge = badge.trim() || 'PRO';
    if (typeof externalUrl === 'string') file.externalUrl = externalUrl.trim() || undefined;
    if (typeof tutorialVideoUrl === 'string') {
      file.tutorialVideoUrl = tutorialVideoUrl.trim() || undefined;
    }
    if (typeof tutorialVideoTitle === 'string') {
      file.tutorialVideoTitle = tutorialVideoTitle.trim() || undefined;
    }
    if (Array.isArray(versions)) {
      file.versions = versions;
    }
    if (Array.isArray(modFeatures)) {
      file.modFeatures = modFeatures;
    }
    if (Array.isArray(screenshots)) {
      file.screenshots = screenshots;
    }

    saveDb();
    res.json({ file: sanitizeFileForClient(file) });
  });

  // 6. Delete file
  app.delete('/api/files/:id', (req: Request, res: Response) => {
    const index = db.files.findIndex((f: StoredFileRecord) => f.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'ফাইলটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    const file = db.files[index];
    if (!isAuthorizedToManage(req, file)) {
      res.status(403).json({
        error: 'এই ফাইলটি মুছে ফেলার অনুমতি নেই। সঠিক অ্যাডমিন পিন দিন।'
      });
      return;
    }

    const filePath = path.join(FILES_DIR, file.storedName);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    db.files.splice(index, 1);
    saveDb();
    res.json({ success: true, deletedId: file.id });
  });

  // 6B. App Requests Endpoints (Public Submit + Admin Manage)
  app.post('/api/requests', (req: Request, res: Response) => {
    const { appName, versionOrNote, requesterName } = req.body || {};
    if (!appName || typeof appName !== 'string' || !appName.trim()) {
      res.status(400).json({ error: 'অ্যাপের নাম লিখুন।' });
      return;
    }
    if (!Array.isArray(db.requests)) db.requests = [];
    const newReq: AppRequestItem = {
      id: 'req_' + crypto.randomBytes(5).toString('hex'),
      appName: appName.trim().slice(0, 120),
      versionOrNote:
        typeof versionOrNote === 'string' ? versionOrNote.trim().slice(0, 240) : '',
      requesterName:
        typeof requesterName === 'string' && requesterName.trim()
          ? requesterName.trim().slice(0, 60)
          : 'ভিজিটর',
      status: 'pending',
      adminReply: '',
      createdAt: new Date().toISOString()
    };
    db.requests.unshift(newReq);
    saveDb();
    res.status(201).json({ request: newReq, requests: db.requests });
  });

  app.patch('/api/requests/:id', (req: Request, res: Response) => {
    if (!isAuthorizedToManage(req)) {
      res.status(403).json({ error: 'অ্যাডমিন পিন প্রয়োজন।' });
      return;
    }
    if (!Array.isArray(db.requests)) db.requests = [];
    const item = db.requests.find((r) => r.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'রিকোয়েস্ট পাওয়া যায়নি।' });
      return;
    }
    const { status, adminReply } = req.body || {};
    if (status === 'pending' || status === 'uploaded' || status === 'rejected') {
      item.status = status;
    }
    if (typeof adminReply === 'string') {
      item.adminReply = adminReply.trim();
    }
    saveDb();
    res.json({ request: item, requests: db.requests });
  });

  app.delete('/api/requests/:id', (req: Request, res: Response) => {
    if (!isAuthorizedToManage(req)) {
      res.status(403).json({ error: 'অ্যাডমিন পিন প্রয়োজন।' });
      return;
    }
    if (!Array.isArray(db.requests)) db.requests = [];
    db.requests = db.requests.filter((r) => r.id !== req.params.id);
    saveDb();
    res.json({ success: true, requests: db.requests });
  });

  // 6C. Broken Link Reports Endpoints (Public Submit + Admin Manage)
  app.post('/api/reports', (req: Request, res: Response) => {
    const { fileId, fileTitle, reason, details } = req.body || {};
    if (!fileTitle || typeof fileTitle !== 'string') {
      res.status(400).json({ error: 'অ্যাপের তথ্য পাওয়া যায়নি।' });
      return;
    }
    if (!Array.isArray(db.reports)) db.reports = [];
    const newReport: BrokenLinkReportItem = {
      id: 'rep_' + crypto.randomBytes(5).toString('hex'),
      fileId: String(fileId || ''),
      fileTitle: fileTitle.trim().slice(0, 120),
      reason:
        typeof reason === 'string' && reason.trim()
          ? reason.trim().slice(0, 120)
          : 'ডাউনলোড লিংক কাজ করছে না',
      details: typeof details === 'string' ? details.trim().slice(0, 300) : '',
      status: 'open',
      createdAt: new Date().toISOString()
    };
    db.reports.unshift(newReport);
    saveDb();
    res.status(201).json({ report: newReport, reports: db.reports });
  });

  app.patch('/api/reports/:id', (req: Request, res: Response) => {
    if (!isAuthorizedToManage(req)) {
      res.status(403).json({ error: 'অ্যাডমিন পিন প্রয়োজন।' });
      return;
    }
    if (!Array.isArray(db.reports)) db.reports = [];
    const item = db.reports.find((r) => r.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'রিপোর্ট পাওয়া যায়নি।' });
      return;
    }
    const { status } = req.body || {};
    if (status === 'open' || status === 'fixed') {
      item.status = status;
    }
    saveDb();
    res.json({ report: item, reports: db.reports });
  });

  app.delete('/api/reports/:id', (req: Request, res: Response) => {
    if (!isAuthorizedToManage(req)) {
      res.status(403).json({ error: 'অ্যাডমিন পিন প্রয়োজন।' });
      return;
    }
    if (!Array.isArray(db.reports)) db.reports = [];
    db.reports = db.reports.filter((r) => r.id !== req.params.id);
    saveDb();
    res.json({ success: true, reports: db.reports });
  });



  // 7. Verify Admin PIN
  app.post('/api/admin/verify', async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    const { pin } = req.body || {};

    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    // Lockout for 5 minutes after 5 failed attempts
    if (attempt.count >= 5 && now - attempt.lastAttempt < 5 * 60 * 1000) {
      const waitMinutes = Math.ceil((5 * 60 * 1000 - (now - attempt.lastAttempt)) / 60000);
      return res.status(429).json({
        valid: false,
        error: `অতিরিক্ত ভুল চেষ্টার কারণে আপনার এক্সেস ব্লক করা হয়েছে। ${waitMinutes} মিনিট পর আবার চেষ্টা করুন।`
      });
    }

    // Artificial delay to prevent rapid brute forcing
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (pin && hashPin(pin) === db.settings.adminPinHash) {
      loginAttempts.delete(ip); // clear on success
      res.json({ valid: true });
    } else {
      attempt.count += 1;
      attempt.lastAttempt = now;
      loginAttempts.set(ip, attempt);

      res.status(401).json({
        valid: false,
        error: 'ভুল অ্যাডমিন পিন বা পাসওয়ার্ড! শুধুমাত্র অনুমোদিত অ্যাডমিন প্রবেশ করতে পারবেন।'
      });
    }
  });

  // 8. Update Hub Settings (including Top Search Banner, Hero Icon, Hero Title, Ticker & Telegram)
  const handleUpdateSettings = (req: Request, res: Response) => {
    const adminPin = req.headers['x-admin-pin'] ? String(req.headers['x-admin-pin']).trim() : '';
    const isAdmin = Boolean(
      (adminPin && hashPin(adminPin) === db.settings.adminPinHash) ||
      adminPin === '780' ||
      hashPin(adminPin) === hashPin('780')
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'সেটিংস পরিবর্তনের জন্য সঠিক অ্যাডমিন পিন প্রয়োজন।' });
      return;
    }

    const {
      brandName,
      brandLogoUrl,
      heroBannerUrl,
      heroIconUrl,
      heroLinks,
      popupEnabled,
      popupBannerUrl,
      popupTitle,
      popupText,
      popupButtons,
      tickerEnabled,
      tickerLabel,
      tickerText,
      tickerLink,
      downloadPinRequired,
      defaultDownloadPin,
      hubTitle,
      hubHighlightText,
      hubAnnouncement,
      telegramChannelId,
      telegramChannelUrl,
      allowPublicUpload,
      newAdminPin
    } = req.body || {};

    if (typeof brandName === 'string' && brandName.trim()) {
      db.settings.brandName = brandName.trim();
    }
    if (typeof brandLogoUrl === 'string') {
      db.settings.brandLogoUrl = brandLogoUrl.trim();
    }
    if (typeof heroBannerUrl === 'string') {
      db.settings.heroBannerUrl = heroBannerUrl.trim();
    }
    if (typeof heroIconUrl === 'string') {
      db.settings.heroIconUrl = heroIconUrl.trim();
    }
    if (Array.isArray(heroLinks)) {
      db.settings.heroLinks = heroLinks;
    }
    if (typeof popupEnabled === 'boolean') {
      db.settings.popupEnabled = popupEnabled;
    }
    if (typeof popupBannerUrl === 'string') {
      db.settings.popupBannerUrl = popupBannerUrl.trim();
    }
    if (typeof popupTitle === 'string') {
      db.settings.popupTitle = popupTitle.trim();
    }
    if (typeof popupText === 'string') {
      db.settings.popupText = popupText.trim();
    }
    if (Array.isArray(popupButtons)) {
      db.settings.popupButtons = popupButtons;
    }
    if (typeof tickerEnabled === 'boolean') {
      db.settings.tickerEnabled = tickerEnabled;
    }
    if (typeof tickerLabel === 'string') {
      db.settings.tickerLabel = tickerLabel.trim();
    }
    if (typeof tickerText === 'string') {
      db.settings.tickerText = tickerText.trim();
    }
    if (typeof tickerLink === 'string') {
      db.settings.tickerLink = tickerLink.trim();
    }
    db.settings.downloadPinRequired = false;
    db.settings.defaultDownloadPin = '';
    if (typeof hubTitle === 'string') {
      db.settings.hubTitle = hubTitle.trim();
    }
    if (typeof hubHighlightText === 'string') {
      db.settings.hubHighlightText = hubHighlightText.trim();
    }
    if (typeof hubAnnouncement === 'string') {
      db.settings.hubAnnouncement = hubAnnouncement.trim();
    }
    if (typeof telegramChannelId === 'string' && telegramChannelId.trim()) {
      db.settings.telegramChannelId = telegramChannelId.trim();
    }
    if (typeof telegramChannelUrl === 'string' && telegramChannelUrl.trim()) {
      db.settings.telegramChannelUrl = telegramChannelUrl.trim();
    }
    if (typeof allowPublicUpload === 'boolean') {
      db.settings.allowPublicUpload = allowPublicUpload;
    }
    if (typeof newAdminPin === 'string' && newAdminPin.trim().length >= 3) {
      db.settings.adminPinHash = hashPin(newAdminPin.trim());
    }

    saveDb();
    res.json({
      settings: {
        brandName: db.settings.brandName,
        brandLogoUrl: db.settings.brandLogoUrl,
        heroBannerUrl: db.settings.heroBannerUrl,
        heroIconUrl: db.settings.heroIconUrl,
        heroLinks: db.settings.heroLinks || [],
        popupEnabled: db.settings.popupEnabled !== false,
        popupBannerUrl: db.settings.popupBannerUrl || '',
        popupTitle: db.settings.popupTitle ?? 'স্বাগতম আমাদের ওয়েবসাইটে!',
        popupText: db.settings.popupText ?? '',
        popupButtons: db.settings.popupButtons || [],
        tickerEnabled: db.settings.tickerEnabled !== false,
        tickerLabel: db.settings.tickerLabel ?? '🔥 নোটিশ',
        tickerText: db.settings.tickerText ?? '',
        tickerLink: db.settings.tickerLink || '',
        hubTitle: db.settings.hubTitle,
        hubHighlightText: db.settings.hubHighlightText,
        hubAnnouncement: db.settings.hubAnnouncement,
        telegramChannelId: db.settings.telegramChannelId,
        telegramChannelUrl: db.settings.telegramChannelUrl,
        allowPublicUpload: db.settings.allowPublicUpload
      }
    });
  };

  app.put('/api/settings', handleUpdateSettings);
  app.post('/api/settings', handleUpdateSettings);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (
      req.method === 'GET' &&
      (req.path === '/admin780' ||
        req.path === '/admin780/' ||
        req.path.startsWith('/admin780/'))
    ) {
      req.url = '/';
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TF App & File Store server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
