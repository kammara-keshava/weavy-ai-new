'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/stores/workflow-store';
import { createSampleWorkflow } from '@/lib/sample-workflow';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { WorkflowControls } from './workflow-controls';
import { ThemeToggle } from './theme-toggle';
import { TextNode } from './nodes/text-node';
import { UploadImageNode } from './nodes/upload-image-node';
import { UploadVideoNode } from './nodes/upload-video-node';
import { LLMNode } from './nodes/llm-node';
import { CropImageNode } from './nodes/crop-image-node';
import { ExtractFrameNode } from './nodes/extract-frame-node';
import { Menu, X } from 'lucide-react';

export function WorkflowBuilder() {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      text: TextNode,
      uploadImage: UploadImageNode,
      uploadVideo: UploadVideoNode,
      llm: LLMNode,
      cropImage: CropImageNode,
      extractFrame: ExtractFrameNode,
    }),
    []
  );
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    setSelectedNodes,
  } = useWorkflowStore();

  const handleSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: any[] }) => {
      setSelectedNodes(selected.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  // Load sample workflow on mount if no nodes exist
  useEffect(() => {
    if (nodes.length === 0) {
      const sample = createSampleWorkflow();
      setNodes(sample.nodes);
      setEdges(sample.edges as any);
    }
  }, [nodes.length, setNodes, setEdges]);

  return (
    <div className="flex h-full w-full relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile Menu Buttons */}
      <button
        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
        className="lg:hidden fixed top-20 left-4 z-50 p-3 rounded-lg shadow-lg btn-primary"
        aria-label="Toggle nodes menu"
      >
        {showLeftSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <button
        onClick={() => setShowRightSidebar(!showRightSidebar)}
        className="lg:hidden fixed top-20 right-4 z-50 p-3 rounded-lg shadow-lg btn-secondary"
        aria-label="Toggle history"
      >
        {showRightSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left Sidebar - Desktop always visible, Mobile overlay */}
      <div className={`
        ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        top-0 bottom-0 left-0
        z-40
        transition-transform duration-300 ease-in-out
        w-64
        h-full
      `}>
        <LeftSidebar />
      </div>

      {/* Mobile Overlay - Behind sidebars but above canvas */}
      {(showLeftSidebar || showRightSidebar) && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setShowLeftSidebar(false);
            setShowRightSidebar(false);
          }}
        />
      )}

      {/* Main Canvas - Always at base z-index */}
      <div className="flex-1 relative flex flex-col h-full" style={{ backgroundColor: 'var(--canvas-bg)' }}>
        <div className="absolute top-4 right-4 z-20 hidden sm:block">
          <ThemeToggle />
        </div>
        
        {/* React Flow Container */}
        <div className="absolute inset-0 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={handleSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            panOnDrag={[1, 2]}
            selectionOnDrag={false}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={true}
            preventScrolling={true}
            minZoom={0.1}
            maxZoom={4}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1}
              color="var(--panel-border)"
            />
            <Controls className="hidden sm:flex" />
            <MiniMap
              className="hidden md:block"
              nodeColor="var(--foreground)"
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>
        
        <WorkflowControls />
      </div>

      {/* Right Sidebar - Desktop always visible, Mobile overlay */}
      <div className={`
        ${showRightSidebar ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        top-0 bottom-0 right-0
        z-40
        transition-transform duration-300 ease-in-out
        w-80
        h-full
      `}>
        <RightSidebar />
      </div>
    </div>
  );
}
