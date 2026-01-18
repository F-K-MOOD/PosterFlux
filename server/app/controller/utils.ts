import { Controller } from "egg";
// import * as sharp from 'sharp'
import * as sendToWormhole from "stream-wormhole";
import * as Busboy from "busboy";
import { nanoid } from "nanoid";
import { createWriteStream } from "fs";
import { parse, join, extname } from "path";
import { pipeline } from "stream/promises";
import { createSSRApp } from "vue";
import { renderToString, renderToNodeStream } from "@vue/server-renderer";
import { FileStream } from "../../typings/app";
export default class UtilsController extends Controller {
  splitIdAndUuid(str = "") {
    const result = { id: "", uuid: "" };
    if (!str) return result;
    const firstDashIndex = str.indexOf("-");
    if (firstDashIndex < 0) return result;
    result.id = str.slice(0, firstDashIndex);
    result.uuid = str.slice(firstDashIndex + 1);
    return result;
  }
  async renderH5Page() {
    // id-uuid split('-')
    // uuid = aa-bb-cc
    const { ctx, app } = this;
    const { idAndUuid } = ctx.params;
    const query = this.splitIdAndUuid(idAndUuid);
    try {
      const pageData = await this.service.utils.renderToPageData(query);
      await ctx.render("page.nj", pageData);
    } catch (e) {
      ctx.helper.error({ ctx, errorType: "h5WorkNotExistError" });
    }
  }
  async uploadToOSS() {
    const { ctx, app } = this;
    const stream = await ctx.getFileStream();
    // pf-server /my-test/**.ext
    const savedOSSPath = join("my-test", nanoid(6) + extname(stream.filename));
    try {
      const result = await ctx.oss.put(savedOSSPath, stream);
      app.logger.info(result);
      const { name, url } = result;
      ctx.helper.success({ ctx, res: { name, url } });
    } catch (e) {
      await sendToWormhole(stream);
      ctx.helper.error({ ctx, errorType: "imageUploadFail" });
    }
    // get stream saved to local file
    // file upload to OSS
    // delete local file

    // get stream upload to OSS
  }
  async uploadMutipleFiles() {
    const { ctx, app } = this;
    try {
      // 检查OSS配置是否存在
      if (!app.config.oss || !app.config.oss.client) {
        app.logger.error("OSS configuration not found");
        return ctx.helper.error({
          ctx,
          errorType: "imageUploadFail",
          error: "OSS configuration not found",
        });
      }

      // 检查OSS密钥是否有效
      const { accessKeyId, accessKeySecret, bucket, endpoint } =
        app.config.oss.client;
      if (
        !accessKeyId ||
        accessKeyId === "your_access_key_id" ||
        !accessKeySecret ||
        accessKeySecret === "your_access_key_secret"
      ) {
        app.logger.error("Invalid OSS credentials");
        return ctx.helper.error({
          ctx,
          errorType: "imageUploadFail",
          error: "Invalid OSS credentials",
        });
      }

      const { fileSize } = app.config.multipart;
      const parts = ctx.multipart({ limits: { fileSize: fileSize as number } });
      // { urls: [xxx, xxx ]}
      const urls: string[] = [];
      let part: FileStream | string[];

      app.logger.info("Starting multipart file processing");
      while ((part = await parts())) {
        if (Array.isArray(part)) {
          app.logger.info("Form field:", part);
        } else {
          if (!part.filename) {
            app.logger.info("Empty filename, skipping");
            await sendToWormhole(part);
            continue;
          }
          try {
            const savedOSSPath = join(
              "my-test",
              nanoid(6) + extname(part.filename),
            );
            app.logger.info("Uploading to OSS path:", savedOSSPath);
            app.logger.info("OSS bucket:", bucket);
            app.logger.info("OSS endpoint:", endpoint);

            const result = await ctx.oss.put(savedOSSPath, part);
            app.logger.info("OSS upload result:", result);
            const { url } = result;
            urls.push(url);

            if (part.truncated) {
              await ctx.oss.delete(savedOSSPath);
              return ctx.helper.error({
                ctx,
                errorType: "imageUploadFileSizeError",
                error: `Reach fileSize limit ${fileSize} bytes`,
              });
            }
          } catch (e) {
            await sendToWormhole(part);
            app.logger.error("OSS upload error:", e);
            return ctx.helper.error({
              ctx,
              errorType: "imageUploadFail",
              error: `OSS upload failed: ${e instanceof Error ? e.message : "Unknown error"}`,
            });
          }
        }
      }

      app.logger.info("Upload completed, urls:", urls);

      // 检查是否有成功上传的文件
      if (urls.length === 0) {
        app.logger.warn("No files were successfully uploaded");
        return ctx.helper.error({
          ctx,
          errorType: "imageUploadFail",
          error: "No files were successfully uploaded",
        });
      }

      ctx.helper.success({ ctx, res: { urls } });
    } catch (e) {
      app.logger.error("Multipart processing error:", e);
      ctx.helper.error({
        ctx,
        errorType: "imageUploadFail",
        error: `Upload processing failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
    }
  }
  uploadFileUseBusBoy() {
    const { ctx, app } = this;
    return new Promise<string[]>((resolve) => {
      const busboy = new Busboy({ headers: ctx.req.headers as any });
      const results: string[] = [];
      busboy.on("file", (fieldname, file, filename) => {
        app.logger.info(fieldname, file, filename);
        const uid = nanoid(6);
        const savedFilePath = join(
          app.config.baseDir,
          "uploads",
          uid + extname(filename),
        );
        file.pipe(createWriteStream(savedFilePath));
        file.on("end", () => {
          results.push(savedFilePath);
        });
      });
      busboy.on("field", (fieldname, val) => {
        app.logger.info(fieldname, val);
      });
      busboy.on("finish", () => {
        app.logger.info("finished");
        resolve(results);
      });
      ctx.req.pipe(busboy);
    });
  }
  async testBusBoy() {
    const { ctx, app } = this;
    const results = await this.uploadFileUseBusBoy();
    ctx.helper.success({ ctx, res: results });
  }
  // async fileLocalUpload() {
  //   const { ctx, app } = this
  //   const { filepath } = ctx.request.files[0]
  //   // 生成 sharp 实例
  //   const imageSource = sharp(filepath)
  //   const metaData = await imageSource.metadata()
  //   app.logger.debug(metaData)
  //   let thumbnailUrl = ''
  //   // 检查图片宽度是否大于 300
  //   if (metaData.width && metaData.width > 300) {
  //     // generate a new file path
  //     // /uploads/**/abc.png =》 /uploads/**/abc-thumbnail.png
  //     const { name, ext, dir } = parse(filepath)
  //     app.logger.debug(name, ext, dir)
  //     const thumbnailFilePath = join(dir, `${name}-thumbnail${ext}`)
  //     await imageSource.resize({ width: 300 }).toFile(thumbnailFilePath)
  //     thumbnailUrl = thumbnailFilePath.replace(app.config.baseDir, app.config.baseUrl)
  //   }
  //   const url = filepath.replace(app.config.baseDir, app.config.baseUrl)
  //   ctx.helper.success({ ctx, res: { url, thumbnailUrl: thumbnailUrl ? thumbnailUrl : url } })
  // }
  pathToURL(path: string) {
    const { app } = this;
    return path.replace(app.config.baseDir, app.config.baseUrl);
  }

  // async fileUploadByStream() {
  //   const { ctx, app } = this
  //   const stream = await this.ctx.getFileStream()
  //   // uploads/***.ext
  //   // uploads/xxx_thumbnail.ext
  //   const uid = nanoid(6)
  //   const savedFilePath = join(app.config.baseDir, 'uploads', uid + extname(stream.filename))
  //   const savedThumbnailPath = join(app.config.baseDir, 'uploads', uid + '_thumbnail' + extname(stream.filename))
  //   const target = createWriteStream(savedFilePath)
  //   const target2 = createWriteStream(savedThumbnailPath)
  //   const savePromise = pipeline(stream, target)
  //   const transformer = sharp().resize({ width: 300 })
  //   const thumbnailPromise = pipeline(stream, transformer, target2)
  //   try {
  //     await Promise.all([ savePromise, thumbnailPromise ])
  //   } catch (e) {
  //     return ctx.helper.error({ ctx, errorType: 'imageUploadFail' })
  //   }
  //   ctx.helper.success({ ctx, res: { url: this.pathToURL(savedFilePath), thumbnailUrl: this.pathToURL(savedThumbnailPath) } })
  // }

  // 创建异步图像生成任务
  async createImageTask() {
    const { ctx, app } = this;
    try {
      const { prompt } = ctx.request.body;
      if (!prompt) {
        return ctx.helper.error({
          ctx,
          errorType: "paramError",
          error: "Prompt is required",
        });
      }

      // 直接使用dashscope API密钥
      const apiKey =
        app.config.dashscope?.apiKey || process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        app.logger.error("DashScope API key not found");
        return ctx.helper.error({
          ctx,
          errorType: "serverError",
          error: "DashScope API key not found",
        });
      }

      // 调用阿里云通义千问图像生成API（异步）
      const response = await ctx.curl(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
        {
          method: "POST",
          headers: {
            "X-DashScope-Async": "enable",
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          data: {
            model: "wanx-poster-generation-v1",
            input: {
              title: "春节快乐",
              sub_title: "家庭团聚，共享天伦之乐",
              body_text: "春节是中国最重要的传统节日之一，它象征着新的开始和希望",
              prompt_text_zh: "灯笼，小猫，梅花",
              wh_ratios: "竖版",
              lora_name: "童话油画",
              lora_weight: 0.8,
              ctrl_ratio: 0.7,
              ctrl_step: 0.7,
              generate_mode: "generate",
              generate_num: 1
            },
            parameters: {},
          },
          dataType: "json",
        },
      );

      if (response.status !== 200) {
        app.logger.error("DashScope API error:", response.data);
        return ctx.helper.error({
          ctx,
          errorType: "serverError",
          error: response.data.message || "Image generation failed",
        });
      }

      ctx.helper.success({ ctx, res: response.data });
    } catch (e) {
      app.logger.error("Create image task error:", e);
      ctx.helper.error({ ctx, errorType: "serverError", error: e.message });
    }
  }

  // 获取图像生成任务结果
  async getImageTaskResult() {
    const { ctx, app } = this;
    try {
      const { taskId } = ctx.params;
      if (!taskId) {
        return ctx.helper.error({
          ctx,
          errorType: "paramError",
          error: "Task ID is required",
        });
      }

      // 直接使用dashscope API密钥
      const apiKey =
        app.config.dashscope?.apiKey || process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        app.logger.error("DashScope API key not found");
        return ctx.helper.error({
          ctx,
          errorType: "serverError",
          error: "DashScope API key not found",
        });
      }

      // 调用阿里云通义千问任务查询API
      const response = await ctx.curl(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          dataType: "json",
        },
      );

      if (response.status !== 200) {
        app.logger.error("DashScope API error:", response.data);
        return ctx.helper.error({
          ctx,
          errorType: "serverError",
          error: response.data.message || "Failed to get task result",
        });
      }

      ctx.helper.success({ ctx, res: response.data });
    } catch (e) {
      app.logger.error("Get image task result error:", e);
      ctx.helper.error({ ctx, errorType: "serverError", error: e.message });
    }
  }

  // 语音合成API - 代理到字节跳动TTS服务
  async tts() {
    const { ctx, app } = this;
    try {
      const { text, voice, language_type } = ctx.request.body;
      if (!text) {
        return ctx.helper.error({
          ctx,
          errorType: "paramError",
          error: "Text is required",
        });
      }

      // 调用字节跳动TTS API
      const response = await ctx.curl(
        "https://openspeech.bytedance.com/api/v1/tts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 如果需要API密钥，在这里添加
            // "Authorization": `Bearer ${apiKey}`
          },
          data: {
            text: text,
            voice: voice || "zh-CN-YunxiNeural", // 字节跳动默认语音
            format: "mp3",
            sample_rate: 44100,
          },
          dataType: "json",
          timeout: 30000,
        },
      );

      if (response.status !== 200) {
        app.logger.error("ByteDance TTS API error:", response.data);
        return ctx.helper.error({
          ctx,
          errorType: "serverError",
          error: response.data.message || "Text to speech conversion failed",
        });
      }

      // 将字节跳动API响应转换为前端期望的格式
      const result = {
        // 根据字节跳动API实际响应结构调整
        audio_url: response.data.audio_url || null,
        audio: response.data.audio || null,
        output: response.data.output || null,
      };

      ctx.helper.success({ ctx, res: result });
    } catch (e) {
      app.logger.error("TTS proxy error:", e);
      ctx.helper.error({ ctx, errorType: "serverError", error: e.message });
    }
  }

  // 字节跳动TTS API完整代理
  async ttsProxy() {
    const { ctx, app } = this;
    try {
      // 获取前端发送的原始请求数据
      const payload = ctx.request.body;

      // 调用字节跳动TTS API
      const response = await ctx.curl(
        "https://openspeech.bytedance.com/tts/api/v1/tts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 保留前端发送的Authorization头
            ...(ctx.header.authorization
              ? { Authorization: ctx.header.authorization }
              : {}),
          },
          data: payload,
          dataType: "json",
          timeout: 30000,
        },
      );

      // 直接将字节跳动API响应转发给前端
      ctx.status = response.status;
      ctx.body = response.data;
    } catch (e) {
      app.logger.error("TTS full proxy error:", e);
      ctx.status = 500;
      ctx.body = { error: "TTS proxy failed", message: e.message };
    }
  }
}
