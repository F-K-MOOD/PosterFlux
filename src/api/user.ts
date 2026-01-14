import {get,post} from "@/utils/request"

export function genVeriCode(cellphone: string) {
  return post('/users/genVeriCode', { phoneNumber: cellphone })
}

export function LoginByPhoneNumber(payload: { phoneNumber: string, verifyCode: string }) {
  const { phoneNumber, verifyCode } = payload
  return post('/users/loginByPhoneNumber', {
    phoneNumber,
    verifyCode
  })
}

export function GetUserInfo() {
  return get('/users/getUserInfo')
}


