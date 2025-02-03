import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
}

export default function Graph({ nodes: initialNodes, edges: initialEdges, onNodeClick }: GraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => [...eds, params]);
  }, [setEdges]);

  const handleNodeClick = useCallback((event: any, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-[700px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-right"
        className="bg-gray-50"
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls className="bg-white shadow-lg border border-gray-200" />
        <MiniMap
          className="bg-white shadow-lg border border-gray-200"
          nodeColor={(node) => {
            return node.className?.includes('node-main') ? '#3B82F6' : '#94a3b8';
          }}
        />
        <Panel position="top-left" className="bg-white p-2 rounded-lg shadow-md border border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Relationship Types:</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>ChildOf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>ParentOf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>PeerOf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Other</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}