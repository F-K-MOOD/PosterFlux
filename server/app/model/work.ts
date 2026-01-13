import { Application } from 'egg'
import * as mongoose from 'mongoose'
import * as AutoIncrementFactory from 'mongoose-sequence'

interface ChannelProps {
  name: string;
  id: string;
}
export interface WorkProps {
  id: string;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: { [key: string]: any };
  isTemplate?: boolean;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  user: string;
  latestPublishAt?: Date;
  channels?: ChannelProps[];
  // 源模板ID
  templateId?: string;
}

function initWorkModel(app: Application) {
  const mongooseInstance = app.mongoose
  const Schema = mongooseInstance.Schema
  const AutoIncrement = AutoIncrementFactory(mongooseInstance)
  const WorkSchema = new Schema({
    id: { type: String, unique: true, required: true },
    uuid: { type: String, unique: true },
    title: { type: String, required: true },
    desc: { type: String },
    coverImg: { type: String },
    content: { type: Object },
    isTemplate: { type: Boolean },
    isPublic: { type: Boolean },
    isHot: { type: Boolean },
    author: { type: String, required: true },
    copiedCount: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    channels: { type: Array },
    latestPublishAt: { type: Date },
    // 源模板ID
    templateId: { type: String },
  }, { timestamps: true })

  // 添加toJSON转换函数，确保返回id字段而不是_id字段
  WorkSchema.set('toJSON', {
    transform(_doc, ret) {
      const workRet = ret as any
      delete workRet._id
      delete workRet.__v
      // 确保日期格式正确
      if (workRet.createdAt instanceof Date) {
        workRet.createdAt = workRet.createdAt.toISOString()
      }
      if (workRet.updatedAt instanceof Date) {
        workRet.updatedAt = workRet.updatedAt.toISOString()
      }
      if (workRet.latestPublishAt instanceof Date) {
        workRet.latestPublishAt = workRet.latestPublishAt.toISOString()
      }
    }
  })

  // 使用类型断言绕过类型检查
  return (mongooseInstance.model as any)('Work', WorkSchema)
}

export default initWorkModel
