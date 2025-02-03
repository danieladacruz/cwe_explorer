import React, { useState } from 'react';
import { Search, Network, AlertCircle, X, Info } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import Graph from './components/Graph';
import { fetchCWEData } from './api';
import { CWERelation, CWE } from './types';

function App() {
  const [cweId, setCweId] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCWE, setSelectedCWE] = useState<CWE | null>(null);
  const [cwesData, setCWEsData] = useState<Record<string, CWE>>({});
  const [showPanel, setShowPanel] = useState(true);

  const handleNodeClick = (nodeId: string) => {
    const cwe = cwesData[nodeId];
    if (cwe) {
      setSelectedCWE(cwe);
      setShowPanel(true);
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
        return '#22c55e'; // green-500
      case 'ParentOf':
        return '#a855f7'; // purple-500
      case 'PeerOf':
        return '#eab308'; // yellow-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const calculateNodePosition = (relationType: string, index: number, total: number) => {
    const radius = 300; // Distance from center
    const spacing = (2 * Math.PI) / Math.max(total, 1);
    let angle;

    switch (relationType) {
      case 'ChildOf':
        // Position below, spread in a semi-circle
        angle = Math.PI / 2 + (spacing * index - (Math.PI / 2));
        return {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        };
      case 'ParentOf':
        // Position above, spread in a semi-circle
        angle = -Math.PI / 2 + (spacing * index - (Math.PI / 2));
        return {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        };
      case 'PeerOf':
        // Position to the right
        return {
          x: radius,
          y: (index - (total - 1) / 2) * 150
        };
      default:
        // Position to the left
        return {
          x: -radius,
          y: (index - (total - 1) / 2) * 150
        };
    }
  };

  const handleSearch = async () => {
    if (!cweId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCWEData(cweId);
      if (!data) {
        setError(`CWE-${cweId.replace('CWE-', '')} not found`);
        setNodes([]);
        setEdges([]);
        setSelectedCWE(null);
        return;
      }
      
      const { cwe, relations } = data;
      // Set the initial CWE as selected when first searching
      setSelectedCWE(cwe);
      setShowPanel(true);
      
      const newCWEsData: Record<string, CWE> = { [cwe.id]: cwe };
      
      // Create main node
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
          className: `node-main transition-all duration-300 ${loading ? 'opacity-50' : ''}`
        }
      ];
      
      // Group relations by type
      const relationsByType = relations.reduce((acc, rel) => {
        const type = rel.relation_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(rel);
        return acc;
      }, {} as Record<string, CWERelation[]>);
      
      const newEdges: Edge[] = [];
      const processedCWEs = new Set([cwe.id]);
      
      // Process each relation type separately
      Object.entries(relationsByType).forEach(([relationType, rels]) => {
        rels.forEach(async (rel, index) => {
          const isSource = rel.cwe_id === cwe.id;
          const relatedId = isSource ? rel.related_cwe : rel.cwe_id;
          
          if (!processedCWEs.has(relatedId)) {
            processedCWEs.add(relatedId);
            
            // Fetch related CWE data
            const relatedData = await fetchCWEData(relatedId);
            if (relatedData) {
              newCWEsData[relatedId] = relatedData.cwe;
              
              const position = calculateNodePosition(relationType, index, rels.length);
              
              newNodes.push({
                id: relatedId,
                data: { 
                  label: (
                    <div className="text-center">
                      <div className="font-bold border-b border-current/20 pb-1 mb-1">
                        CWE-{relatedId}
                      </div>
                      <div className="text-sm">
                        {relatedData.cwe.name}
                      </div>
                    </div>
                  )
                },
                position,
                type: 'default',
                className: `node-related ${getNodeStyle(relationType)} transition-all duration-300 ${loading ? 'opacity-50' : ''}`
              });
              
              // Add edge
              newEdges.push({
                id: `${rel.cwe_id}-${rel.related_cwe}-${relationType}`,
                source: isSource ? rel.cwe_id : rel.related_cwe,
                target: isSource ? rel.related_cwe : rel.cwe_id,
                label: relationType,
                animated: true,
                type: 'smoothstep',
                className: `text-xs font-medium transition-all duration-300 ${loading ? 'opacity-50' : ''}`,
                labelStyle: { fill: '#374151', fontWeight: 500 },
                style: { stroke: getEdgeColor(relationType) }
              });
              
              setNodes([...newNodes]);
              setEdges([...newEdges]);
              setCWEsData({ ...newCWEsData });
            }
          }
        });
      });
      
      setNodes(newNodes);
      setEdges(newEdges);
      setCWEsData(newCWEsData);
    } catch (err) {
      setError('Error fetching CWE data');
      setNodes([]);
      setEdges([]);
      setSelectedCWE(null);
    } finally {
      setLoading(false);
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
                  <Search size={20} className={loading ? 'animate-spin' : ''} />
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
        
        <div className="flex gap-6 relative">
          <div className={`flex-1 bg-white rounded-xl shadow-lg p-6 mb-6 relative ${loading ? 'opacity-50' : ''}`}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            {(nodes.length > 0 || loading) && <Graph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />}
            {!nodes.length && !loading && (
              <div className="text-center text-gray-500 mt-20">
                <Network className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
                <p className="text-lg">Enter a CWE ID to view its dependency graph</p>
                <p className="text-sm text-gray-400 mt-2">The graph will show relationships between Common Weakness Enumerations</p>
              </div>
            )}
          </div>

          {showPanel && (
            <div className="w-96 sticky top-8 self-start bg-white rounded-xl shadow-lg p-6 mb-6">
              {selectedCWE ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">CWE-{selectedCWE.id}</h2>
                      <h3 className="text-lg text-gray-700">{selectedCWE.name}</h3>
                    </div>
                    <button
                      onClick={() => setShowPanel(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedCWE.description}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">CWE Details</h3>
                  <p className="text-gray-500 text-sm">
                    Search for a CWE and click on any node in the graph to view detailed information about that Common Weakness Enumeration.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;