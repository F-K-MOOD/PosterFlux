import axios from 'axios'
import html2canvas from 'html2canvas'

import type { RespUploadData } from '@/types/respTypes'

export async function uploadFile<R = any>(file: Blob, url = "/api/utils/upload-img", fileName = 'screenshot.png') {
  const newFile = file instanceof File ? file : new File([file], fileName)
  const formData = new FormData()
  formData.append(newFile.name, newFile)
  const { data } = await axios.post<R>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data.data.urls[0]
}

function getCanvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => {
      resolve(blob)
    })
  })
}

export async function takeScreenshotAndUpload(ele: HTMLElement) {
  const canvas = await html2canvas(ele, { 
    width: 375, 
    useCORS: true, 
    allowTaint: true, 
    scale: 1,
    logging: false
  })
  const canvasBlob = await getCanvasBlob(canvas)
  if (canvasBlob) {
    const url = await uploadFile<RespUploadData>(canvasBlob)
    return url
  }
}