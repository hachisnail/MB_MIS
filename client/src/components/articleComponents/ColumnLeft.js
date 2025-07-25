// columnLeft.js
import { Node } from '@tiptap/core'

export const ColumnLeft = Node.create({
  name: 'columnLeft',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column-left"]' }]
  },

  renderHTML() {
    return [
      'div',
      { 'data-type': 'column-left', class: 'column-left' },
      0,
    ]
  },
})