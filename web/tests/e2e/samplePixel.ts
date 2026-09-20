import { inflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'

export type Rgb = readonly [red: number, green: number, blue: number]

const PNG_SIGNATURE_LENGTH = 8
const CHUNK_HEADER_LENGTH = 8
const CHUNK_CRC_LENGTH = 4

// A 1x1 screenshot is a PNG with a single one-pixel scanline. Every PNG scanline
// filter degenerates to the raw bytes when there is no pixel to the left and no
// row above, so the pixel is simply the three bytes after the filter byte, and
// no PNG library is needed.
const decodeSinglePixelPng = (png: Buffer): Rgb => {
  const imageData: Buffer[] = []
  let offset = PNG_SIGNATURE_LENGTH

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + CHUNK_HEADER_LENGTH)
    if (type === 'IDAT') {
      imageData.push(
        png.subarray(offset + CHUNK_HEADER_LENGTH, offset + CHUNK_HEADER_LENGTH + length),
      )
    }
    offset += CHUNK_HEADER_LENGTH + length + CHUNK_CRC_LENGTH
  }

  const scanline = inflateSync(Buffer.concat(imageData))
  return [scanline[1], scanline[2], scanline[3]]
}

// Reads the rendered colour at one viewport coordinate. Hit-testing cannot do
// this job for decorative layers with `pointer-events: none`, and Playwright's
// screenshot assertions compare whole images rather than answering "is this
// spot painted?".
export const samplePixel = async (page: Page, x: number, y: number): Promise<Rgb> =>
  decodeSinglePixelPng(
    await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1 } }),
  )

// Sum of per-channel differences: robust to the paper grain, which nudges each
// channel by a few units, while a pigment wash moves all three together.
export const colourDistance = (a: Rgb, b: Rgb): number =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
