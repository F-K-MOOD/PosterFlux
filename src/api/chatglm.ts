import service from "@/utils/request"

export function getPexelsList(params: { page: number, per_page: number }) {
  return service.get('/pexels/list', {
    params
  })
}