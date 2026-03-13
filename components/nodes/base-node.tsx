'use client';

import { Handle, Position } from 'reactflow';
import { NODE_DEFINITIONS } from '@/lib/node-definitions';
import { NodeData } from '@/types/workflow';

interface BaseNodeProps {
  data: NodeData;
  children: React.ReactNode;
}

export function BaseNode({ data, children }: BaseNodeProps) {
  const definition = NODE_DEFINITIONS[data.type];
  if (!definition) return null;

  const isRunning = data.running === true;

  return (
    <div
      className={`border-2 rounded-xl shadow-lg min-w-[220px] transition-all ${
        isRunning ? 'node-running' : ''
      }`}
      style={{ borderColor: 'var(--foreground)', backgroundColor: 'var(--node-bg)', cursor: 'grab' }}
    >
      <div
        className="px-5 py-3 border-b flex items-center gap-2 cursor-grab active:cursor-grabbing"
        style={{ borderColor: 'var(--panel-border)', backgroundColor: 'var(--sidebar-bg)' }}
      >
        <span className="text-sm font-bold tracking-tight select-none" style={{ color: 'var(--foreground)' }}>{data.label || definition.label}</span>
      </div>

      <div className="p-4 nodrag nopan">
        {children}
      </div>

      {/* Input handles */}
      {definition.inputs.map((input, index) => {
        const total = definition.inputs.length;
        const left = total === 1 ? '50%' : `${((index + 1) * 100) / (total + 1)}%`;
        return (
          <Handle
            key={input.id}
            type="target"
            position={Position.Top}
            id={input.id}
            style={{
              left: left,
              transform: 'translateX(-50%)',
            }}
          />
        );
      })}

      {/* Output handles */}
      {definition.outputs.map((output, index) => {
        const total = definition.outputs.length;
        const left = total === 1 ? '50%' : `${((index + 1) * 100) / (total + 1)}%`;
        return (
          <Handle
            key={output.id}
            type="source"
            position={Position.Bottom}
            id={output.id}
            style={{
              left: left,
              transform: 'translateX(-50%)',
            }}
          />
        );
      })}
    </div>
  );
}
