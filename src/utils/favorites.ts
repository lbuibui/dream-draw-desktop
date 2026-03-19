import Dexie, { Table } from 'dexie';

export interface FavoriteItem {
  id?: number;
  name: string;
  imageData: string; // base64
  thumbnailData: string; // base64 缩略图
  createdAt: Date;
  pageCount: number;
  resolution: '2K' | '4K';
}

class FavoritesDatabase extends Dexie {
  favorites!: Table<FavoriteItem>;

  constructor() {
    super('DreamDrawFavorites');
    this.version(1).stores({
      favorites: '++id, createdAt, name',
    });
  }
}

export const db = new FavoritesDatabase();

// 生成缩略图 - 使用更高质量
export async function generateThumbnail(imageData: string, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // 保持原始宽高比，限制最大尺寸
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      
      const ctx = canvas.getContext('2d', { alpha: false })!;
      // 使用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 使用 PNG 格式保持清晰度，质量参数对 PNG 无效但保留以兼容
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageData;
  });
}

// 保存到收藏夹
export async function saveToFavorites(
  name: string,
  imageData: string,
  resolution: '2K' | '4K' = '2K',
  pageCount: number = 1
): Promise<number> {
  const thumbnailData = await generateThumbnail(imageData);
  
  const id = await db.favorites.add({
    name,
    imageData,
    thumbnailData,
    createdAt: new Date(),
    pageCount,
    resolution,
  });
  
  return id;
}

// 获取所有收藏
export async function getAllFavorites(): Promise<FavoriteItem[]> {
  return await db.favorites.orderBy('createdAt').reverse().toArray();
}

// 获取单个收藏
export async function getFavoriteById(id: number): Promise<FavoriteItem | undefined> {
  return await db.favorites.get(id);
}

// 删除收藏
export async function deleteFavorite(id: number): Promise<void> {
  await db.favorites.delete(id);
}

// 清空所有收藏
export async function clearAllFavorites(): Promise<void> {
  await db.favorites.clear();
}

// 获取收藏数量
export async function getFavoritesCount(): Promise<number> {
  return await db.favorites.count();
}
