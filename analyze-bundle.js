import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function analyzeBundles() {
  // 运行构建分析
  execSync("npm run build");

  // 读取dist目录下的文件信息
  const distPath = "dist";
  const assetsPath = path.join(distPath, "assets");

  // 获取所有文件
  const allFiles = [];

  // 读取根目录文件
  const rootFiles = fs.readdirSync(distPath);
  rootFiles.forEach((file) => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      allFiles.push({
        name: file,
        path: filePath,
        size: stats.size,
        type: "root",
      });
    }
  });

  // 读取assets目录文件
  const assetsFiles = fs.readdirSync(assetsPath);
  assetsFiles.forEach((file) => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      allFiles.push({
        name: file,
        path: filePath,
        size: stats.size,
        type: "asset",
      });
    }
  });

  // 分析文件大小
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

  // 按类型和大小排序
  const jsFiles = allFiles.filter(
    (file) => file.name.endsWith(".js") && !file.name.endsWith(".js.gz")
  );
  const cssFiles = allFiles.filter(
    (file) => file.name.endsWith(".css") && !file.name.endsWith(".css.gz")
  );
  const imageFiles = allFiles.filter((file) =>
    ["png", "jpg", "jpeg", "gif", "svg"].includes(file.name.split(".").pop())
  );
  const gzipFiles = allFiles.filter((file) => file.name.endsWith(".gz"));

  // 计算各类型文件的总大小
  const jsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const cssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  const imageSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
  const gzipSize = gzipFiles.reduce((sum, file) => sum + file.size, 0);

  // 生成报告
  const sizeReport = {
    totalSize,
    fileCounts: {
      total: allFiles.length,
      js: jsFiles.length,
      css: cssFiles.length,
      images: imageFiles.length,
      gzip: gzipFiles.length,
    },
    typeSizes: {
      js: jsSize,
      css: cssSize,
      images: imageSize,
      gzip: gzipSize,
      other: totalSize - jsSize - cssSize - imageSize - gzipSize,
    },
    files: {
      js: jsFiles.sort((a, b) => b.size - a.size),
      css: cssFiles.sort((a, b) => b.size - a.size),
      images: imageFiles.sort((a, b) => b.size - a.size),
      gzip: gzipFiles.sort((a, b) => b.size - a.size),
    },
  };

  // 保存报告
  fs.writeFileSync("bundle-report.json", JSON.stringify(sizeReport, null, 2));

  console.log("Bundle analysis completed! Report saved to bundle-report.json");
  console.log(`Total bundle size: ${formatBytes(totalSize)}`);
  console.log(`JS files: ${jsFiles.length} files, ${formatBytes(jsSize)}`);
  console.log(`CSS files: ${cssFiles.length} files, ${formatBytes(cssSize)}`);
  console.log(
    `Image files: ${imageFiles.length} files, ${formatBytes(imageSize)}`
  );
  console.log(
    `Gzip files: ${gzipFiles.length} files, ${formatBytes(gzipSize)}`
  );
}

// 格式化文件大小
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

analyzeBundles();
