'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import { CourseProgress, ReactFlowData } from '@/types';
import { clsx } from 'clsx';

interface CourseMapProps {
  graphData: ReactFlowData;
  userProgress: CourseProgress | null;
  courseId: string;
}

const nodeTypes = {
  custom: ({ data, selected }: { data: any; selected: boolean }) => {
    const { status, label } = data;
    
    const statusStyles = {
      completed: 'bg-gradient-to-br from-green-400 via-green-500 to-yellow-300 text-white shadow-xl animate-glow',
      unlocked: 'bg-gradient-to-br from-blue-400 via-blue-500 to-purple-400 text-white shadow-xl ring-4 ring-blue-300 animate-pulse-slow',
      locked: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-200 text-gray-600 cursor-not-allowed opacity-60',
    };
    
    return (
      <div
        className={clsx(
          'px-6 py-4 rounded-lg font-semibold text-center min-w-[150px] transition-all duration-300',
          statusStyles[status as keyof typeof statusStyles],
          status === 'locked' && 'hover:scale-100',
          (status === 'completed' || status === 'unlocked') && 'hover:scale-110 cursor-pointer',
        )}
      >
        {label}
        {status === 'completed' && (
          <div className="mt-2 text-sm">✓ Completed</div>
        )}
        {status === 'unlocked' && (
          <div className="mt-2 text-sm animate-pulse-slow">→ Click to Start</div>
        )}
      </div>
    );
  },
};

export const CourseMap: React.FC<CourseMapProps> = ({
  graphData,
  userProgress,
  courseId,
}) => {
  const router = useRouter();
  const completedNodes = new Set(userProgress?.completedNodes || []);
  const currentNode = userProgress?.currentNode || null;

  const getNodeStatus = useCallback(
    (nodeId: string): 'completed' | 'unlocked' | 'locked' => {
      if (completedNodes.has(nodeId)) {
        return 'completed';
      }

      // Check if node is unlocked (either it's the current node or all prerequisites are completed)
      if (currentNode === nodeId) {
        return 'unlocked';
      }

      // Check if all prerequisite nodes are completed
      const prerequisites = graphData.edges
        .filter((edge) => edge.target === nodeId)
        .map((edge) => edge.source);

      if (prerequisites.length === 0) {
        // Root node - check if it's the current node or if no progress exists
        if (!userProgress || userProgress.completedNodes.length === 0) {
          return 'unlocked';
        }
        return currentNode === nodeId ? 'unlocked' : 'locked';
      }

      const allPrerequisitesCompleted = prerequisites.every((prereq) =>
        completedNodes.has(prereq)
      );

      return allPrerequisitesCompleted ? 'unlocked' : 'locked';
    },
    [completedNodes, currentNode, graphData.edges, userProgress]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    graphData.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: getNodeStatus(node.id),
        label: node.data.label || node.id,
      },
      type: 'custom',
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const status = getNodeStatus(node.id);
      if (status === 'locked') {
        return;
      }
      router.push(`/learn/${courseId}/${node.id}`);
    },
    [courseId, getNodeStatus, router]
  );

  const nodeColor = (node: Node) => {
    const status = getNodeStatus(node.id);
    if (status === 'completed') return '#10b981';
    if (status === 'unlocked') return '#3b82f6';
    return '#d1d5db';
  };

  return (
  <div className="w-full h-[600px] border-4 border-game-accent2 rounded-2xl bg-gradient-to-br from-game-surface via-game-background to-game-accent1 animate-glow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={false}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ backgroundColor: '#f9fafb' }}
        />
      </ReactFlow>
    </div>
  );
};

