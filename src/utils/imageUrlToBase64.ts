// 工具函数：将图片URL转换为Base64
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    // 1. 使用fetch获取图片（需OSS配置CORS）
    const response = await fetch(imageUrl, {
      mode: 'cors', // 明确指定跨域
      cache: 'no-cache'
    });

    // 2. 转换为blob
    const blob = await response.blob();

    // 3. 使用FileReader转为Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('转换Base64失败:', error);
    throw error;
  }
}