import { Node } from '@tiptap/core';

export const ColumnBlock = Node.create({
  name: 'columnBlock',
  group: 'block',
  content: 'column+',
  parseHTML() {
    return [
      {
        tag: 'div.column-block',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'column-block' }, 0];
  },
});

export const Column = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [
      {
        tag: 'div.column',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'column' }, 0];
  },
});