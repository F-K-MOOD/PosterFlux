// 获取图片元素
export function getImgElements(items: HTMLElement[]): HTMLImageElement[] {
  const imgElements: HTMLImageElement[] = [];
  items.forEach(item => {
    const imgs = item.querySelectorAll('img');
    imgElements.push(...Array.from(imgs));
  });
  return imgElements;
}

// 获取图片地址
export function getImgUrls(imgElements: HTMLImageElement[]): string[] {
  return imgElements.map(img => img.src).filter(src => src);
}

// 获取最小高度的列
export function getMinHeightColumn(columnHeightsMap: Map<number, number>): number {
  let minHeight = Infinity;
  let minColumn = 0;

  columnHeightsMap.forEach((height, column) => {
    if (height < minHeight) {
      minHeight = height;
      minColumn = column;
    }
  });

  return minColumn;
}

// 获取最小高度
export function getMinHeight(columnHeightsMap: Map<number, number>): number {
  let minHeight = Infinity;

  columnHeightsMap.forEach((height) => {
    if (height < minHeight) {
      minHeight = height;
    }
  });

  return minHeight;
}

// 获取最大高度
export function getMaxHeight(columnHeightsMap: Map<number, number>): number {
  let maxHeight = 0;

  columnHeightsMap.forEach((height) => {
    if (height > maxHeight) {
      maxHeight = height;
    }
  });

  return maxHeight;
}

// 等待图片加载完成
export function waitImgComplete(imgUrls: string[]): Promise<void> {
  const promises = imgUrls.map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // 设置超时
      const timeout = setTimeout(() => {
        img.src = '';
        resolve(); // 超时也 resolve，避免阻塞
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(); // 错误也 resolve，避免阻塞
      };

      img.src = url;
    });
  });

  return Promise.all(promises).then(() => { });
}