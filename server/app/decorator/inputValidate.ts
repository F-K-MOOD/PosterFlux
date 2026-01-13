import { GlobalErrorTypes } from '../error'
import { Controller } from 'egg'
// 创建工厂函数传入 rules 和 errorType
export default function validateInput(rules: any, errorType: GlobalErrorTypes) {
  return function(prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function(...args: any[]) {
      const that = this as Controller
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { ctx, app } = that
      console.log('Request body:', ctx.request.body)
      console.log('Validation rules:', rules)
      const errors = app.validator.validate(rules, ctx.request.body)
      if (errors) {
        console.log('Validation errors:', errors)
        return ctx.helper.error({ ctx, errorType, error: errors })
      }
      await originalMethod.apply(this, args)
    }
  }
}
