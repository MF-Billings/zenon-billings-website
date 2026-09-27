import type { Page } from '@playwright/test'

export type Rgb = readonly [red: number, green: number, blue: number]

// The page's rendered ground: flat --paper-cold-press under the grain at 50%
// multiply, as measured for the README's contrast table.
export const PAPER: Rgb = [241, 237, 230]

// The flat token, and the grain's average multiply factor on it (PAPER / FLAT,
// about 0.976 per channel). The grain multiplies over pigment too, so the
// model darkens everything by the same factor rather than starting from PAPER.
const FLAT_PAPER: Rgb = [247, 243, 236]
const GRAIN: Rgb = [249, 249, 249]

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

// WCAG 2 contrast ratio, 1 to 21.
export const contrastRatio = (a: Rgb, b: Rgb) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export type Legibility = { text: string; minContrast: number; pixels: number }

// Every piece of text that can sit over a brushstroke on the home page, with
// its WCAG floor: 4.5:1 for body text, 3:1 for large text and icons. A check
// with `whenVisible` only runs while that element is laid out (the nav row
// folds behind the menu toggle on a phone). Shared by the home e2e and the
// on-demand measure spec, so both judge the same things.
export const LEGIBILITY_CHECKS: ReadonlyArray<{
  selector: string
  floor: number
  whenVisible?: string
}> = [
  { selector: '.hero__wordmark', floor: 3 },
  { selector: '.hero__tagline', floor: 4.5 },
  { selector: '.home-featured h2', floor: 3 },
  { selector: '.site-header__links a', floor: 4.5, whenVisible: '.site-header__links' },
  { selector: '.site-header__menu-toggle', floor: 3, whenVisible: '.site-header__menu-toggle' },
]

// Fonts swap in after first paint and a <picture> re-selects its file
// asynchronously; measuring before either lands passes on a broken page.
export const settleBrushstrokes = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    const shown = Array.from(document.querySelectorAll<HTMLImageElement>('img.brushstroke')).filter(
      (img) => getComputedStyle(img).display !== 'none',
    )
    await Promise.all(shown.map((img) => img.decode()))
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })
}

// The lowest contrast between an element's ink and what is painted beneath its
// glyph lines, with every visible brushstroke composited over the flat paper
// token in a canvas at its rendered box and opacity, then darkened by the
// grain's average factor. No screenshot: the grain nudges single pixels either
// way, and its average is what the README's figures are measured against, so
// bare paper comes out as PAPER and pigment as pigment under the same grain.
// The luminance maths is repeated inside the page because evaluate() cannot
// see this module's functions.
export const minContrastUnder = (page: Page, selector: string): Promise<Legibility[]> =>
  page.evaluate(
    ([selector, flat, grain]) => {
      const channel = (value: number) => {
        const c = value / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

      const root = document.documentElement
      const canvas = new OffscreenCanvas(root.scrollWidth, root.scrollHeight)
      const context = canvas.getContext('2d')!
      context.fillStyle = `rgb(${flat.join(',')})`
      context.fillRect(0, 0, canvas.width, canvas.height)
      const rootPx = parseFloat(getComputedStyle(root).fontSize)
      for (const img of document.querySelectorAll<HTMLImageElement>('img.brushstroke')) {
        const style = getComputedStyle(img)
        if (style.display === 'none') continue
        const rect = img.getBoundingClientRect()
        const left = rect.left + scrollX
        const top = rect.top + scrollY
        context.globalAlpha = Number(style.opacity)
        context.drawImage(img, left, top, rect.width, rect.height)
        context.globalAlpha = 1

        // The brushstroke's own top-band fade (see _materials.scss): pigment
        // held at fade-to above fade-top, ramping to full over the last 1rem.
        // Registered properties, so these read as plain px and a number.
        // Fading pigment to a share is the same as laying paper over it at
        // one minus that share.
        const fadeTop = parseFloat(style.getPropertyValue('--brushstroke-fade-top')) || 0
        const fadeTo = Number(style.getPropertyValue('--brushstroke-fade-to') || 1)
        if (fadeTop > 0 && fadeTo < 1) {
          const paperOver = `rgba(${flat.join(',')},${1 - fadeTo})`
          const veil = context.createLinearGradient(0, top, 0, top + fadeTop)
          veil.addColorStop(0, paperOver)
          veil.addColorStop(Math.max(0, (fadeTop - rootPx) / fadeTop), paperOver)
          veil.addColorStop(1, `rgba(${flat.join(',')},0)`)
          context.fillStyle = veil
          context.fillRect(left, top, rect.width, fadeTop)
        }

        // And its left-edge fade: nothing painted up to fade-left-clear,
        // ramping to full pigment at fade-left. Percentages are of the
        // brushstroke's width.
        const share = (name: string) => {
          const raw = style.getPropertyValue(name).trim()
          const value = parseFloat(raw) || 0
          return raw.endsWith('%') ? (value / 100) * rect.width : value
        }
        const clear = share('--brushstroke-fade-left-clear')
        const fadeLeft = share('--brushstroke-fade-left')
        if (fadeLeft > 0) {
          const paper = `rgba(${flat.join(',')},1)`
          const veil = context.createLinearGradient(left, 0, left + fadeLeft, 0)
          veil.addColorStop(0, paper)
          veil.addColorStop(Math.min(1, Math.max(0, clear / fadeLeft)), paper)
          veil.addColorStop(1, `rgba(${flat.join(',')},0)`)
          context.fillStyle = veil
          context.fillRect(left, top, fadeLeft, rect.height)
        }
      }
      context.globalCompositeOperation = 'multiply'
      context.fillStyle = `rgb(${grain.join(',')})`
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-over'

      return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => {
        const [r, g, b] = getComputedStyle(element).color.match(/\d+/g)!.map(Number)
        const ink = luminance(r, g, b)
        const range = document.createRange()
        range.selectNodeContents(element)
        const rects = element.textContent?.trim()
          ? Array.from(range.getClientRects())
          : [element.getBoundingClientRect()]
        let minContrast = Infinity
        let pixels = 0
        for (const rect of rects) {
          // Clamped to the canvas: outside it getImageData reads as black.
          const x0 = Math.max(0, Math.floor(rect.left + scrollX))
          const y0 = Math.max(0, Math.floor(rect.top + scrollY))
          const w = Math.min(canvas.width - x0, Math.ceil(rect.width))
          const h = Math.min(canvas.height - y0, Math.ceil(rect.height))
          if (w <= 0 || h <= 0) continue
          const data = context.getImageData(x0, y0, w, h).data
          for (let i = 0; i < data.length; i += 4) {
            const c = contrast(luminance(data[i], data[i + 1], data[i + 2]), ink)
            if (c < minContrast) minContrast = c
            pixels++
          }
        }
        return { text: element.textContent!.trim(), minContrast, pixels }
      })
    },
    [selector, FLAT_PAPER, GRAIN] as const,
  )
