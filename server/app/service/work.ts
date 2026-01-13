import { Service } from 'egg'
import { nanoid } from 'nanoid'
import { Types } from 'mongoose'
import { WorkProps } from '../model/work'
import { IndexCondition } from '../controller/work'
const defaultIndexCondition: Required<IndexCondition> = {
  pageIndex: 0,
  pageSize: 10,
  select: '',
  populate: '',
  customSort: { createdAt: -1 },
  find: {}
}
export default class WorkService extends Service {
  async createEmptyWork(payload) {
    const { ctx } = this
    // 拿到对应的 user id
    const { username, _id } = ctx.state.user
    // 拿到一个独一无二的 URL id
    const uuid = nanoid(6)
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      user: new Types.ObjectId(_id),
      author: username,
      uuid
    }
    // 创建新作品
    const createdWork = await ctx.model.Work.create(newEmptyWork)
    // 将作品ID添加到用户的works数组中
    await ctx.model.User.findByIdAndUpdate(_id, { $push: { works: createdWork._id } })
    return createdWork
  }
  async copyWork(wid: number) {
    const { ctx } = this
    const copiedWork = await this.ctx.model.Work.findOne({ id: wid })
    if (!copiedWork || !copiedWork.isPublic) {
      throw new Error('can not be copied')
    }
    const uuid = nanoid(6)
    const { content, title, desc, coverImg, id, copiedCount } = copiedWork
    const { _id, username } = ctx.state.user
    const newWork: WorkProps = {
      user: _id,
      author: username,
      uuid,
      coverImg,
      copiedCount: 0,
      status: 1,
      title: `${title}-复制`,
      desc,
      content,
      isTemplate: false,
      templateId: copiedWork._id.toString()
    }
    // 创建新作品
    const res = await ctx.model.Work.create(newWork)
    // 将作品ID添加到用户的works数组中
    await ctx.model.User.findByIdAndUpdate(_id, { $push: { works: res._id } })
    await ctx.model.Work.findOneAndUpdate({ id }, {
      copiedCount: copiedCount + 1,
    })
    return res
  }
  async getList(condition: IndexCondition) {
    const fcondition = { ...defaultIndexCondition, ...condition }
    const { pageIndex, pageSize, select, populate, customSort, find } = fcondition
    const skip = pageIndex * pageSize
    const res = await this.ctx.model.Work
      .find(find).select(select).populate(populate as any)
      .skip(skip)
      .limit(pageSize)
      .sort(customSort)
      .lean()

    // 手动转换数据格式，确保返回id字段而不是_id字段
    const transformedRes = res.map(item => {
      const transformedItem = { ...item }
      // 如果有_id字段且没有id字段，则将_id转换为id
      if (transformedItem._id && !transformedItem.id) {
        transformedItem.id = transformedItem._id
      }
      // 删除_id和__v字段
      delete transformedItem._id
      delete transformedItem.__v
      return transformedItem
    })

    const count = await this.ctx.model.Work.find(find).countDocuments()
    return { count, list: transformedRes, pageSize, pageIndex }
  }
  async publish(id: number, isTemplate = false) {
    const { ctx } = this
    const { H5BaseURL } = ctx.app.config
    const payload: Partial<WorkProps> = {
      status: 2,
      latestPublishAt: new Date(),
      ...(isTemplate && { isTemplate: true })
    }
    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, { new: true })
    const { uuid } = res
    return `${H5BaseURL}/p/${id}-${uuid}`
  }
}
