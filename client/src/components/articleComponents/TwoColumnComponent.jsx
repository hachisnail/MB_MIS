import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

const TwoColumnComponent = (props) => {
  return (
    <NodeViewWrapper className="two-column-block">
      <div className="two-column-grid">
        <div data-type="column-left" className="column column-left">
          <NodeViewContent {...props} nodeKey="0" />
        </div>
        <div data-type="column-right" className="column column-right">
          <NodeViewContent {...props} nodeKey="1" />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default TwoColumnComponent
