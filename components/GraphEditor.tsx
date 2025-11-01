'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ReactFlowData } from '@/types';

interface GraphEditorProps {
  initialData?: ReactFlowData;
  onDataChange: (data: ReactFlowData) => void;
}

export const GraphEditor: React.FC<GraphEditorProps> = ({ initialData, onDataChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialData?.nodes || [
      {
        id: 'node-1',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'Level 1' },
      },
    ]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodesUpdate = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const onEdgesUpdate = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  React.useEffect(() => {
    onDataChange({ nodes, edges });
  }, [nodes, edges, onDataChange]);

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: `Level ${nodes.length + 1}` },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={addNode}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          Add Node
        </button>
        <button
          onClick={deleteSelected}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          Delete Selected
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesUpdate}
        onEdgesChange={onEdgesUpdate}
        onConnect={onConnect}
        fitView
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

