'use client';

import { useCallback, useState } from 'react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowExecutor } from '@/lib/workflow-execution';
import { Play, Save, Download, Upload, Loader2 } from 'lucide-react';

export function WorkflowControls() {
  const [running, setRunning] = useState(false);
  const { nodes, edges, selectedNodes, clearSelection } = useWorkflowStore();

  const handleRunFull = useCallback(async () => {
    if (nodes.length === 0) {
      alert('No nodes to run. Add nodes from the sidebar.');
      return;
    }
    setRunning(true);
    try {
      const executor = new WorkflowExecutor(nodes, edges);
      const nodeIds = nodes.map((n) => n.id);
      const result = await executor.execute(nodeIds, 'full');
      alert(`Workflow completed: ${result.status}`);
    } catch (err: any) {
      alert(`Workflow failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  }, [nodes, edges]);

  const handleRunSelected = useCallback(async () => {
    if (selectedNodes.length === 0) {
      alert('Please select one or more nodes first (click on nodes to select).');
      return;
    }
    setRunning(true);
    try {
      const executor = new WorkflowExecutor(nodes, edges);
      await executor.execute(selectedNodes, 'partial');
      alert('Selected nodes completed.');
      clearSelection();
    } catch (err: any) {
      alert(`Workflow failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  }, [nodes, edges, selectedNodes, clearSelection]);

  const handleRunSingle = useCallback(async () => {
    if (selectedNodes.length !== 1) {
      alert('Please select exactly one node to run (click on a node to select it).');
      return;
    }
    setRunning(true);
    try {
      const executor = new WorkflowExecutor(nodes, edges);
      await executor.execute(selectedNodes, 'single');
      alert('Node completed.');
      clearSelection();
    } catch (err: any) {
      alert(`Workflow failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  }, [nodes, edges, selectedNodes, clearSelection]);

  const handleSave = useCallback(async () => {
    const payload = { data: { nodes, edges } };
    try {
      const response = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save workflow');
      }

      alert(`Workflow saved with ID: ${result.id}`);
    } catch (error) {
      console.error('Save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save workflow';
      // Fallback: save to localStorage so user doesn't lose work when DB is unavailable
      try {
        const key = 'workflow-draft';
        localStorage.setItem(key, JSON.stringify(payload));
        alert(`${message}\n\nWorkflow saved locally as draft (key: ${key}). You can Export to download.`);
      } catch {
        alert(message);
      }
    }
  }, [nodes, edges]);

  const handleExport = useCallback(() => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { setNodes, setEdges } = useWorkflowStore.getState();
        
        // Load nodes and edges
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        
        alert('Workflow imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import workflow');
      }
    };
    input.click();
  }, []);

  return (
    <div
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-2 border rounded-xl shadow-2xl p-2 max-w-[95vw] sm:max-w-none pointer-events-auto"
      style={{ backgroundColor: 'var(--node-bg)', borderColor: 'var(--panel-border)' }}
    >
      <button
        onClick={handleRunFull}
        disabled={running || nodes.length === 0}
        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold btn-primary whitespace-nowrap"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        <span className="hidden xs:inline">Run Full</span>
      </button>

      <button
        onClick={handleRunSelected}
        disabled={running || selectedNodes.length === 0}
        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold btn-secondary whitespace-nowrap"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        <span className="hidden xs:inline">Selected</span> ({selectedNodes.length})
      </button>

      <button
        onClick={handleRunSingle}
        disabled={running || selectedNodes.length !== 1}
        className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-semibold btn-secondary"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        Single
      </button>

      <div className="hidden sm:block w-px h-6" style={{ backgroundColor: 'var(--panel-border)' }} />

      <button
        onClick={handleSave}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold btn-secondary"
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">Save</span>
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold btn-secondary"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <button
        onClick={handleImport}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold btn-secondary"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </button>
    </div>
  );
}
