import { createWorker } from 'tesseract.js'

export async function recognizeImageOCR(imageBase64: string): Promise<string> {
  const worker = await createWorker(['eng', 'chi_sim'])
  const { data: { text } } = await worker.recognize(imageBase64)
  await worker.terminate()
  return text
}
