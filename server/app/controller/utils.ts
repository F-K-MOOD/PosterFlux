import { Controller } from 'egg'
// import * as sharp from 'sharp'
import * as sendToWormhole from 'stream-wormhole'
import * as Busboy from 'busboy'
import { nanoid } from 'nanoid'
import { createWriteStream, readFileSync } from 'fs'
import { parse, join, extname } from 'path'
import { pipeline } from 'stream/promises'
import { createSSRApp } from 'vue'
import { renderToString, renderToNodeStream } from '@vue/server-renderer'
import { FileStream } from '../../typings/app'
export default class UtilsController extends Controller {
  splitIdAndUuid(str = '') {
    const result = { id: '', uuid: '' }
    if (!str) return result
    const firstDashIndex = str.indexOf('-')
    if (firstDashIndex < 0) return result
    result.id = str.slice(0, firstDashIndex)
    result.uuid = str.slice(firstDashIndex + 1)
    return result
  }
  async renderH5Page() {
    // id-uuid split('-')
    // uuid = aa-bb-cc
    const { ctx, app } = this
    const { idAndUuid } = ctx.params
    const query = this.splitIdAndUuid(idAndUuid)
    try {
      const pageData = await this.service.utils.renderToPageData(query)
      await ctx.render('page.nj', pageData)
    } catch (e) {
      ctx.helper.error({ ctx, errorType: 'h5WorkNotExistError' })
    }
  }
  async uploadToOSS() {
    const { ctx, app } = this
    const stream = await ctx.getFileStream()
    // pf-server /my-test/**.ext
    const savedOSSPath = join('my-test', nanoid(6) + extname(stream.filename))
    try {
      const result = await ctx.oss.put(savedOSSPath, stream)
      app.logger.info(result)
      const { name, url } = result
      ctx.helper.success({ ctx, res: { name, url } })
    } catch (e) {
      await sendToWormhole(stream)
      ctx.helper.error({ ctx, errorType: 'imageUploadFail' })
    }
    // get stream saved to local file
    // file upload to OSS
    // delete local file

    // get stream upload to OSS
  }
  async uploadMutipleFiles() {
    const { ctx, app } = this
    try {
      // 检查OSS配置是否存在
      if (!app.config.oss || !app.config.oss.client) {
        app.logger.error('OSS configuration not found')
        return ctx.helper.error({ ctx, errorType: 'imageUploadFail', error: 'OSS configuration not found' })
      }

      // 检查OSS密钥是否有效
      const { accessKeyId, accessKeySecret, bucket, endpoint } = app.config.oss.client
      if (!accessKeyId || accessKeyId === 'your_access_key_id' || !accessKeySecret || accessKeySecret === 'your_access_key_secret') {
        app.logger.error('Invalid OSS credentials')
        return ctx.helper.error({ ctx, errorType: 'imageUploadFail', error: 'Invalid OSS credentials' })
      }

      const { fileSize } = app.config.multipart
      const parts = ctx.multipart({ limits: { fileSize: fileSize as number } })
      // { urls: [xxx, xxx ]}
      const urls: string[] = []
      let part: FileStream | string[]

      app.logger.info('Starting multipart file processing')
      while ((part = await parts())) {
        if (Array.isArray(part)) {
          app.logger.info('Form field:', part)
        } else {
          if (!part.filename) {
            app.logger.info('Empty filename, skipping')
            await sendToWormhole(part)
            continue
          }
          try {
            const savedOSSPath = join('my-test', nanoid(6) + extname(part.filename))
            app.logger.info('Uploading to OSS path:', savedOSSPath)
            app.logger.info('OSS bucket:', bucket)
            app.logger.info('OSS endpoint:', endpoint)

            const result = await ctx.oss.put(savedOSSPath, part)
            app.logger.info('OSS upload result:', result)
            const { url } = result
            urls.push(url)

            if (part.truncated) {
              await ctx.oss.delete(savedOSSPath)
              return ctx.helper.error({ ctx, errorType: 'imageUploadFileSizeError', error: `Reach fileSize limit ${fileSize} bytes` })
            }
          } catch (e) {
            await sendToWormhole(part)
            app.logger.error('OSS upload error:', e)
            return ctx.helper.error({ ctx, errorType: 'imageUploadFail', error: `OSS upload failed: ${e instanceof Error ? e.message : 'Unknown error'}` })
          }
        }
      }

      app.logger.info('Upload completed, urls:', urls)

      // 检查是否有成功上传的文件
      if (urls.length === 0) {
        app.logger.warn('No files were successfully uploaded')
        return ctx.helper.error({ ctx, errorType: 'imageUploadFail', error: 'No files were successfully uploaded' })
      }

      ctx.helper.success({ ctx, res: { urls } })
    } catch (e) {
      app.logger.error('Multipart processing error:', e)
      ctx.helper.error({ ctx, errorType: 'imageUploadFail', error: `Upload processing failed: ${e instanceof Error ? e.message : 'Unknown error'}` })
    }
  }
  uploadFileUseBusBoy() {
    const { ctx, app } = this
    return new Promise<string[]>(resolve => {
      const busboy = new Busboy({ headers: ctx.req.headers as any })
      const results: string[] = []
      busboy.on('file', (fieldname, file, filename) => {
        app.logger.info(fieldname, file, filename)
        const uid = nanoid(6)
        const savedFilePath = join(app.config.baseDir, 'uploads', uid + extname(filename))
        file.pipe(createWriteStream(savedFilePath))
        file.on('end', () => {
          results.push(savedFilePath)
        })
      })
      busboy.on('field', (fieldname, val) => {
        app.logger.info(fieldname, val)
      })
      busboy.on('finish', () => {
        app.logger.info('finished')
        resolve(results)
      })
      ctx.req.pipe(busboy)
    })
  }
  async testBusBoy() {
    const { ctx, app } = this
    const results = await this.uploadFileUseBusBoy()
    ctx.helper.success({ ctx, res: results })
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
    const { app } = this
    return path.replace(app.config.baseDir, app.config.baseUrl)
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

  async getPexelsList() {
    const { ctx, app } = this
    try {
      const { page = 1, per_page = 10 } = ctx.query
      const pageNum = parseInt(page as string)
      const perPage = parseInt(per_page as string)

      const csvFilePath = join(app.config.baseDir, 'export_urls.csv')
      const csvContent = readFileSync(csvFilePath, 'utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim())

      const data: Array<{ id: number, name: string, url: string, description: string }> = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        if (values.length >= 4) {
          data.push({
            id: parseInt(values[0]),
            name: values[1],
            url: values[2],
            description: values[3]
          })
        }
      }

      const total = data.length
      const startIndex = (pageNum - 1) * perPage
      const endIndex = startIndex + perPage
      const paginatedData = data.slice(startIndex, endIndex)

      ctx.helper.success({
        ctx,
        res: {
          data: paginatedData,
          total,
          page: pageNum,
          per_page: perPage,
          total_pages: Math.ceil(total / perPage)
        }
      })
    } catch (e) {
      app.logger.error('Error reading CSV file:', e)
      ctx.helper.error({
        ctx,
        errorType: 'imageUploadFail',
        error: `Failed to read CSV file: ${e instanceof Error ? e.message : 'Unknown error'}`
      })
    }
  }
}
