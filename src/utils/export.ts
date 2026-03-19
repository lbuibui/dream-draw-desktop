import { ProcessedPage, UploadMode } from '../types';
import { FavoriteItem } from './favorites';
import { saveFileBytes, selectSavePath } from '../tauri-api';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

// 导出为 PDF
export async function exportToPdf(pages: ProcessedPage[]): Promise<void> {
  if (pages.length === 0) return;

  const savePath = await selectSavePath('dream-draw-restored', 'pdf');
  if (!savePath) return;

  const firstPage = pages[0];
  const isLandscape = firstPage.width > firstPage.height;
  
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstPage.width, firstPage.height],
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.processedUrl && page.processedData) {
      if (i > 0) {
        pdf.addPage([page.width, page.height], isLandscape ? 'l' : 'p');
      }
      pdf.addImage(page.processedUrl, 'PNG', 0, 0, page.width, page.height);
    }
  }

  const pdfData = pdf.output('arraybuffer');
  await saveFileBytes(savePath, new Uint8Array(pdfData));
}

// 导出为 PPTX
export async function exportToPptx(pages: ProcessedPage[]): Promise<void> {
  if (pages.length === 0) return;

  const savePath = await selectSavePath('dream-draw-restored', 'pptx');
  if (!savePath) return;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (const page of pages) {
    if (page.processedUrl && page.processedData) {
      const slide = pptx.addSlide();
      
      // 计算适应幻灯片的尺寸
      const slideWidth = 10;
      const slideHeight = 5.625;
      const aspectRatio = page.width / page.height;
      
      let imgWidth = slideWidth;
      let imgHeight = slideWidth / aspectRatio;
      
      if (imgHeight > slideHeight) {
        imgHeight = slideHeight;
        imgWidth = slideHeight * aspectRatio;
      }

      const x = (slideWidth - imgWidth) / 2;
      const y = (slideHeight - imgHeight) / 2;

      slide.addImage({
        data: page.processedUrl,
        x,
        y,
        w: imgWidth,
        h: imgHeight,
      });
    }
  }

  await pptx.writeFile({ fileName: savePath });
}

// 导出为 ZIP (图片模式)
export async function exportToZip(pages: ProcessedPage[], uploadMode: UploadMode): Promise<void> {
  const completedPages = pages.filter(p => p.processedUrl && p.processedData);
  if (completedPages.length === 0) return;

  const savePath = await selectSavePath('dream-draw-images', 'zip');
  if (!savePath) return;

  const zip = new JSZip();
  const folder = zip.folder('restored-images');

  for (let i = 0; i < completedPages.length; i++) {
    const page = completedPages[i];
    if (page.processedData) {
      const binary = atob(page.processedData);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
      
      const fileName = uploadMode === 'pdf' 
        ? `page_${(page.pageIndex + 1).toString().padStart(3, '0')}.png`
        : `image_${(i + 1).toString().padStart(3, '0')}.png`;
      
      folder?.file(fileName, bytes);
    }
  }

  const content = await zip.generateAsync({ type: 'uint8array' });
  await saveFileBytes(savePath, content);
}

// 下载单张图片
export async function downloadSingleImage(page: ProcessedPage): Promise<void> {
  if (!page.processedData) return;

  const savePath = await selectSavePath(`dream-draw-page-${page.pageIndex + 1}`, 'png');
  if (!savePath) return;

  const binary = atob(page.processedData);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  await saveFileBytes(savePath, bytes);
}

// ==================== 收藏夹导出功能 ====================

// 从 FavoriteItem 导出为 PDF
export async function exportFavoritesToPdf(items: FavoriteItem[]): Promise<void> {
  if (items.length === 0) return;

  const savePath = await selectSavePath('favorites-export', 'pdf');
  if (!savePath) return;

  const firstItem = items[0];
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = firstItem.imageData;
  });
  
  const isLandscape = img.width > img.height;
  
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [img.width, img.height],
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const itemImg = new Image();
      await new Promise<void>((resolve) => {
        itemImg.onload = () => resolve();
        itemImg.src = item.imageData;
      });
      const itemIsLandscape = itemImg.width > itemImg.height;
      pdf.addPage([itemImg.width, itemImg.height], itemIsLandscape ? 'l' : 'p');
    }
    pdf.addImage(item.imageData, 'PNG', 0, 0, img.width, img.height);
  }

  const pdfData = pdf.output('arraybuffer');
  await saveFileBytes(savePath, new Uint8Array(pdfData));
}

// 从 FavoriteItem 导出为 PPTX
export async function exportFavoritesToPptx(items: FavoriteItem[]): Promise<void> {
  if (items.length === 0) return;

  const savePath = await selectSavePath('favorites-export', 'pptx');
  if (!savePath) return;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (const item of items) {
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = item.imageData;
    });
    
    const slide = pptx.addSlide();
    
    const slideWidth = 10;
    const slideHeight = 5.625;
    const aspectRatio = img.width / img.height;
    
    let imgWidth = slideWidth;
    let imgHeight = slideWidth / aspectRatio;
    
    if (imgHeight > slideHeight) {
      imgHeight = slideHeight;
      imgWidth = slideHeight * aspectRatio;
    }

    const x = (slideWidth - imgWidth) / 2;
    const y = (slideHeight - imgHeight) / 2;

    slide.addImage({
      data: item.imageData,
      x,
      y,
      w: imgWidth,
      h: imgHeight,
    });
  }

  await pptx.writeFile({ fileName: savePath });
}

// 从 FavoriteItem 导出为 ZIP
export async function exportFavoritesToZip(items: FavoriteItem[]): Promise<void> {
  if (items.length === 0) return;

  const savePath = await selectSavePath('favorites-export', 'zip');
  if (!savePath) return;

  const zip = new JSZip();
  const folder = zip.folder('favorites');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const base64Data = item.imageData.replace(/^data:image\/png;base64,/, '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) {
      bytes[j] = binary.charCodeAt(j);
    }
    
    const fileName = `favorite_${(i + 1).toString().padStart(3, '0')}.png`;
    folder?.file(fileName, bytes);
  }

  const content = await zip.generateAsync({ type: 'uint8array' });
  await saveFileBytes(savePath, content);
}
