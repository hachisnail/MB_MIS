import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import React from 'react'

/**
 * Minimal NodeView with a tiny toolbar to adjust cols & gap.
 * No heavy logic — just updateAttributes and let CSS handle layout.
 */
export default function GridBlockView({ node, updateAttributes }) {
  const { cols = 2, gap = '1rem', collapseAt = 768 } = node.attrs

  return (
    <NodeViewWrapper className="rt-grid-view">
      <div className="rt-grid-toolbar">
        <div className="rt-grid-toolbar__row">
          <label className="rt-grid-label">Cols</label>
          <select
            className="rt-grid-select"
            value={cols}
            onChange={(e) => updateAttributes({ cols: Number(e.target.value) })}
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <label className="rt-grid-label">Gap</label>
          <input
            className="rt-grid-input"
            value={gap}
            onChange={(e) => updateAttributes({ gap: e.target.value })}
            placeholder="e.g. 1rem, 16px"
          />

          <label className="rt-grid-label">Collapse@</label>
          <input
            className="rt-grid-input"
            type="number"
            value={collapseAt}
            onChange={(e) => updateAttributes({ collapseAt: Number(e.target.value) })}
            min={320}
            step={1}
          />
        </div>
      </div>

      {/* Rendered columns + content */}
      <div
        className="rt-grid-render"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: gap,
        }}
        data-collapse-at={collapseAt}
      >
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
