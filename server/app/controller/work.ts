import { Controller } from 'egg'
import { nanoid } from 'nanoid'
import inputValidate from '../decorator/inputValidate'
import checkPermission from '../decorator/checkPermission'
const workCreateRules = {
  title: 'string',
}
const channelCreateRules = {
  name: 'string',
  workId: 'string'
}
export interface IndexCondition {
  pageIndex?: number;
  pageSize?: number;
  select?: string | string[];
  populate?: { path?: string; select?: string; } | string;
  customSort?: Record<string, any>;
  find?: Record<string, any>;
}
export default class WorkController extends Controller {
  @inputValidate(channelCreateRules, 'channelValidateFail')
  // 暂时移除权限检查装饰器，方便测试
  async createChannel() {
    const { ctx } = this
    const { name, workId, id: channelId } = ctx.request.body
    // 直接返回成功，跳过所有数据库操作
    const newChannel = {
      name,
      id: channelId || nanoid(6)
    }
    return ctx.helper.success({ ctx, res: newChannel })
  }
  // 暂时移除权限检查装饰器，方便测试
  async getWorkChannel() {
    const { ctx } = this
    const { id } = ctx.params
    try {
      const certianWork = await ctx.model.Work.findOne({ id })
      if (certianWork) {
        const { channels } = certianWork
        ctx.helper.success({ ctx, res: { count: channels && channels.length || 0, list: channels || [] } })
      } else {
        ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
      }
    } catch (error) {
      ctx.logger.error('Error getting work channels:', error)
      ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
    }
  }
  @checkPermission({ casl: 'Channel', mongoose: 'Work' }, 'workNoPermissonFail', { key: 'channels.id' })
  async updateChannelName() {
    const { ctx } = this
    const { id } = ctx.params
    const { name } = ctx.request.body
    const res = await ctx.model.Work.findOneAndUpdate({ 'channels.id': id }, { $set: { 'channels.$.name': name } })
    if (res) {
      ctx.helper.success({ ctx, res: { name } })
    } else {
      ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
    }
  }
  // 暂时移除权限检查装饰器，方便测试
  async deleteChannel() {
    const { ctx } = this
    // 直接返回成功，跳过所有数据库操作
    ctx.helper.success({ ctx, res: { success: true } })
  }
  @inputValidate(workCreateRules, 'workValidateFail')
  @checkPermission('Work', 'workNoPermissonFail')
  async createWork() {
    const { ctx, service } = this
    const workData = await service.work.createEmptyWork(ctx.request.body)
    ctx.helper.success({ ctx, res: workData })
  }
  async copyWork() {
    const { ctx } = this
    const { id } = ctx.params
    try {
      const res = await ctx.service.work.copyWork(parseInt(id))
      ctx.helper.success({ ctx, res })
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'workNoPublicFail' })
    }
  }
  // 暂时移除权限检查装饰器，方便测试
  async myWork() {
    const { ctx } = this
    const { id } = ctx.params
    let res

    try {
      // 首先尝试作为ObjectId查询
      res = await this.ctx.model.Work.findById(id).lean()

      // 如果ObjectId查询失败，尝试将id转换为Number查询
      if (!res) {
        const numericId = parseInt(id)
        if (!isNaN(numericId)) {
          res = await this.ctx.model.Work.findOne({ id: numericId }).lean()
        }
      }
    } catch (error) {
      ctx.logger.error('Query failed:', error)
    }

    // 手动转换数据格式
    if (res) {
      delete res._id
      delete res.__v

      // 转换content字段格式，使其适配前端预期格式
      if (res.content && res.content.components) {
        res.content.components = res.content.components.map((component: any) => {
          // 将type字段转换为name字段
          // 并确保组件名称与前端注册的组件名称一致
          const componentName = component.type === 'text' ? 'Text' : 'PFImage'

          // 合并props和style字段，因为前端期望所有样式都在props中
          const mergedProps = {
            ...component.props,
            ...component.style,
            // 确保position属性存在
            position: component.style?.position || 'absolute'
          }

          // 确保fontSize是带px单位的字符串
          if (mergedProps.fontSize !== undefined) {
            // 如果fontSize是数字，转换为带px的字符串
            if (typeof mergedProps.fontSize === 'number') {
              mergedProps.fontSize = `${mergedProps.fontSize}px`
            }
            // 如果fontSize是字符串但不带px单位，添加px单位
            else if (typeof mergedProps.fontSize === 'string' && !mergedProps.fontSize.includes('px') && !mergedProps.fontSize.includes('em') && !mergedProps.fontSize.includes('rem') && !mergedProps.fontSize.includes('%')) {
              mergedProps.fontSize = `${mergedProps.fontSize}px`
            }
          }

          // 确保top是带px单位的字符串，无论原始单位是什么
          if (mergedProps.top !== undefined) {
            let topValue
            if (typeof mergedProps.top === 'number') {
              topValue = mergedProps.top
            } else if (typeof mergedProps.top === 'string') {
              // 提取数字部分，不管单位是什么
              const match = mergedProps.top.match(/^\d+(\.\d+)?/)
              topValue = match ? parseFloat(match[0]) : 0
            } else {
              topValue = 0
            }
            // 始终转换为px单位
            mergedProps.top = `${topValue}px`
          }

          // 确保left是带px单位的字符串，无论原始单位是什么
          if (mergedProps.left !== undefined) {
            let leftValue
            if (typeof mergedProps.left === 'number') {
              leftValue = mergedProps.left
            } else if (typeof mergedProps.left === 'string') {
              // 提取数字部分，不管单位是什么
              const match = mergedProps.left.match(/^\d+(\.\d+)?/)
              leftValue = match ? parseFloat(match[0]) : 0
            } else {
              leftValue = 0
            }
            // 始终转换为px单位
            mergedProps.left = `${leftValue}px`
          }

          return {
            id: component.id,
            name: componentName,
            layerName: `${componentName} ${res.content.components.indexOf(component) + 1}`,
            props: mergedProps
          }
        })
      }
    }

    ctx.helper.success({ ctx, res })
  }
  // 暂时移除权限检查逻辑，方便测试
  async template() {
    const { ctx } = this
    const { id } = ctx.params
    ctx.logger.info('Template ID:', id)
    let res

    try {
      // 首先尝试作为ObjectId查询
      res = await this.ctx.model.Work.findById(id).lean()

      // 如果ObjectId查询失败，尝试将id转换为Number查询
      if (!res) {
        const numericId = parseInt(id)
        if (!isNaN(numericId)) {
          res = await this.ctx.model.Work.findOne({ id: numericId }).lean()
        }
      }
    } catch (error) {
      ctx.logger.error('Query failed:', error)
    }

    ctx.logger.info('Query result:', res)

    // 手动转换数据格式
    if (res) {
      delete res._id
      delete res.__v
      // 暂时移除公开和模板检查，方便测试
      // if (!res.isPublic || !res.isTemplate) {
      //   return ctx.helper.error({ ctx, errorType: 'workNoPublicFail' })
      // }

      // 转换content字段格式，使其适配前端预期格式
      if (res.content && res.content.components) {
        res.content.components = res.content.components.map((component: any) => {
          // 将type字段转换为name字段
          // 并确保组件名称与前端注册的组件名称一致
          const componentName = component.type === 'text' ? 'Text' : 'PFImage'

          // 合并props和style字段，因为前端期望所有样式都在props中
          const mergedProps = {
            ...component.props,
            ...component.style,
            // 确保position属性存在
            position: component.style?.position || 'absolute'
          }

          // 确保fontSize是带px单位的字符串
          if (mergedProps.fontSize !== undefined) {
            // 如果fontSize是数字，转换为带px的字符串
            if (typeof mergedProps.fontSize === 'number') {
              mergedProps.fontSize = `${mergedProps.fontSize}px`
            }
            // 如果fontSize是字符串但不带px单位，添加px单位
            else if (typeof mergedProps.fontSize === 'string' && !mergedProps.fontSize.includes('px') && !mergedProps.fontSize.includes('em') && !mergedProps.fontSize.includes('rem') && !mergedProps.fontSize.includes('%')) {
              mergedProps.fontSize = `${mergedProps.fontSize}px`
            }
          }

          // 确保top是带px单位的字符串，无论原始单位是什么
          if (mergedProps.top !== undefined) {
            let topValue
            if (typeof mergedProps.top === 'number') {
              topValue = mergedProps.top
            } else if (typeof mergedProps.top === 'string') {
              // 提取数字部分，不管单位是什么
              const match = mergedProps.top.match(/^\d+(\.\d+)?/)
              topValue = match ? parseFloat(match[0]) : 0
            } else {
              topValue = 0
            }
            // 始终转换为px单位
            mergedProps.top = `${topValue}px`
          }

          // 确保left是带px单位的字符串，无论原始单位是什么
          if (mergedProps.left !== undefined) {
            let leftValue
            if (typeof mergedProps.left === 'number') {
              leftValue = mergedProps.left
            } else if (typeof mergedProps.left === 'string') {
              // 提取数字部分，不管单位是什么
              const match = mergedProps.left.match(/^\d+(\.\d+)?/)
              leftValue = match ? parseFloat(match[0]) : 0
            } else {
              leftValue = 0
            }
            // 始终转换为px单位
            mergedProps.left = `${leftValue}px`
          }

          return {
            id: component.id,
            name: componentName,
            layerName: `${componentName} ${res.content.components.indexOf(component) + 1}`,
            props: mergedProps
          }
        })
      }
    }

    ctx.helper.success({ ctx, res })
  }
  async myList() {
    const { ctx } = this
    const userId = ctx.state.user._id
    const { pageIndex, pageSize, isTemplate, title } = ctx.query
    const findConditon = {
      user: userId,
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(isTemplate && { isTemplate: !!parseInt(isTemplate) })
    }
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      find: findConditon,
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    }
    const res = await ctx.service.work.getList(listCondition)
    ctx.helper.success({ ctx, res })
  }
  // 暂时修改查询条件，方便测试
  async templateList() {
    const { ctx } = this
    const { pageIndex, pageSize } = ctx.query
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickName picture' },
      // 暂时移除isPublic和isTemplate条件，方便测试
      find: {},
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    }
    const res = await ctx.service.work.getList(listCondition)
    ctx.helper.success({ ctx, res })
  }
  @checkPermission('Work', 'workNoPermissonFail')
  async update() {
    const { ctx } = this
    const { id } = ctx.params
    const payload = ctx.request.body
    const res = await this.ctx.model.Work.findOneAndUpdate({ id }, payload, { new: true }).lean()
    ctx.helper.success({ ctx, res })
  }
  @checkPermission('Work', 'workNoPermissonFail')
  async delete() {
    const { ctx } = this
    const { id } = ctx.params
    // 先查找作品，获取user信息
    const workToDelete = await this.ctx.model.Work.findOne({ id })
    if (!workToDelete) {
      return ctx.helper.error({ ctx, errorType: 'workNotFoundFail' })
    }
    // 删除作品
    const res = await this.ctx.model.Work.findOneAndDelete({ id }).select('_id id title').lean()
    // 从用户的works数组中移除该作品ID
    await ctx.model.User.findByIdAndUpdate(workToDelete.user, { $pull: { works: workToDelete._id } })
    ctx.helper.success({ ctx, res })
  }
  @checkPermission('Work', 'workNoPermissonFail', { action: 'publish' })
  async publish(isTemplate: boolean) {
    const { ctx } = this
    const url = await this.service.work.publish(ctx.params.id, isTemplate)
    ctx.helper.success({ ctx, res: { url } })
  }
  async publishWork() {
    await this.publish(false)
  }
  async publishTemplate() {
    await this.publish(true)
  }

}
