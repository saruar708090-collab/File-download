export type FileCategory =
  | 'Apps'
  | 'Photo Editing'
  | 'Video Editing'
  | 'Tools & Files'
  | 'Others';

export interface DownloadButtonConfig {
  id: string;
  label: string;
  mode?: 'file' | 'link'; // 'file' = Fast Download directly to File Manager, 'link' = Direct Download external URL
  url: string;
  fileName?: string;
  color?: 'violet' | 'emerald' | 'sky' | 'amber';
  isDisabled?: boolean;
  disabledMessage?: string;
}

export interface AppVersionItem {
  id: string;
  title: string;
  sizeText: string;
  badge?: string;
  buttons: DownloadButtonConfig[];
}

export interface VaultFile {
  id: string;
  originalName: string;
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
  downloadPin?: string;
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
  requireTelegramJoin?: boolean;
  unlockTelegramUrl?: string;
}

export interface AppRequestItem {
  id: string;
  appName: string;
  versionOrNote?: string;
  requesterName?: string;
  status: 'pending' | 'uploaded' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

export interface BrokenLinkReportItem {
  id: string;
  fileId: string;
  fileTitle: string;
  reason: string;
  details?: string;
  status: 'open' | 'fixed';
  createdAt: string;
}

export interface HubSettings {
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
  downloadPinRequired?: boolean;
  defaultDownloadPin?: string;
  hubTitle: string;
  hubHighlightText: string;
  hubAnnouncement: string;
  telegramChannelId: string;
  telegramChannelUrl: string;
  allowPublicUpload: boolean;
  totalVisitors?: number;
}

export interface HubStats {
  totalFiles: number;
  totalBytes: number;
  totalDownloads: number;
  totalVisitors?: number;
  activeUsers?: number;
}

export const STORE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Apps', label: 'Apps' },
  { id: 'Photo Editing', label: 'Photo Editing' },
  { id: 'Video Editing', label: 'Video Editing' },
  { id: 'Tools & Files', label: 'Tools & Files' }
];

export const CATEGORY_LABELS: Record<string, { bn: string; en: string }> = {
  All: { bn: 'সব অ্যাপস ও ফাইল', en: 'All' },
  Apps: { bn: 'অ্যাপস', en: 'Apps' },
  'Photo Editing': { bn: 'ফটো এডিটিং', en: 'Photo Editing' },
  'Video Editing': { bn: 'ভিডিও এডিটিং', en: 'Video Editing' },
  'Tools & Files': { bn: 'টুলস ও ফাইল', en: 'Tools & Files' },
  Others: { bn: 'অন্যান্য', en: 'Others' }
};

export function createDefaultVersions(
  mainVersion = 'v18.80',
  externalUrl = ''
): AppVersionItem[] {
  return [
    {
      id: 'ver_latest',
      title: `Latest Version (${mainVersion})`,
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

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val >= 100 || i === 0 ? val.toFixed(0) : val.toFixed(2)} ${units[i]}`;
}

export function formatDateBn(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getFileExtension(filename: string): string {
  const parts = (filename || '').split('.');
  if (parts.length <= 1) return 'APK';
  return parts[parts.length - 1].toUpperCase().slice(0, 6);
}
