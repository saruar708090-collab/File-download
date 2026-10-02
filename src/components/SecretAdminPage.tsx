import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Pin,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  Save,
  Plus,
  Edit3,
  Image as ImageIcon,
  Link as LinkIcon,
  Layers,
  Video,
  FolderUp,
  Sparkles,
  MessageSquarePlus,
  Flag,
  Megaphone,
  X
} from 'lucide-react';
import {
  VaultFile,
  HubSettings,
  AppVersionItem,
  DownloadButtonConfig,
  AppRequestItem,
  BrokenLinkReportItem,
  createDefaultVersions,
  formatBytes,
  formatDateBn
} from '../types';

interface QueuedUploadItem {
  localId: string;
  file: File;
  title: string;
  description: string;
  category: string;
  version: string;
  badge: string;
  thumbnailUrl: string;
  tutorialVideoUrl: string;
  tutorialVideoTitle: string;
  downloadPin: string;
  isPinned: boolean;
  versions: AppVersionItem[];
  modFeatures: string[];
  screenshots: string[];
  progress: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

interface SecretAdminPageProps {
  files: VaultFile[];
  requests: AppRequestItem[];
  reports: BrokenLinkReportItem[];
  settings: HubSettings;
  adminPin: string;
  onSetAdminPin: (pin: string) => void;
  onExitAdmin: () => void;
  onRefreshData: () => void;
  onUpdateSettings: (newSettings: HubSettings) => void;
  onUpdateFile: (
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
  ) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
}

// Helper to upload a standalone binary asset (APK file for a button OR MP4 tutorial video)
function uploadStandaloneAsset(
  file: File,
  adminPin: string,
  onProgress?: (pct: number) => void
): Promise<{ url: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/assets/upload', true);

    const utf8Bytes = new TextEncoder().encode(file.name);
    let binaryStr = '';
    utf8Bytes.forEach((b) => {
      binaryStr += String.fromCharCode(b);
    });
    xhr.setRequestHeader('X-Asset-Filename', btoa(binaryStr));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    if (adminPin) {
      xhr.setRequestHeader('X-Admin-Pin', adminPin);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.url, fileName: data.fileName || file.name });
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(file);
  });
}

