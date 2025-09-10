import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'video_cache:';
// App’in kalıcı dizini (silinmez)
const BASE_DIR = `${RNFS.DocumentDirectoryPath}/videos`;

type CacheRecord = {
  url: string;
  localPath: string; // file:// prefixsiz ham path
  size?: number;
  createdAt: number;
};

const ensureDir = async () => {
  const exists = await RNFS.exists(BASE_DIR);
  if (!exists) await RNFS.mkdir(BASE_DIR);
};

const keyOf = (idOrUrl: string) => `${CACHE_KEY_PREFIX}${idOrUrl}`;

export const getCachedLocalUri = async (idOrUrl: string) => {
  const json = await AsyncStorage.getItem(keyOf(idOrUrl));
  if (!json) return null;
  const rec: CacheRecord = JSON.parse(json);
  const exists = await RNFS.exists(rec.localPath);
  if (!exists) {
    // kayıt var ama dosya yoksa temizle
    await AsyncStorage.removeItem(keyOf(idOrUrl));
    return null;
  }
  return `file://${rec.localPath}`;
};

export const cacheVideoIfNeeded = async (
  idOrUrl: string,
  remoteUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> => {
  // Zaten var mı?
  const existing = await getCachedLocalUri(idOrUrl);
  if (existing) return existing;

  // İndir
  await ensureDir();
  // Basit isim: id + uzantı (güvenli isim)
  const ext = remoteUrl.includes('?') ? '' : remoteUrl.split('.').pop() || '';
  const safeExt = ext.length && ext.length < 6 ? `.${ext}` : '';
  const fileName = encodeURIComponent(String(idOrUrl)) + safeExt;
  const targetPath = `${BASE_DIR}/${fileName}`;

  const dl = RNFS.downloadFile({
    fromUrl: remoteUrl,
    toFile: targetPath,
    progressInterval: 350,
    progressDivider: 1,
    background: true,
    discretionary: true,
    begin: () => onProgress?.(0),
    progress: p => {
      const pct = p.contentLength > 0 ? p.bytesWritten / p.contentLength : 0;
      onProgress?.(pct);
    },
  });

  const res = await dl.promise; // throw edebilir
  if (res.statusCode && res.statusCode >= 400) {
    // başarısız indirme -> dosyayı temizle
    try {
      await RNFS.unlink(targetPath);
    } catch {}
    throw new Error(`Download failed with status ${res.statusCode}`);
  }

  // Kaydı yaz
  const stat = await RNFS.stat(targetPath);
  const rec: CacheRecord = {
    url: remoteUrl,
    localPath: targetPath,
    size: Number(stat.size ?? 0),
    createdAt: Date.now(),
  };
  await AsyncStorage.setItem(keyOf(idOrUrl), JSON.stringify(rec));

  return `file://${targetPath}`;
};
