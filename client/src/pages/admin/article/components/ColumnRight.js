// columnRight.js
import { Node } from '@tiptap/core'

export const ColumnRight = Node.create({
  name: 'columnRight',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column-right"]' }]
  },

  renderHTML() {
    return [
      'div',
      { 'data-type': 'column-right', class: 'column-right' },
      0,
    ]
  },
})