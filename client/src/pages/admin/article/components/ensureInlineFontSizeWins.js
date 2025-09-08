// utils/ensureInlineFontSizeWins.js
export function ensureInlineFontSizeWins(html) {
  if (!html) return html
  try {
    // Works in the browser; guard for SSR if needed
    const el = document.createElement('div')
    el.innerHTML = html

    el.querySelectorAll('[style*="font-size"]').forEach(node => {
      const style = node.getAttribute('style') || ''
      // pull the first font-size value (ignore any existing !important)
      const m = style.match(/font-size\s*:\s*([^;!]+)(?:!important)?\s*;?/i)
      if (!m) return
      const size = m[1].trim()

      // remove all font-size declarations from the style attr
      const cleaned = style.replace(/font-size\s*:[^;]*;?/gi, '').trim()
      const next = `${cleaned ? cleaned + '; ' : ''}font-size: ${size} !important;`
      node.setAttribute('style', next)
    })

    return el.innerHTML
  } catch {
    return html
  }
}