// Reusable Editor for Serial APK Versions (Latest Version, New Version, etc.) & Direct/Fast Download Buttons
const VersionsAndButtonsEditor: React.FC<{
  versions: AppVersionItem[];
  adminPin: string;
  onChange: (updated: AppVersionItem[]) => void;
}> = ({ versions, adminPin, onChange }) => {
  const [uploadingBtnKey, setUploadingBtnKey] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);

  const addVersion = () => {
    const presetNames = [
      'Latest Version (Unlocked Pro)',
      'New Version (Mod APK)',
      'Old Version (Stable Lite)',
      'VIP Pro Version'
    ];
    const nextTitle = presetNames[versions.length % presetNames.length];
    const newVer: AppVersionItem = {
      id: 'ver_' + Math.random().toString(36).slice(2, 8),
      title: nextTitle,
      sizeText: '85.0 MB',
      badge: versions.length === 0 ? 'LATEST' : 'NEW',
      buttons: [
        {
          id: 'btn_' + Math.random().toString(36).slice(2, 8),
          label: 'Direct Download',
          mode: 'link',
          url: 'https://t.me/TF_Official_Channel',
          color: 'violet'
        },
        {
          id: 'btn_' + Math.random().toString(36).slice(2, 8),
          label: 'Fast Download',
          mode: 'file',
          url: '',
          color: 'emerald'
        }
      ]
    };
    onChange([...versions, newVer]);
  };

  const updateVersionField = (
    verId: string,
    field: keyof AppVersionItem,
    value: string | DownloadButtonConfig[]
  ) => {
    onChange(
      versions.map((v) => (v.id === verId ? { ...v, [field]: value } : v))
    );
  };

  const removeVersion = (verId: string) => {
    onChange(versions.filter((v) => v.id !== verId));
  };

  const addButtonToVersion = (verId: string, mode: 'link' | 'file') => {
    const target = versions.find((v) => v.id === verId);
    if (!target) return;
    const newBtn: DownloadButtonConfig =
      mode === 'link'
        ? {
            id: 'btn_' + Math.random().toString(36).slice(2, 8),
            label: 'Direct Download',
            mode: 'link',
            url: '',
            color: 'violet'
          }
        : {
            id: 'btn_' + Math.random().toString(36).slice(2, 8),
            label: 'Fast Download',
            mode: 'file',
            url: '',
            color: 'emerald'
          };
    updateVersionField(verId, 'buttons', [...(target.buttons || []), newBtn]);
  };

  const updateButtonInVersion = (
    verId: string,
    btnId: string,
    patch: Partial<DownloadButtonConfig>
  ) => {
    const target = versions.find((v) => v.id === verId);
    if (!target) return;
    const nextBtns = (target.buttons || []).map((b) =>
      b.id === btnId ? { ...b, ...patch } : b
    );
    updateVersionField(verId, 'buttons', nextBtns);
  };

  const removeButtonFromVersion = (verId: string, btnId: string) => {
    const target = versions.find((v) => v.id === verId);
    if (!target) return;
    const nextBtns = (target.buttons || []).filter((b) => b.id !== btnId);
    updateVersionField(verId, 'buttons', nextBtns);
  };

  const handleButtonFileUpload = async (verId: string, btnId: string, file: File) => {
    const key = `${verId}_${btnId}`;
    setUploadingBtnKey(key);
    setUploadPct(0);
    try {
      const uploaded = await uploadStandaloneAsset(file, adminPin, (pct) => setUploadPct(pct));
      updateButtonInVersion(verId, btnId, {
        mode: 'file',
        url: uploaded.url,
        fileName: uploaded.fileName
      });
    } catch {
      // ignore
    } finally {
      setUploadingBtnKey(null);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#09090D] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-white">
            ভার্সন লিস্ট (চাইলে শুধু ১টি Latest Version বা একাধিক ভার্সন রাখতে পারবেন)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {versions.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([versions[0]])}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/40"
            >
              শুধু ১টি ভার্সন (Latest) রাখুন
            </button>
          )}
          <button
            type="button"
            onClick={addVersion}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
          >
            <Plus className="h-3.5 w-3.5" /> নতুন Version যোগ করুন
          </button>
        </div>
      </div>

      {versions.map((ver, vIndex) => (
        <div
          key={ver.id || vIndex}
          className="space-y-3 rounded-xl border border-zinc-800 bg-[#121218] p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold text-violet-400">
              সিরিয়াল #{vIndex + 1} · {ver.title}
            </span>
            {versions.length > 1 && (
              <button
                type="button"
                onClick={() => removeVersion(ver.id)}
                className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline"
              >
                <Trash2 className="h-3 w-3" /> এই ভার্সন মুছুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-zinc-400">
                ভার্সনের নাম (যেমন: Latest Version / New Version)
              </label>
              <input
                type="text"
                value={ver.title}
                onChange={(e) => updateVersionField(ver.id, 'title', e.target.value)}
                placeholder="Latest Version (v18.80)"
                className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400">ফাইল সাইজ (যেমন: 86.4 MB)</label>
              <input
                type="text"
                value={ver.sizeText}
                onChange={(e) => updateVersionField(ver.id, 'sizeText', e.target.value)}
                placeholder="86.4 MB"
                className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400">ব্যাজ (LATEST / NEW)</label>
              <input
                type="text"
                value={ver.badge || ''}
                onChange={(e) => updateVersionField(ver.id, 'badge', e.target.value)}
                placeholder="LATEST"
                className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-emerald-400"
              />
            </div>
          </div>

          {/* Buttons inside this Version (Step 2 Page Buttons) */}
          <div className="rounded-lg border border-zinc-800/90 bg-black/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
              <span className="text-[11px] font-semibold text-zinc-300">
                ২য় পেজের বাটন: <strong className="text-violet-400">Direct Download</strong> (লিংক থাকবে) এবং <strong className="text-emerald-400">Fast Download</strong> (সরাসরি ফাইল ম্যানেজারে ডাউনলোড হবে):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addButtonToVersion(ver.id, 'link')}
                  className="inline-flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-violet-500"
                >
                  <Plus className="h-3 w-3" /> লিংক বাটন (Direct)
                </button>
                <button
                  type="button"
                  onClick={() => addButtonToVersion(ver.id, 'file')}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                >
                  <Plus className="h-3 w-3" /> ফাইল বাটন (Fast)
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {(ver.buttons || []).map((btn, bIndex) => {
                const isUploadingThis = uploadingBtnKey === `${ver.id}_${btn.id}`;
                const resolvedMode: 'file' | 'link' =
                  btn.mode ||
                  (btn.label.toLowerCase().includes('fast') ? 'file' : 'link');

                return (
                  <div
                    key={btn.id || bIndex}
                    className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-800/80 bg-[#0D0D12] p-2.5 sm:grid-cols-12"
                  >
                    {/* Button Name */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-zinc-400 mb-0.5">বাটনের নাম</label>
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) =>
                          updateButtonInVersion(ver.id, btn.id, { label: e.target.value })
                        }
                        placeholder={resolvedMode === 'link' ? 'Direct Download' : 'Fast Download'}
                        className="w-full rounded border border-zinc-700 bg-[#121218] px-2.5 py-1.5 text-xs font-semibold text-white"
                      />
                    </div>

                    {/* Mode Selector: Link vs Direct File Manager */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-zinc-400 mb-0.5">কাজের ধরন</label>
                      <select
                        value={resolvedMode}
                        onChange={(e) => {
                          const nextMode = e.target.value as 'file' | 'link';
                          updateButtonInVersion(ver.id, btn.id, {
                            mode: nextMode,
                            color: nextMode === 'file' ? 'emerald' : 'violet'
                          });
                        }}
                        className="w-full rounded border border-zinc-700 bg-[#121218] px-2 py-1.5 text-[11px] font-semibold text-white"
                      >
                        <option value="link">লিংক (Direct Link)</option>
                        <option value="file">ফাইল ম্যানেজার (Fast)</option>
                      </select>
                    </div>

                    {/* Conditional Input: Link URL vs Direct File Manager Upload */}
                    <div className="sm:col-span-4">
                      {resolvedMode === 'link' ? (
                        <div>
                          <label className="block text-[10px] text-violet-400 mb-0.5">
                            Direct Download লিংক (URL) দিন
                          </label>
                          <input
                            type="text"
                            value={btn.url}
                            onChange={(e) =>
                              updateButtonInVersion(ver.id, btn.id, { url: e.target.value })
                            }
                            placeholder="https://drive.google.com/... বা যেকোনো লিংক"
                            className="w-full rounded border border-violet-500/40 bg-[#121218] px-2.5 py-1.5 font-mono text-xs text-zinc-100"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] text-emerald-400 mb-0.5">
                            সরাসরি ফাইল ম্যানেজারে ডাউনলোডের ফাইল
                          </label>
                          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40">
                            <FolderUp className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {isUploadingThis
                                ? `আপলোড হচ্ছে ${uploadPct}%`
                                : btn.fileName
                                ? `ফাইল: ${btn.fileName}`
                                : 'ফাইল ম্যানেজার থেকে ফাইল দিন (বা মূল APK নামবে)'}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleButtonFileUpload(ver.id, btn.id, f);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Button Color */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-zinc-400 mb-0.5">রঙ (Color)</label>
                      <select
                        value={btn.color || (resolvedMode === 'file' ? 'emerald' : 'violet')}
                        onChange={(e) =>
                          updateButtonInVersion(ver.id, btn.id, {
                            color: e.target.value as DownloadButtonConfig['color']
                          })
                        }
                        className="w-full rounded border border-zinc-700 bg-[#121218] px-2 py-1.5 text-xs text-white"
                      >
                        <option value="violet">বেগুনি (Purple)</option>
                        <option value="emerald">সবুজ (Green)</option>
                        <option value="sky">নীল (Blue)</option>
                        <option value="amber">কমলা (Orange)</option>
                      </select>
                    </div>

                    <div className="flex justify-end sm:col-span-1 pt-3">
                      <button
                        type="button"
                        onClick={() => removeButtonFromVersion(ver.id, btn.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400"
                        title="বাটন মুছুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reusable Editor for "How to Use" Tutorial Video inside an App
const TutorialVideoEditor: React.FC<{
  videoUrl: string;
  videoTitle: string;
  adminPin: string;
  onChangeUrl: (url: string) => void;
  onChangeTitle: (title: string) => void;
}> = ({ videoUrl, videoTitle, adminPin, onChangeUrl, onChangeTitle }) => {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPct, setVideoPct] = useState(0);

  const handleVideoFileSelect = async (file: File) => {
    setUploadingVideo(true);
    setVideoPct(0);
    try {
      const res = await uploadStandaloneAsset(file, adminPin, (pct) => setVideoPct(pct));
      onChangeUrl(res.url);
    } catch {
      // ignore
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-[#09090D] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">
            অ্যাপটি কিভাবে ব্যবহার করবে তার ভিডিও (How to Use Tutorial Video)
          </span>
        </div>
        {videoUrl && (
          <button
            type="button"
            onClick={() => onChangeUrl('')}
            className="text-[11px] text-red-400 hover:underline"
          >
            ভিডিও মুছুন
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label className="block text-[11px] text-zinc-400">ভিডিওর শিরোনাম</label>
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="অ্যাপটি কিভাবে ব্যবহার করবেন দেখুন"
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
          />
        </div>

        <div className="sm:col-span-5">
          <label className="block text-[11px] text-zinc-400">
            YouTube লিংক অথবা ভিডিও লিংক দিন
          </label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://youtu.be/... বা পাশের বাটনে ভিডিও ফাইল দিন"
            className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-zinc-200"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] text-zinc-400">গ্যালারি/ফাইল থেকে ভিডিও</label>
          <label className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40">
            <Video className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {uploadingVideo
                ? `আপলোড হচ্ছে ${videoPct}%`
                : videoUrl.startsWith('/api/assets/')
                ? 'ভিডিও যুক্ত হয়েছে'
                : 'ভিডিও আপলোড'}
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  handleVideoFileSelect(f);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// Reusable Editor for Mod Features List & App Screenshot Gallery
const PRESET_MOD_FEATURES = [
  'Premium / Pro Unlocked',
  'No Watermark (ওয়াটারমার্ক ছাড়া)',
  '100% Ads Removed (বিজ্ঞাপনমুক্ত)',
  '4K 60FPS Ultra HD Export',
  'All VIP Filters & Templates Open',
  'AI Enhancer & Pro Tools Open'
];

const ModFeaturesAndScreenshotsEditor: React.FC<{
  modFeatures: string[];
  screenshots: string[];
  adminPin: string;
  onChangeModFeatures: (updated: string[]) => void;
  onChangeScreenshots: (updated: string[]) => void;
}> = ({
  modFeatures,
  screenshots,
  adminPin,
  onChangeModFeatures,
  onChangeScreenshots
}) => {
  const [customFeat, setCustomFeat] = useState('');
  const [shotUrlInput, setShotUrlInput] = useState('');
  const [uploadingShot, setUploadingShot] = useState(false);

  const addFeature = (feat: string) => {
    const trimmed = feat.trim();
    if (!trimmed) return;
    if (!modFeatures.includes(trimmed)) {
      onChangeModFeatures([...modFeatures, trimmed]);
    }
    setCustomFeat('');
  };

  const removeFeature = (idx: number) => {
    onChangeModFeatures(modFeatures.filter((_, i) => i !== idx));
  };

  const handleUploadScreenshots = async (fileList: FileList) => {
    setUploadingShot(true);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const res = await uploadStandaloneAsset(file, adminPin);
        uploadedUrls.push(res.url);
      } catch {
        // Fallback to Data URL if needed
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(file);
        });
        if (dataUrl) uploadedUrls.push(dataUrl);
      }
    }
    if (uploadedUrls.length > 0) {
      onChangeScreenshots([...screenshots, ...uploadedUrls]);
    }
    setUploadingShot(false);
  };

  const addScreenshotUrl = () => {
    const trimmed = shotUrlInput.trim();
    if (!trimmed) return;
    onChangeScreenshots([...screenshots, trimmed]);
    setShotUrlInput('');
  };

  const removeScreenshot = (idx: number) => {
    onChangeScreenshots(screenshots.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#09090D] p-4">
      {/* 1. Mod Features List Editor */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              মড ও আনলকড ফিচার লিস্ট (Mod Features List)
            </span>
          </div>
          {modFeatures.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeModFeatures([])}
              className="text-[11px] text-red-400 hover:underline"
            >
              সব মুছুন
            </button>
          )}
        </div>

        {/* Quick Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_MOD_FEATURES.map((preset) => {
            const active = modFeatures.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  active
                    ? onChangeModFeatures(modFeatures.filter((m) => m !== preset))
                    : addFeature(preset)
                }
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-zinc-800 bg-[#121218] text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {active ? '✓ ' : '+ '}
                {preset}
              </button>
            );
          })}
        </div>

        {/* Custom Mod Feature Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customFeat}
            onChange={(e) => setCustomFeat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature(customFeat);
              }
            }}
            placeholder="নিজের মতো মড ফিচার লিখুন (যেমন: All Coins Unlimited)..."
            className="w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
          />
          <button
            type="button"
            onClick={() => addFeature(customFeat)}
            className="shrink-0 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            + যোগ করুন
          </button>
        </div>

        {/* Added Features List */}
        {modFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {modFeatures.map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>{feat}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="ml-1 text-zinc-400 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. App Screenshot Gallery Editor */}
      <div className="space-y-2.5 border-t border-zinc-800 pt-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold text-white">
              অ্যাপের স্ক্রিনশট গ্যালারি (App Screenshots — {screenshots.length}টি)
            </span>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-950/30 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-900/40">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>
              {uploadingShot ? 'স্ক্রিনশট আপলোড হচ্ছে...' : '+ গ্যালারি থেকে স্ক্রিনশট দিন'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleUploadScreenshots(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={shotUrlInput}
            onChange={(e) => setShotUrlInput(e.target.value)}
            placeholder="অথবা স্ক্রিনশট ছবির ডিরেক্ট লিংক (URL) দিন..."
            className="w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-zinc-200"
          />
          <button
            type="button"
            onClick={addScreenshotUrl}
            className="shrink-0 rounded bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
          >
            লিংক যোগ করুন
          </button>
        </div>

        {screenshots.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1">
            {screenshots.map((shot, idx) => (
              <div
                key={idx}
                className="relative h-28 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-black"
              >
                <img
                  src={shot}
                  alt={`Screenshot ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(idx)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-red-400 hover:bg-red-600 hover:text-white"
                  title="স্ক্রিনশট মুছুন"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SecretAdminPage: React.FC<SecretAdminPageProps> = ({
  files,
  requests,
  reports,
  settings,
  adminPin,
  onSetAdminPin,
  onExitAdmin,
  onRefreshData,
  onUpdateSettings,
  onUpdateFile,
  onDeleteFile
}) => {
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'settings' | 'requests'>(
    'upload'
  );
  const [uploadMode, setUploadMode] = useState<'binary' | 'link'>('binary');

  // Upload queue state (Default mode so uploaded APK downloads directly to File Manager!)
  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Direct App Card + Multi-Version Creator State
  const [linkTitle, setLinkTitle] = useState('');
  const [linkVersion, setLinkVersion] = useState('v18.80');
  const [linkBadge, setLinkBadge] = useState('PRO');
  const [linkCategory, setLinkCategory] = useState('Apps');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkThumbnailUrl, setLinkThumbnailUrl] = useState('');
  const [linkTutorialVideoUrl, setLinkTutorialVideoUrl] = useState('');
  const [linkTutorialVideoTitle, setLinkTutorialVideoTitle] = useState(
    'অ্যাপটি কিভাবে ইনস্টল ও ব্যবহার করবেন দেখুন (Video Tutorial)'
  );
  const [linkVersions, setLinkVersions] = useState<AppVersionItem[]>(() =>
    createDefaultVersions('v18.80', '')
  );
  const [linkModFeatures, setLinkModFeatures] = useState<string[]>([
    'Premium / Pro Unlocked',
    'No Watermark (ওয়াটারমার্ক ছাড়া)',
    '100% Ads Removed (বিজ্ঞাপনমুক্ত)'
  ]);
  const [linkScreenshots, setLinkScreenshots] = useState<string[]>([]);
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  // Manage files state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editBadge, setEditBadge] = useState('PRO');
  const [editCategory, setEditCategory] = useState('Apps');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editTutorialVideoUrl, setEditTutorialVideoUrl] = useState('');
  const [editTutorialVideoTitle, setEditTutorialVideoTitle] = useState('');
  const [editVersions, setEditVersions] = useState<AppVersionItem[]>([]);
  const [editModFeatures, setEditModFeatures] = useState<string[]>([]);
  const [editScreenshots, setEditScreenshots] = useState<string[]>([]);

  // Reply input state for App Requests
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Store, Top Search Banner, Direct Link Buttons, Ticker & Telegram settings state
  const [brandName, setBrandName] = useState(settings.brandName || 'TF OFFICIAL');
  const [brandLogoUrl, setBrandLogoUrl] = useState(settings.brandLogoUrl || '');
  const [heroBannerUrl, setHeroBannerUrl] = useState(settings.heroBannerUrl || '');
  const [heroIconUrl, setHeroIconUrl] = useState(settings.heroIconUrl || '');
  const [heroLinks, setHeroLinks] = useState<DownloadButtonConfig[]>(() => {
    if (Array.isArray(settings.heroLinks) && settings.heroLinks.length > 0) {
      return settings.heroLinks;
    }
    if (settings.heroIconUrl && settings.heroIconUrl.startsWith('http')) {
      return [
        {
          id: 'hero_btn_1',
          label: 'Direct Link / Join Telegram',
          mode: 'link',
          url: settings.heroIconUrl,
          color: 'violet'
        }
      ];
    }
    return [
      {
        id: 'hero_btn_1',
        label: 'Direct Link / Join Telegram',
        mode: 'link',
        url: '',
        color: 'violet'
      }
    ];
  });
  const [popupEnabled, setPopupEnabled] = useState<boolean>(settings.popupEnabled !== false);
  const [popupBannerUrl, setPopupBannerUrl] = useState<string>(settings.popupBannerUrl || '');
  const [popupTitle, setPopupTitle] = useState<string>(
    settings.popupTitle ?? 'স্বাগতম আমাদের ওয়েবসাইটে!'
  );
  const [popupText, setPopupText] = useState<string>(
    settings.popupText ??
      'সকল নতুন প্রিমিয়াম অ্যাপস ও আপডেট সবার আগে পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।'
  );
  const [popupButtons, setPopupButtons] = useState<DownloadButtonConfig[]>(() => {
    if (Array.isArray(settings.popupButtons) && settings.popupButtons.length > 0) {
      return settings.popupButtons;
    }
    return [
      {
        id: 'popup_btn_1',
        label: 'Join Telegram Channel',
        mode: 'link',
        url: settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel',
        color: 'violet'
      }
    ];
  });
  const [tickerEnabled, setTickerEnabled] = useState<boolean>(settings.tickerEnabled !== false);
  const [tickerLabel, setTickerLabel] = useState<string>(settings.tickerLabel ?? '🔥 নোটিশ');
  const [tickerText, setTickerText] = useState<string>(
    settings.tickerText ??
      'সকল নতুন প্রিমিয়াম ও আনলকড প্রো অ্যাপস একদম ফ্রিতে ডাউনলোড করুন! কোনো অ্যাপ না পেলে "অ্যাপ রিকোয়েস্ট" বাটনে ক্লিক করে জানান — দ্রুত আপলোড করে দেওয়া হবে।'
  );
  const [tickerLink, setTickerLink] = useState<string>(settings.tickerLink || '');
  const [hubTitle, setHubTitle] = useState(settings.hubTitle || 'Welcome to');
  const [hubHighlightText, setHubHighlightText] = useState(
    settings.hubHighlightText || 'Our Website'
  );
  const [hubAnnouncement, setHubAnnouncement] = useState(settings.hubAnnouncement);
  const [telegramChannelId, setTelegramChannelId] = useState(
    settings.telegramChannelId || '@TF_Official_Channel'
  );
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(
    settings.telegramChannelUrl || 'https://t.me/TF_Official_Channel'
  );
  const [newAdminPin, setNewAdminPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        onSetAdminPin(pinInput.trim());
      } else {
        setAuthError(
          data.error || 'ভুল অ্যাডমিন পিন বা পাসওয়ার্ড! শুধুমাত্র অনুমোদিত অ্যাডমিন প্রবেশ করতে পারবেন।'
        );
      }
    } catch {
      setAuthError('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setVerifying(false);
    }
  };

  const addFilesToQueue = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).map((f) => {
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1) + ' MB';
      const defaultVers = createDefaultVersions('v18.80', '');
      defaultVers[0].sizeText = sizeMb;
      return {
        localId: Math.random().toString(36).slice(2, 10),
        file: f,
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
        description: '',
        category: 'Apps',
        version: 'v18.80',
        badge: 'PRO',
        thumbnailUrl: '',
        tutorialVideoUrl: '',
        tutorialVideoTitle: 'অ্যাপটি কিভাবে ইনস্টল ও ব্যবহার করবেন দেখুন (Video Tutorial)',
        downloadPin: '',
        isPinned: false,
        versions: defaultVers,
        modFeatures: [
          'Premium / Pro Unlocked',
          'No Watermark (ওয়াটারমার্ক ছাড়া)',
          '100% Ads Removed (বিজ্ঞাপনমুক্ত)'
        ],
        screenshots: [],
        progress: 0,
        status: 'idle' as const
      };
    });
    setQueue((prev) => [...prev, ...incoming]);
  };

  const updateQueueItem = (localId: string, patch: Partial<QueuedUploadItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  };

  const handleCoverImageUpload = (localId: string, imgFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateQueueItem(localId, { thumbnailUrl: reader.result });
      }
    };
    reader.readAsDataURL(imgFile);
  };

  const uploadSingleItem = (item: QueuedUploadItem): Promise<boolean> => {
    return new Promise((resolve) => {
      updateQueueItem(item.localId, { status: 'uploading', progress: 0, errorMsg: undefined });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files/upload', true);

      const metadata = {
        originalName: item.file.name,
        title: item.title.trim() || item.file.name,
        description: item.description.trim(),
        category: item.category,
        mimeType: item.file.type || 'application/vnd.android.package-archive',
        uploaderName: 'TF Admin',
        downloadPin: item.downloadPin.trim(),
        isPinned: item.isPinned,
        version: item.version.trim() || 'v1.0.0',
        badge: item.badge.trim() || 'PRO',
        thumbnailUrl: item.thumbnailUrl.trim(),
        tutorialVideoUrl: item.tutorialVideoUrl.trim(),
        tutorialVideoTitle: item.tutorialVideoTitle.trim(),
        versions: item.versions,
        modFeatures: item.modFeatures,
        screenshots: item.screenshots
      };

      const utf8Bytes = new TextEncoder().encode(JSON.stringify(metadata));
      let binaryStr = '';
      utf8Bytes.forEach((b) => {
        binaryStr += String.fromCharCode(b);
      });
      const base64Meta = btoa(binaryStr);

      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('X-File-Metadata', base64Meta);
      if (adminPin) {
        xhr.setRequestHeader('X-Admin-Pin', adminPin);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          updateQueueItem(item.localId, { progress: pct });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateQueueItem(item.localId, { status: 'done', progress: 100 });
          resolve(true);
        } else {
          let errText = 'আপলোড ব্যর্থ হয়েছে।';
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error) errText = parsed.error;
          } catch {}
          updateQueueItem(item.localId, { status: 'error', errorMsg: errText });
          resolve(false);
        }
      };

      xhr.onerror = () => {
        updateQueueItem(item.localId, {
          status: 'error',
          errorMsg: 'নেটওয়ার্ক সংযোগ বিচ্ছিন্ন হয়েছে।'
        });
        resolve(false);
      };

      xhr.send(item.file);
    });
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((q) => q.status === 'idle' || q.status === 'error');
    if (pending.length === 0) return;

    setIsUploadingAll(true);
    let successCount = 0;
    for (const item of pending) {
      const ok = await uploadSingleItem(item);
      if (ok) successCount++;
    }
    setIsUploadingAll(false);
    if (successCount > 0) {
      onRefreshData();
      showBanner(`${successCount}টি অ্যাপ/ফাইল সফলভাবে ওয়েবসাইটে যুক্ত হয়েছে!`);
    }
  };

  const handleCreateLinkProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim()) return;
    setLinkSubmitting(true);
    try {
      const res = await fetch('/api/files/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': adminPin
        },
        body: JSON.stringify({
          filename: `${linkTitle.trim().replace(/\s+/g, '_')}.apk`,
          title: linkTitle.trim(),
          version: linkVersion.trim() || 'v18.80',
          badge: linkBadge.trim() || 'PRO',
          category: linkCategory,
          description: linkDescription.trim(),
          thumbnailUrl: linkThumbnailUrl.trim(),
          tutorialVideoUrl: linkTutorialVideoUrl.trim(),
          tutorialVideoTitle: linkTutorialVideoTitle.trim(),
          versions: linkVersions,
          modFeatures: linkModFeatures,
          screenshots: linkScreenshots,
          content: linkDescription.trim() || linkTitle.trim()
        })
      });
      if (res.ok) {
        setLinkTitle('');
        setLinkDescription('');
        setLinkThumbnailUrl('');
        setLinkTutorialVideoUrl('');
        setLinkVersions(createDefaultVersions('v18.80', ''));
        setLinkScreenshots([]);
        onRefreshData();
        showBanner('নতুন অ্যাপ, মড ফিচার, স্ক্রিনশট ও ভার্সন সফলভাবে প্রকাশিত হয়েছে!');
      }
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const cleanedHeroLinks = heroLinks.filter((b) => b.url && b.url.trim().length > 0);
      const cleanedPopupButtons = popupButtons.filter((b) => b.url && b.url.trim().length > 0);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': adminPin
        },
        body: JSON.stringify({
          brandName,
          brandLogoUrl,
          heroBannerUrl,
          heroIconUrl,
          heroLinks: cleanedHeroLinks,
          popupEnabled,
          popupBannerUrl,
          popupTitle,
          popupText,
          popupButtons: cleanedPopupButtons,
          tickerEnabled,
          tickerLabel,
          tickerText,
          tickerLink,
          hubTitle,
          hubHighlightText,
          hubAnnouncement,
          telegramChannelId,
          telegramChannelUrl,
          allowPublicUpload: false,
          newAdminPin: newAdminPin.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        onUpdateSettings(data.settings);
        if (newAdminPin.trim().length >= 3) {
          onSetAdminPin(newAdminPin.trim());
          setNewAdminPin('');
        }
        showBanner('পপআপ, চলমান নোটিশ বার, ব্যানার এবং সেটিংস সফলভাবে সেভ হয়েছে!');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateRequestStatus = async (
    reqId: string,
    status: 'pending' | 'uploaded' | 'rejected',
    adminReply?: string
  ) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': adminPin
        },
        body: JSON.stringify({ status, adminReply })
      });
      if (res.ok) {
        onRefreshData();
        showBanner('অ্যাপ রিকোয়েস্ট স্ট্যাটাস আপডেট হয়েছে!');
      }
    } catch {}
  };

  const handleDeleteRequest = async (reqId: string) => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Pin': adminPin }
      });
      if (res.ok) {
        onRefreshData();
        showBanner('রিকোয়েস্ট মুছে ফেলা হয়েছে।');
      }
    } catch {}
  };

  const handleUpdateReportStatus = async (repId: string, status: 'open' | 'fixed') => {
    try {
      const res = await fetch(`/api/reports/${repId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': adminPin
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        onRefreshData();
        showBanner('ব্রোকেন লিংক রিপোর্ট স্ট্যাটাস আপডেট হয়েছে!');
      }
    } catch {}
  };

  const handleDeleteReport = async (repId: string) => {
    try {
      const res = await fetch(`/api/reports/${repId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Pin': adminPin }
      });
      if (res.ok) {
        onRefreshData();
        showBanner('রিপোর্ট মুছে ফেলা হয়েছে।');
      }
    } catch {}
  };

  if (!adminPin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] px-4 text-zinc-100">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121217] p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="font-mono text-xs text-violet-400">RESTRICTED ACCESS</span>
              <h1 className="mt-1 text-lg font-bold text-white">গোপন অ্যাডমিন প্যানেল</h1>
            </div>
            <Lock className="h-6 w-6 text-violet-400" />
          </div>

          <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              এই অংশটি সম্পূর্ণ সংরক্ষিত। শুধুমাত্র অনুমোদিত অ্যাডমিন গোপন পিন বা পাসওয়ার্ড দিয়ে প্রবেশ করতে পারবেন।
            </p>

            {authError && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300">
                গোপন অ্যাডমিন পিন / পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="আপনার গোপন পিন বা পাসওয়ার্ড দিন..."
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3.5 py-2.5 font-mono text-sm text-white focus:border-violet-500 focus:outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onExitAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> সাইটে ফিরে যান
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500"
              >
                {verifying ? 'যাচাই হচ্ছে...' : 'আনলক করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-zinc-800 bg-[#0D0D12] px-3.5 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Lock className="h-4 w-4 text-violet-400 shrink-0" />
          <h1 className="truncate text-xs font-bold text-white sm:text-base">
            গোপন অ্যাডমিন প্যানেল
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExitAdmin}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> ওয়েবসাইট দেখুন
          </button>
          <button
            type="button"
            onClick={() => {
              onSetAdminPin('');
              onExitAdmin();
            }}
            className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40 whitespace-nowrap"
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {statusBanner && (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-300">
            {statusBanner}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-[#121217] text-zinc-300 hover:text-white'
            }`}
          >
            ১. নতুন অ্যাপ, ফাইল ও ভিডিও আপলোড
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-[#121217] text-zinc-300 hover:text-white'
            }`}
          >
            ২. অ্যাপ, ভার্সন ও স্ক্রিনশট এডিট ({files.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-[#121217] text-zinc-300 hover:text-white'
            }`}
          >
            ৩. পপআপ, নোটিশ বার ও সেটিংস
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-[#121217] text-zinc-300 hover:text-white'
            }`}
          >
            <span>৪. রিকোয়েস্ট ও রিপোর্ট</span>
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 font-mono text-[10px] font-extrabold text-black">
              {requests.filter((r) => r.status === 'pending').length +
                reports.filter((r) => r.status === 'open').length}
            </span>
          </button>
        </div>

        {/* TAB 1: UPLOAD / CREATE APP WITH SERIAL VERSIONS & HOW-TO-USE VIDEO */}
        {activeTab === 'upload' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('binary')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  uploadMode === 'binary'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                ফাইল ম্যানেজার থেকে সরাসরি APK/File আপলোড (Fast Download)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  uploadMode === 'link'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                লিংক ও বাটন দিয়ে অ্যাপ কার্ড তৈরি
              </button>
            </div>

            {uploadMode === 'binary' ? (
              /* Device Binary File Upload with Versions & Tutorial Video */
              <div className="rounded-2xl border border-zinc-800 bg-[#121217] p-5 sm:p-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length) addFilesToQueue(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-violet-500 bg-violet-950/20'
                      : 'border-zinc-700 bg-black/60 hover:border-zinc-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        addFilesToQueue(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Upload className="mx-auto h-8 w-8 text-emerald-400" />
                  <p className="mt-2.5 text-sm font-bold text-white">
                    আপনার ফোনের ফাইল ম্যানেজার থেকে APK বা যেকোনো ফাইল সিলেক্ট করুন
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    এখানে আপলোড করা ফাইল সবাই Fast Download বাটনে ক্লিক করে সরাসরি নিজের ফাইল ম্যানেজারে ডাউনলোড করতে পারবে
                  </p>
                </div>

                {queue.length > 0 && (
                  <div className="mt-6 space-y-6">
                    {queue.map((item) => (
                      <div
                        key={item.localId}
                        className="space-y-4 rounded-xl border border-zinc-800 bg-black/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-emerald-400">{item.file.name}</span>
                            <span>·</span>
                            <span className="font-mono">{formatBytes(item.file.size)}</span>
                            {item.status === 'done' && (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> আপলোড সম্পন্ন
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="inline-flex items-center gap-1 font-bold text-red-400">
                                <AlertCircle className="h-3.5 w-3.5" /> {item.errorMsg}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setQueue((prev) => prev.filter((q) => q.localId !== item.localId))
                            }
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {item.status === 'uploading' && (
                          <div className="w-full overflow-hidden rounded-full bg-zinc-800 h-2">
                            <div
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        {item.status !== 'done' && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                              <div>
                                <label className="block text-xs text-zinc-400">অ্যাপের নাম</label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) =>
                                    updateQueueItem(item.localId, { title: e.target.value })
                                  }
                                  className="mt-1 w-full rounded border border-zinc-700 bg-[#121217] px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-400">ক্যাটাগরি</label>
                                <select
                                  value={item.category}
                                  onChange={(e) =>
                                    updateQueueItem(item.localId, { category: e.target.value })
                                  }
                                  className="mt-1 w-full rounded border border-zinc-700 bg-[#121217] px-2.5 py-1.5 text-xs text-white"
                                >
                                  <option value="Apps">Apps</option>
                                  <option value="Photo Editing">Photo Editing</option>
                                  <option value="Video Editing">Video Editing</option>
                                  <option value="Tools & Files">Tools & Files</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-400">ভার্সন</label>
                                <input
                                  type="text"
                                  value={item.version}
                                  onChange={(e) =>
                                    updateQueueItem(item.localId, { version: e.target.value })
                                  }
                                  className="mt-1 w-full rounded border border-zinc-700 bg-[#121217] px-2.5 py-1.5 font-mono text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-400">অ্যাপ আইকন</label>
                                <label className="mt-1 flex cursor-pointer items-center justify-center gap-1 rounded border border-zinc-700 bg-[#121217] px-2.5 py-1.5 text-xs text-zinc-300">
                                  <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                                  <span>{item.thumbnailUrl ? 'আইকন দেয়া হয়েছে' : 'আইকন দিন'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleCoverImageUpload(item.localId, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Mod Features & Screenshot Gallery Editor */}
                            <ModFeaturesAndScreenshotsEditor
                              modFeatures={item.modFeatures}
                              screenshots={item.screenshots}
                              adminPin={adminPin}
                              onChangeModFeatures={(feats) =>
                                updateQueueItem(item.localId, { modFeatures: feats })
                              }
                              onChangeScreenshots={(shots) =>
                                updateQueueItem(item.localId, { screenshots: shots })
                              }
                            />

                            {/* How to Use Tutorial Video Editor */}
                            <TutorialVideoEditor
                              videoUrl={item.tutorialVideoUrl}
                              videoTitle={item.tutorialVideoTitle}
                              adminPin={adminPin}
                              onChangeUrl={(url) =>
                                updateQueueItem(item.localId, { tutorialVideoUrl: url })
                              }
                              onChangeTitle={(t) =>
                                updateQueueItem(item.localId, { tutorialVideoTitle: t })
                              }
                            />

                            {/* Serial Versions & Fast Download Buttons Editor */}
                            <VersionsAndButtonsEditor
                              versions={item.versions}
                              adminPin={adminPin}
                              onChange={(newVers) =>
                                updateQueueItem(item.localId, { versions: newVers })
                              }
                            />
                          </>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        disabled={isUploadingAll}
                        onClick={handleUploadAll}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-violet-500"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingAll ? 'আপলোড হচ্ছে...' : 'সার্ভারে আপলোড ও পাবলিশ করুন'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleCreateLinkProduct}
                className="space-y-5 rounded-2xl border border-zinc-800 bg-[#121217] p-5 sm:p-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400">
                      অ্যাপের নাম (যেমন: CapCut Pro)
                    </label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="CapCut Pro"
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400">ভার্সন (যেমন: v18.80)</label>
                    <input
                      type="text"
                      value={linkVersion}
                      onChange={(e) => setLinkVersion(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400">ব্যাজ (PRO / MOD)</label>
                    <input
                      type="text"
                      value={linkBadge}
                      onChange={(e) => setLinkBadge(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-zinc-400">ক্যাটাগরি</label>
                    <select
                      value={linkCategory}
                      onChange={(e) => setLinkCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white"
                    >
                      <option value="Apps">Apps</option>
                      <option value="Photo Editing">Photo Editing</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Tools & Files">Tools & Files</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">অ্যাপ আইকন ছবি</label>
                    <label className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-300 hover:border-violet-500">
                      <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                      <span>{linkThumbnailUrl ? 'আইকন যুক্ত হয়েছে' : 'আইকন আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setLinkThumbnailUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">বিবরণ</label>
                    <input
                      type="text"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="প্রিমিয়াম আনলকড ফিচারসমূহ..."
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Mod Features & Screenshot Gallery Editor */}
                <ModFeaturesAndScreenshotsEditor
                  modFeatures={linkModFeatures}
                  screenshots={linkScreenshots}
                  adminPin={adminPin}
                  onChangeModFeatures={setLinkModFeatures}
                  onChangeScreenshots={setLinkScreenshots}
                />

                {/* How to Use Tutorial Video Editor */}
                <TutorialVideoEditor
                  videoUrl={linkTutorialVideoUrl}
                  videoTitle={linkTutorialVideoTitle}
                  adminPin={adminPin}
                  onChangeUrl={setLinkTutorialVideoUrl}
                  onChangeTitle={setLinkTutorialVideoTitle}
                />

                {/* Serial Versions & Custom Download Buttons Editor */}
                <VersionsAndButtonsEditor
                  versions={linkVersions}
                  adminPin={adminPin}
                  onChange={setLinkVersions}
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={linkSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-500"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {linkSubmitting ? 'প্রকাশিত হচ্ছে...' : 'অ্যাপ ও ডাউনলোড বাটন পাবলিশ করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE APPS, VERSIONS, FAST DOWNLOAD FILES & TUTORIAL VIDEOS */}
        {activeTab === 'manage' && (
          <div className="mt-6 space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl border border-zinc-800 bg-[#121217] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.title}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 font-mono text-xs font-bold text-emerald-400">
                        APK
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                          {file.badge || 'PRO'}
                        </span>
                        <h3 className="text-sm font-bold text-white sm:text-base">{file.title}</h3>
                        {file.tutorialVideoUrl && (
                          <span className="inline-flex items-center gap-1 rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                            <Video className="h-3 w-3" /> ভিডিও যুক্ত
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {file.category} · <span className="font-mono">{file.version}</span> ·{' '}
                        {file.downloads} ডাউনলোড · {formatDateBn(file.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateFile(file.id, { isPinned: !file.isPinned })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        file.isPinned
                          ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Pin className="inline h-3.5 w-3.5 mr-1" />
                      {file.isPinned ? 'পিন করা' : 'পিন করুন'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (editingId === file.id) {
                          setEditingId(null);
                        } else {
                          setEditingId(file.id);
                          setEditTitle(file.title);
                          setEditVersion(file.version || 'v18.80');
                          setEditBadge(file.badge || 'PRO');
                          setEditCategory(file.category);
                          setEditDescription(file.description || '');
                          setEditThumbnail(file.thumbnailUrl || '');
                          setEditTutorialVideoUrl(file.tutorialVideoUrl || '');
                          setEditTutorialVideoTitle(
                            file.tutorialVideoTitle ||
                              'অ্যাপটি কিভাবে ইনস্টল ও ব্যবহার করবেন দেখুন (Video Tutorial)'
                          );
                          setEditVersions(
                            Array.isArray(file.versions) && file.versions.length > 0
                              ? file.versions
                              : createDefaultVersions(
                                  file.version || 'v18.80',
                                  file.externalUrl || ''
                                )
                          );
                          setEditModFeatures(
                            Array.isArray(file.modFeatures) ? file.modFeatures : []
                          );
                          setEditScreenshots(
                            Array.isArray(file.screenshots) ? file.screenshots : []
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> এডিট করুন
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteFile(file.id)}
                      className="rounded-lg border border-red-500/30 bg-red-950/30 p-2 text-red-400 hover:bg-red-900/50"
                      title="ডিলিট করুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Editor for App + Mod Features + Screenshots + Tutorial Video + Versions */}
                {editingId === file.id && (
                  <div className="mt-5 space-y-4 border-t border-zinc-800 pt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="block text-xs text-zinc-400">অ্যাপের নাম</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400">ক্যাটাগরি</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Apps">Apps</option>
                          <option value="Photo Editing">Photo Editing</option>
                          <option value="Video Editing">Video Editing</option>
                          <option value="Tools & Files">Tools & Files</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400">ভার্সন</label>
                        <input
                          type="text"
                          value={editVersion}
                          onChange={(e) => setEditVersion(e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400">ব্যাজ (PRO)</label>
                        <input
                          type="text"
                          value={editBadge}
                          onChange={(e) => setEditBadge(e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 font-mono text-xs text-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-400">বিবরণ</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400">নতুন আইকন ছবি</label>
                        <label className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-zinc-300">
                          <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                          <span>আইকন পরিবর্তন করুন</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setEditThumbnail(reader.result);
                                  }
                                };
                                reader.readAsDataURL(f);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Mod Features & Screenshot Gallery Editor */}
                    <ModFeaturesAndScreenshotsEditor
                      modFeatures={editModFeatures}
                      screenshots={editScreenshots}
                      adminPin={adminPin}
                      onChangeModFeatures={setEditModFeatures}
                      onChangeScreenshots={setEditScreenshots}
                    />

                    {/* How to Use Tutorial Video Editor */}
                    <TutorialVideoEditor
                      videoUrl={editTutorialVideoUrl}
                      videoTitle={editTutorialVideoTitle}
                      adminPin={adminPin}
                      onChangeUrl={setEditTutorialVideoUrl}
                      onChangeTitle={setEditTutorialVideoTitle}
                    />

                    {/* Serial Versions and Fast Download Buttons Editor */}
                    <VersionsAndButtonsEditor
                      versions={editVersions}
                      adminPin={adminPin}
                      onChange={setEditVersions}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateFile(file.id, {
                            title: editTitle,
                            version: editVersion,
                            badge: editBadge,
                            category: editCategory,
                            description: editDescription,
                            thumbnailUrl: editThumbnail,
                            tutorialVideoUrl: editTutorialVideoUrl,
                            tutorialVideoTitle: editTutorialVideoTitle,
                            versions: editVersions,
                            modFeatures: editModFeatures,
                            screenshots: editScreenshots
                          });
                          setEditingId(null);
                          showBanner(
                            'মড ফিচার, স্ক্রিনশট, ভার্সন ও টিউটোরিয়াল ভিডিও সফলভাবে সেভ হয়েছে!'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-black hover:bg-emerald-400"
                      >
                        <Save className="h-4 w-4" /> পরিবর্তন সেভ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: WELCOME POPUP, SEARCH HEADER BANNER, LINK BUTTONS & TELEGRAM SETTINGS */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleSaveStoreSettings}
            className="mt-6 max-w-3xl space-y-6 rounded-2xl border border-zinc-800 bg-[#121217] p-5 sm:p-6"
          >
            {/* Section 0: সাইটে ঢোকার সময় পপআপ (Welcome Entry Popup Banner, Text & Link Buttons) */}
            <div className="space-y-5 rounded-xl border border-violet-500/30 bg-[#09090D] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white sm:text-sm">
                    সাইটে ঢোকার সময় পপআপ (Popup Banner, Text & Link Buttons)
                  </h2>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-[#121218] px-3 py-1 text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={popupEnabled}
                    onChange={(e) => setPopupEnabled(e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  <span>{popupEnabled ? 'পপআপ চালু আছে' : 'পপআপ বন্ধ'}</span>
                </label>
              </div>

              {/* Popup Banner Image */}
              <div className="rounded-xl border border-zinc-800 bg-[#121218] p-3.5">
                <label className="block text-xs font-bold text-emerald-400">
                  পপআপের উপরের ব্যানার ছবি (Popup Banner Image)
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-violet-500">
                    <ImageIcon className="h-4 w-4 text-emerald-400" />
                    <span>
                      {popupBannerUrl
                        ? 'পপআপ ব্যানার পরিবর্তন করুন'
                        : 'গ্যালারি থেকে পপআপ ব্যানার ছবি দিন'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setPopupBannerUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                  {popupBannerUrl && (
                    <button
                      type="button"
                      onClick={() => setPopupBannerUrl('')}
                      className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={popupBannerUrl}
                  onChange={(e) => setPopupBannerUrl(e.target.value)}
                  placeholder="অথবা পপআপ ব্যানার ছবির ডিরেক্ট লিংক দিন..."
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black px-3 py-1.5 font-mono text-[11px] text-zinc-300"
                />
                {popupBannerUrl && (
                  <img
                    src={popupBannerUrl}
                    alt="Popup Banner Preview"
                    className="mt-2.5 max-h-40 w-full rounded-lg border border-zinc-800 object-cover"
                  />
                )}
              </div>

              {/* Popup Title & Text */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    পপআপ শিরোনাম (Popup Title)
                  </label>
                  <input
                    type="text"
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    placeholder="স্বাগতম আমাদের ওয়েবসাইটে!"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    পপআপ টেক্সট / বিস্তারিত লেখা (Popup Text)
                  </label>
                  <textarea
                    rows={2}
                    value={popupText}
                    onChange={(e) => setPopupText(e.target.value)}
                    placeholder="সকল নতুন প্রিমিয়াম অ্যাপস ও আপডেট সবার আগে পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Popup Link Buttons below Banner / Text */}
              <div className="rounded-xl border border-zinc-800 bg-[#121218] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-violet-400">
                      পপআপের ব্যানার বা টেক্সটের নিচের লিংক বাটন
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      পপআপের নিচে বাটন যুক্ত করুন এবং সেখানে যেকোনো টেলিগ্রাম বা ওয়েবসাইট লিংক দিন:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPopupButtons((prev) => [
                        ...prev,
                        {
                          id: 'pbtn_' + Math.random().toString(36).slice(2, 8),
                          label: 'Join Channel / Direct Link',
                          mode: 'link',
                          url: '',
                          color: 'emerald'
                        }
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                  >
                    <Plus className="h-3.5 w-3.5" /> পপআপে নতুন বাটন যোগ করুন
                  </button>
                </div>

                <div className="space-y-2.5">
                  {popupButtons.map((btn, idx) => (
                    <div
                      key={btn.id || idx}
                      className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-800 bg-black/70 p-2.5 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          বাটনের নাম (যেমন: Join Telegram)
                        </label>
                        <input
                          type="text"
                          value={btn.label}
                          onChange={(e) =>
                            setPopupButtons((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Join Telegram Channel"
                          className="w-full rounded border border-zinc-700 bg-[#121218] px-2.5 py-1.5 text-xs font-bold text-white"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-violet-400 mb-0.5">
                          বাটনের লিংক (URL) এখানে দিন
                        </label>
                        <input
                          type="text"
                          value={btn.url}
                          onChange={(e) =>
                            setPopupButtons((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, url: e.target.value } : item
                              )
                            )
                          }
                          placeholder="https://t.me/..."
                          className="w-full rounded border border-violet-500/40 bg-[#121218] px-2.5 py-1.5 font-mono text-xs text-zinc-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">রঙ (Color)</label>
                        <select
                          value={btn.color || 'violet'}
                          onChange={(e) =>
                            setPopupButtons((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      color: e.target.value as DownloadButtonConfig['color']
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded border border-zinc-700 bg-[#121218] px-2 py-1.5 text-xs text-white"
                        >
                          <option value="violet">বেগুনি (Purple)</option>
                          <option value="emerald">সবুজ (Green)</option>
                          <option value="sky">নীল (Blue)</option>
                          <option value="amber">কমলা (Orange)</option>
                        </select>
                      </div>

                      <div className="flex justify-end sm:col-span-1 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setPopupButtons((prev) =>
                              prev.length > 1
                                ? prev.filter((_, i) => i !== idx)
                                : [{ ...prev[0], url: '' }]
                            )
                          }
                          className="p-1.5 text-zinc-500 hover:text-red-400"
                          title="বাটন মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 1: Welcome Text, Banner Below Welcome, & Direct Link Buttons Above Search Bar */}
            <div className="space-y-5 rounded-xl border border-zinc-800 bg-[#09090D] p-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h2 className="text-xs font-bold text-white sm:text-sm">
                  Welcome লেখা, নিচের ব্যানার এবং Direct Download স্টাইল লিংক বাটন
                </h2>
              </div>

              {/* 1. Welcome Title & Subtitle (Top) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    উপরের শিরোনাম ১ম অংশ (White Text)
                  </label>
                  <input
                    type="text"
                    value={hubTitle}
                    onChange={(e) => setHubTitle(e.target.value)}
                    placeholder="Welcome to"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    শিরোনাম ২য় অংশ (Gradient Colored Text)
                  </label>
                  <input
                    type="text"
                    value={hubHighlightText}
                    onChange={(e) => setHubHighlightText(e.target.value)}
                    placeholder="Our Website"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-violet-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Welcome এর নিচের বিস্তারিত লেখা (Subtitle Text)
                </label>
                <textarea
                  rows={2}
                  value={hubAnnouncement}
                  onChange={(e) => setHubAnnouncement(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 2. Hero Banner Image (Placed BELOW Welcome Text & Above Search Bar) */}
              <div className="rounded-xl border border-zinc-800 bg-[#121218] p-3.5">
                <label className="block text-xs font-bold text-emerald-400">
                  Welcome লেখার নিচের ব্যানার ছবি (Hero Banner)
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-violet-500">
                    <ImageIcon className="h-4 w-4 text-emerald-400" />
                    <span>
                      {heroBannerUrl ? 'ব্যানার পরিবর্তন করুন' : 'গ্যালারি থেকে ব্যানার ছবি দিন'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setHeroBannerUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                  {heroBannerUrl && (
                    <button
                      type="button"
                      onClick={() => setHeroBannerUrl('')}
                      className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={heroBannerUrl}
                  onChange={(e) => setHeroBannerUrl(e.target.value)}
                  placeholder="অথবা ব্যানার ছবির ডিরেক্ট লিংক দিন..."
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black px-3 py-1.5 font-mono text-[11px] text-zinc-300"
                />
                {heroBannerUrl && (
                  <img
                    src={heroBannerUrl}
                    alt="Hero Banner Preview"
                    className="mt-2.5 max-h-40 w-full rounded-lg border border-zinc-800 object-cover"
                  />
                )}
              </div>

              {/* 3. Direct Link Buttons above Search Bar (Works just like Direct Download!) */}
              <div className="rounded-xl border border-zinc-800 bg-[#121218] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-violet-400">
                      সার্চের উপরের লিংক বাটন (Direct Download এর মতো কাজ করবে)
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      এখানে যেকোনো টেলিগ্রাম, ওয়েবসাইট বা ডাউনলোড লিংক দিলে সেটি ব্যানারের নিচে ও সার্চের উপরে বাটন হিসেবে দেখাবে:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroLinks((prev) => [
                        ...prev,
                        {
                          id: 'hbtn_' + Math.random().toString(36).slice(2, 8),
                          label: 'Direct Link',
                          mode: 'link',
                          url: '',
                          color: 'emerald'
                        }
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                  >
                    <Plus className="h-3.5 w-3.5" /> নতুন লিংক বাটন যোগ করুন
                  </button>
                </div>

                <div className="space-y-2.5">
                  {heroLinks.map((btn, idx) => (
                    <div
                      key={btn.id || idx}
                      className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-800 bg-black/70 p-2.5 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          বাটনের লেখা (যেমন: Direct Download / Join Channel)
                        </label>
                        <input
                          type="text"
                          value={btn.label}
                          onChange={(e) =>
                            setHeroLinks((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Direct Download / Join Telegram"
                          className="w-full rounded border border-zinc-700 bg-[#121218] px-2.5 py-1.5 text-xs font-bold text-white"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-violet-400 mb-0.5">
                          বাটনের লিংক (URL) এখানে দিন
                        </label>
                        <input
                          type="text"
                          value={btn.url}
                          onChange={(e) =>
                            setHeroLinks((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, url: e.target.value } : item
                              )
                            )
                          }
                          placeholder="https://t.me/+NRQwX88nKUQxYWY1"
                          className="w-full rounded border border-violet-500/40 bg-[#121218] px-2.5 py-1.5 font-mono text-xs text-zinc-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">রঙ (Color)</label>
                        <select
                          value={btn.color || 'violet'}
                          onChange={(e) =>
                            setHeroLinks((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      color: e.target.value as DownloadButtonConfig['color']
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded border border-zinc-700 bg-[#121218] px-2 py-1.5 text-xs text-white"
                        >
                          <option value="violet">বেগুনি (Purple)</option>
                          <option value="emerald">সবুজ (Green)</option>
                          <option value="sky">নীল (Blue)</option>
                          <option value="amber">কমলা (Orange)</option>
                        </select>
                      </div>

                      <div className="flex justify-end sm:col-span-1 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setHeroLinks((prev) =>
                              prev.length > 1
                                ? prev.filter((_, i) => i !== idx)
                                : [{ ...prev[0], url: '' }]
                            )
                          }
                          className="p-1.5 text-zinc-500 hover:text-red-400"
                          title="লিংক মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Brand Navbar & Telegram Settings */}
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#09090D] p-4">
              <h3 className="text-xs font-bold text-white sm:text-sm">
                নেভবার লোগো এবং টেলিগ্রাম চ্যানেল সেটিংস
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    উপরের বাম পাশের ব্র্যান্ড নাম (Brand Name)
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="TF OFFICIAL"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    নেভবার গোল লোগো ছবি (ঐচ্ছিক)
                  </label>
                  <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-300 hover:border-violet-500">
                    <ImageIcon className="h-4 w-4 text-violet-400" />
                    <span>{brandLogoUrl ? 'লোগো পরিবর্তন করুন' : 'লোগো ছবি আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setBrandLogoUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    টেলিগ্রাম চ্যানেল আইডি (Channel ID)
                  </label>
                  <input
                    type="text"
                    value={telegramChannelId}
                    onChange={(e) => setTelegramChannelId(e.target.value)}
                    placeholder="@TF_Official_Channel"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    টেলিগ্রাম চ্যানেল লিংক (URL)
                  </label>
                  <input
                    type="url"
                    value={telegramChannelUrl}
                    onChange={(e) => setTelegramChannelUrl(e.target.value)}
                    placeholder="https://t.me/TF_Official_Channel"
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  নতুন অ্যাডমিন পাসওয়ার্ড সেট করুন (পরিবর্তন না করতে চাইলে খালি রাখুন)
                </label>
                <input
                  type="password"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder="নতুন গোপন পাসওয়ার্ড..."
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Section 0B: চলমান নোটিশ বার বা ব্রেকিং নিউজ টিকার (Scrolling Notice Ticker) */}
            <div className="space-y-4 rounded-xl border border-amber-500/30 bg-[#09090D] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-amber-400" />
                  <h2 className="text-xs font-bold text-white sm:text-sm">
                    চলমান নোটিশ বার / ব্রেকিং নিউজ টিকার (Scrolling Notice Ticker)
                  </h2>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 bg-[#121218] px-3 py-1 text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={tickerEnabled}
                    onChange={(e) => setTickerEnabled(e.target.checked)}
                    className="h-3.5 w-3.5 accent-amber-500"
                  />
                  <span>{tickerEnabled ? 'নোটিশ বার চালু আছে' : 'নোটিশ বার বন্ধ'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    বাম পাশের ব্যাজ লেখা (Label)
                  </label>
                  <input
                    type="text"
                    value={tickerLabel}
                    onChange={(e) => setTickerLabel(e.target.value)}
                    placeholder="🔥 নোটিশ"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-amber-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    নোটিশে ক্লিক করলে যে লিংকে যাবে (ঐচ্ছিক URL)
                  </label>
                  <input
                    type="text"
                    value={tickerLink}
                    onChange={(e) => setTickerLink(e.target.value)}
                    placeholder="https://t.me/... (খালি রাখলে শুধু লেখা স্ক্রল করবে)"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  চলমান নোটিশ টেক্সট (Scrolling Notice Text)
                </label>
                <textarea
                  rows={2}
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  placeholder="সকল নতুন প্রিমিয়াম ও আনলকড প্রো অ্যাপস একদম ফ্রিতে ডাউনলোড করুন!..."
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-500"
              >
                <Save className="h-4 w-4" />
                {savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সকল সেটিংস সেভ করুন'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: USER APP REQUESTS & BROKEN LINK REPORTS */}
        {activeTab === 'requests' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column: User App Requests */}
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-[#121217] p-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-violet-400" />
                  <h2 className="text-sm font-extrabold text-white sm:text-base">
                    ভিজিটরদের অ্যাপ রিকোয়েস্ট ({requests.length})
                  </h2>
                </div>
                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-violet-300">
                  {requests.filter((r) => r.status === 'pending').length} পেন্ডিং
                </span>
              </div>

              {requests.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  এখনো কোনো অ্যাপ রিকোয়েস্ট আসেনি।
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((reqItem) => {
                    const draftVal =
                      replyDrafts[reqItem.id] !== undefined
                        ? replyDrafts[reqItem.id]
                        : reqItem.adminReply || '';
                    return (
                      <div
                        key={reqItem.id}
                        className="space-y-2.5 rounded-xl border border-zinc-800 bg-[#09090D] p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold text-white sm:text-sm">
                                {reqItem.appName}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  reqItem.status === 'uploaded'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : reqItem.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {reqItem.status === 'uploaded'
                                  ? '✓ আপলোড হয়েছে'
                                  : reqItem.status === 'rejected'
                                  ? 'পাওয়া যায়নি'
                                  : '⏳ পেন্ডিং'}
                              </span>
                            </div>
                            {reqItem.versionOrNote && (
                              <p className="mt-1 text-xs text-zinc-300">
                                বিবরণ: {reqItem.versionOrNote}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-zinc-500">
                              রিকোয়েস্ট করেছেন: <strong className="text-zinc-300">{reqItem.requesterName || 'ভিজিটর'}</strong> ·{' '}
                              {formatDateBn(reqItem.createdAt)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(reqItem.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Admin Reply + Status Buttons */}
                        <div className="space-y-2 border-t border-zinc-800/80 pt-2.5">
                          <input
                            type="text"
                            value={draftVal}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [reqItem.id]: e.target.value
                              }))
                            }
                            placeholder="অ্যাডমিন রিপ্লাই লিখুন (যেমন: সাইটে আপলোড করা হয়েছে, সার্চ করুন)..."
                            className="w-full rounded border border-zinc-700 bg-black px-2.5 py-1.5 text-xs text-white"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateRequestStatus(reqItem.id, 'uploaded', draftVal)
                              }
                              className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-emerald-400"
                            >
                              ✓ আপলোড হয়েছে মার্ক করুন
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateRequestStatus(reqItem.id, 'pending', draftVal)
                              }
                              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800"
                            >
                              পেন্ডিং রাখুন
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Broken Link Reports */}
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-[#121217] p-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-amber-400" />
                  <h2 className="text-sm font-extrabold text-white sm:text-base">
                    ব্রোকেন লিংক ও সমস্যা রিপোর্ট ({reports.length})
                  </h2>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                  {reports.filter((r) => r.status === 'open').length} ওপেন
                </span>
              </div>

              {reports.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  কোনো ব্রোকেন লিংক রিপোর্ট নেই — সব লিংক ঠিকমতো কাজ করছে!
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="space-y-2.5 rounded-xl border border-zinc-800 bg-[#09090D] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-white sm:text-sm">
                              {rep.fileTitle}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                rep.status === 'fixed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {rep.status === 'fixed' ? '✓ সমাধান হয়েছে' : '⚠️ সমস্যা রিপোর্ট'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-amber-300">
                            কারণ: {rep.reason}
                          </p>
                          {rep.details && (
                            <p className="mt-0.5 text-xs text-zinc-300">বিস্তারিত: {rep.details}</p>
                          )}
                          <p className="mt-1 text-[11px] text-zinc-500">
                            সময়: {formatDateBn(rep.createdAt)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(rep.id)}
                          className="p-1 text-zinc-500 hover:text-red-400"
                          title="রিপোর্ট মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-2">
                        {rep.status === 'open' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(rep.id, 'fixed')}
                            className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-emerald-400"
                          >
                            ✓ সমাধান হয়েছে মার্ক করুন
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(rep.id, 'open')}
                            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-zinc-300"
                          >
                            পুনরায় ওপেন করুন
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
