import React, { useState } from 'react';
import { Search, Network, AlertCircle } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import Graph from './components/Graph';
import { fetchCWEData } from './api';
import { CWERelation } from './types';

function App() {
  const [cweId, setCweId] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!cweId) return;
    
    setLoading(true);
    setError(null);
    // Clear previous graph state
    setNodes([]);
    setEdges([]);
    
    try {
      const data = await fetchCWEData(cweId);
      if (!data) {
        setError(`CWE-${cweId.replace('CWE-', '')} not found`);
        return;
      }
      
      const { cwe, relations } = data;
      
      const newNodes: Node[] = [
        {
          id: cwe.id,
          data: { 
            label: (
              <div className="text-center">
                <div className="text-lg font-bold border-b border-white/20 pb-1 mb-1">
                  CWE-{cwe.id}
                </div>
                <div className="text-sm">
                  {cwe.name}
                </div>
              </div>
            )
          },
          position: { x: 0, y: 0 },
          type: 'default',
          className: 'node-main transition-all duration-300'
        }
      ];
      
      const newEdges: Edge[] = [];
      const processedCWEs = new Set([cwe.id]);
      
      relations.forEach((rel: CWERelation, index: number) => {
        const isSource = rel.cwe_id === cwe.id;
        const relatedId = isSource ? rel.related_cwe : rel.cwe_id;
        
        if (!processedCWEs.has(relatedId)) {
          processedCWEs.add(relatedId);
          
          const goldenRatio = 1.618033988749895;
          const angle = index * goldenRatio * Math.PI * 2;
          const radius = 250;
          const position = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          };
          
          newNodes.push({
            id: relatedId,
            data: { 
              label: (
                <div className="text-center">
                  <div className="font-bold border-b border-current/20 pb-1 mb-1">
                    CWE-{relatedId}
                  </div>
                </div>
              )
            },
            position,
            type: 'default',
            className: `node-related ${getNodeStyle(rel.relation_type)} transition-all duration-300`
          });
        }
        
        newEdges.push({
          id: `${rel.cwe_id}-${rel.related_cwe}-${rel.relation_type}`,
          source: rel.cwe_id,
          target: rel.related_cwe,
          label: rel.relation_type,
          animated: true,
          type: 'smoothstep',
          className: 'text-xs font-medium transition-all duration-300',
          labelStyle: { fill: '#374151', fontWeight: 500 },
          style: { stroke: getEdgeColor(rel.relation_type) }
        });
      });
      
      // Set new graph state
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      setError('Error fetching CWE data');
    } finally {
      setLoading(false);
    }
  };

  const getNodeStyle = (relationType: string) => {
    switch (relationType) {
      case 'ChildOf':
        return 'node-child';
      case 'ParentOf':
        return 'node-parent';
      case 'PeerOf':
        return 'node-peer';
      default:
        return 'node-other';
    }
  };

  const getEdgeColor = (relationType: string) => {
    switch (relationType) {
      case 'ChildOf':
        return '#10B981';
      case 'ParentOf':
        return '#8B5CF6';
      case 'PeerOf':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Network className="w-12 h-12 text-blue-600 animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CWE Dependency Graph
            </h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 max-w-2xl mx-auto">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cweId}
                  onChange={(e) => setCweId(e.target.value)}
                  placeholder="Enter CWE ID (e.g., 79)"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {(nodes.length > 0 || loading) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <Graph nodes={nodes} edges={edges} />
          </div>
        )}
        
        {!nodes.length && !loading && (
          <div className="text-center text-gray-500 mt-20 bg-white rounded-xl shadow-md p-8">
            <Network className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
            <p className="text-lg">Enter a CWE ID to view its dependency graph</p>
            <p className="text-sm text-gray-400 mt-2">The graph will show relationships between Common Weakness Enumerations</p>
          </div>
        )}
        
        {loading && (
          <div className="text-center text-gray-500 mt-20 bg-white rounded-xl shadow-md p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading graph data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;