import { Application } from 'egg'
import { Schema, Document, Model } from 'mongoose'
import * as AutoIncrementFactory from 'mongoose-sequence'

export interface UserProps extends Document {
  username: string;
  password: string;
  email?: string;
  nickName?: string;
  picture?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'email' | 'cellphone' | 'oauth';
  provider?: 'gitee';
  oauthID?: string;
  role?: 'admin' | 'normal';
  description?: string;
  gender?: string;
  works: string[];
}

type UserModel = Model<UserProps>

function initUserModel(app: Application) {
  const mongoose = app.mongoose
  const AutoIncrement = AutoIncrementFactory(mongoose)

  // 使用Schema构造函数但不指定泛型，避免类型检查问题
  const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String },
    nickName: { type: String },
    picture: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    type: { type: String, default: 'email' },
    provider: { type: String },
    oauthID: { type: String },
    role: { type: String, default: 'normal' },
    description: { type: String },
    gender: { type: String },
    works: { type: [mongoose.Schema.Types.ObjectId], ref: 'Work', default: [] }
  }, {
    timestamps: true
  })

  // 确保transform函数正确配置
  UserSchema.set('toJSON', {
    transform(_doc, ret) {
      const userRet = ret as any
      delete userRet.password
      delete userRet.__v
      delete userRet._id
      delete userRet.type
      delete userRet.role
      delete userRet.provider
      delete userRet.oauthID
      delete userRet.email
      // 确保日期格式正确
      if (userRet.createdAt instanceof Date) {
        userRet.createdAt = userRet.createdAt.toISOString()
      }
      if (userRet.updatedAt instanceof Date) {
        userRet.updatedAt = userRet.updatedAt.toISOString()
      }
    }
  })

  UserSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'users_id_counter' })

  // 使用mongoose.model直接创建模型，不使用类型断言
  return mongoose.model<UserProps>('User', UserSchema)
}

export default initUserModel
