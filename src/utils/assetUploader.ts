/**
 * Helper to compress images and upload cleanly to /api/assets/upload
 * Prevents Firestore 1MB document limit rejections and large payload network failures.
 */

export async function compressImage(
  file: File,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.75
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadImageOrAsset(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  let fileToUpload = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImage(file, 960, 960, 0.78);
    } catch (e) {
      console.warn('Compression notice:', e);
    }
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/assets/upload', true);

    const safeName = fileToUpload.name.replace(/[/\\?%*:|"<>]/g, '_');
    const utf8Bytes = new TextEncoder().encode(safeName);
    let binaryStr = '';
    utf8Bytes.forEach((b) => {
      binaryStr += String.fromCharCode(b);
    });
    xhr.setRequestHeader('X-Asset-Filename', btoa(binaryStr));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-Admin-Pin', sessionStorage.getItem('tf_admin_pin') || '780');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.url) {
            resolve(data.url);
            return;
          }
        } catch {}
      }
      // Fallback: convert compressed file to small dataURL
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileToUpload);
    };

    xhr.onerror = () => {
      // Fallback to dataURL if offline
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileToUpload);
    };

    xhr.send(fileToUpload);
  });
}

/**
 * Sanitizes object for Firestore to guarantee no undefined values and no oversized base64 strings.
 */
export function sanitizeDocForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    }
    if (typeof val === 'string') {
      // If string is oversized base64 dataUrl (> 200KB), strip it so Firestore doc never exceeds 1MB
      if (val.startsWith('data:') && val.length > 200000) {
        result[key] = '';
      } else {
        result[key] = val;
      }
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) => {
        if (typeof item === 'string' && item.startsWith('data:') && item.length > 200000) {
          return '';
        }
        if (item && typeof item === 'object') {
          return sanitizeDocForFirestore(item);
        }
        return item;
      }).filter((item) => item !== '');
    } else if (val && typeof val === 'object') {
      result[key] = sanitizeDocForFirestore(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}
