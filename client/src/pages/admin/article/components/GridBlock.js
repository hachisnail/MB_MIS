import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import GridBlockView from '../components/GridBlockView'

/**
 * GridBlock
 * - One block that owns N gridColumn children (2..4).
 * - Attributes are declarative (cols, gap, collapseAt) for CSS/NodeView.
 */
const MIN_COLS = 2
const MAX_COLS = 4

export const GridBlock = Node.create({
  name: 'gridBlock',
  group: 'block',
  content: 'gridColumn{2,4}', // 2..4 columns
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: el => {
          const n = Number(el.getAttribute('data-cols'))
          return Number.isFinite(n) ? Math.min(Math.max(n, MIN_COLS), MAX_COLS) : 2
        },
        renderHTML: attrs => ({ 'data-cols': attrs.cols }),
      },
      gap: {
        default: '1rem',
        parseHTML: el => el.style.gap || '1rem',
        renderHTML: attrs => ({ style: `gap:${attrs.gap};` }),
      },
      collapseAt: {
        default: 768, // px
        parseHTML: el => {
          const n = Number(el.getAttribute('data-collapse-at'))
          return Number.isFinite(n) ? n : 768
        },
        renderHTML: attrs => ({ 'data-collapse-at': attrs.collapseAt }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="grid-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'grid-block', class: 'rt-grid-block' }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GridBlockView)
  },

  addCommands() {
    return {
      /** Insert a new grid with N columns (2..4) */
      insertGrid:
        ({ cols = 2, gap = '1rem', collapseAt = 768 } = {}) =>
        ({ chain }) => {
          const clamp = Math.min(Math.max(cols, MIN_COLS), MAX_COLS)
          const col = () => ({ type: 'gridColumn', content: [{ type: 'paragraph' }] })
          return chain()
            .insertContent({
              type: 'gridBlock',
              attrs: { cols: clamp, gap, collapseAt },
              content: Array.from({ length: clamp }, col),
            })
            .run()
        },

      /** Change column count on the current grid (adds/removes trailing columns). */
      setGridCols:
        (cols) =>
        ({ state, dispatch }) => {
          const clamp = Math.min(Math.max(cols, MIN_COLS), MAX_COLS)
          const { selection, tr, schema } = state
          const $from = selection.$from

          // find nearest gridBlock ancestor
          for (let d = $from.depth; d >= 0; d--) {
            const posBefore = $from.before(d + 1)
            const node = $from.node(d)
            if (node?.type?.name === 'gridBlock') {
              // set new cols attr
              tr.setNodeMarkup(posBefore, undefined, { ...node.attrs, cols: clamp })

              const needed = clamp - node.childCount
              if (needed > 0) {
                // add columns at end
                const colType = schema.nodes.gridColumn
                for (let i = 0; i < needed; i++) {
                  const newCol = colType.createAndFill()
                  if (newCol) {
                    tr.insert($from.end(d) - 1, newCol)
                  }
                }
              } else if (needed < 0) {
                // remove from end
                let endPos = $from.end(d) - 1
                for (let i = 0; i < -needed; i++) {
                  const lastIdx = node.childCount - 1 - i
                  const last = node.child(lastIdx)
                  endPos -= last.nodeSize
                  tr.delete(endPos, endPos + last.nodeSize)
                }
              }

              dispatch?.(tr)
              return true
            }
          }
          return false
        },
    }
  },
})

export default GridBlock
