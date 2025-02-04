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
  const [selectedCWEs, setSelectedCWEs] = useState<CWE[]>([]);
  const [cwesData, setCWEsData] = useState<Record<string, CWE>>({});

  const handleNodeClick = async (nodeId: string) => {
    if (cwesData[nodeId]) {
      setSelectedCWEs([cwesData[nodeId]]);
      return;
    }

    try {
      const data = await fetchCWEData(nodeId);
      if (data) {
        const { cwe } = data;
        setCWEsData(prev => ({ ...prev, [nodeId]: cwe }));
        setSelectedCWEs([cwe]);
      }
    } catch (err) {
      console.error('Error fetching CWE data:', err);
    }
  };

  const removePanel = (index: number) => {
    setSelectedCWEs(prev => prev.filter((_, i) => i !== index));
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
        return '#22c55e';
      case 'ParentOf':
        return '#a855f7';
      case 'PeerOf':
        return '#eab308';
      default:
        return '#6b7280';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const calculateNodePosition = (relationType: string, index: number, total: number) => {
    const radius = 500;
    const spacing = (2 * Math.PI) / Math.max(total, 1);
    let angle;

    switch (relationType) {
      case 'ChildOf':
        angle = Math.PI / 2 + (spacing * index - (Math.PI / 2));
        return {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle) + 200
        };
      case 'ParentOf':
        angle = -Math.PI / 2 + (spacing * index - (Math.PI / 2));
        return {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle) - 200
        };
      case 'PeerOf':
        return {
          x: radius + 200,
          y: (index - (total - 1) / 2) * 400
        };
      default:
        return {
          x: -radius - 200,
          y: (index - (total - 1) / 2) * 400
        };
    }
  };

  const formatCWEId = (input: string): string => {
    return input.replace(/[^\d]/g, '');
  };

  const handleViewGraph = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCWEData(id);
      if (!data) {
        setError(`CWE-${id} not found`);
        setNodes([]);
        setEdges([]);
        return;
      }
      
      const { cwe, relations } = data;
      
      const newCWEsData: Record<string, CWE> = { [cwe.id]: cwe };
      
      const newNodes: Node[] = [
        {
          id: cwe.id,
          data: { 
            label: (
              <div className="text-center" title={cwe.name}>
                <div className="text-lg font-bold border-b border-white/20 pb-1 mb-1">
                  CWE-{cwe.id}
                </div>
                <div className="text-sm">
                  {truncateText(cwe.name, 30)}
                </div>
              </div>
            )
          },
          position: { x: 0, y: 0 },
          type: 'default',
          className: `node-main transition-all duration-300 ${loading ? 'opacity-50' : ''}`
        }
      ];
      
      const relationsByType = relations.reduce((acc, rel) => {
        const type = rel.relation_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(rel);
        return acc;
      }, {} as Record<string, CWERelation[]>);
      
      const newEdges: Edge[] = [];
      const processedCWEs = new Set([cwe.id]);
      
      await Promise.all(Object.entries(relationsByType).map(async ([relationType, rels]) => {
        await Promise.all(rels.map(async (rel, index) => {
          const isSource = rel.cwe_id === cwe.id;
          const relatedId = isSource ? rel.related_cwe : rel.cwe_id;
          
          if (!processedCWEs.has(relatedId)) {
            processedCWEs.add(relatedId);
            
            const relatedData = await fetchCWEData(relatedId);
            if (relatedData) {
              newCWEsData[relatedId] = relatedData.cwe;
              
              const position = calculateNodePosition(relationType, index, rels.length);
              
              newNodes.push({
                id: relatedId,
                data: { 
                  label: (
                    <div className="text-center" title={relatedData.cwe.name}>
                      <div className="font-bold border-b border-current/20 pb-1 mb-1">
                        CWE-{relatedId}
                      </div>
                      <div className="text-sm">
                        {truncateText(relatedData.cwe.name, 25)}
                      </div>
                    </div>
                  )
                },
                position,
                type: 'default',
                className: `node-related ${getNodeStyle(relationType)} transition-all duration-300 ${loading ? 'opacity-50' : ''}`
              });
              
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
            }
          }
        }));
      }));
      
      setNodes(newNodes);
      setEdges(newEdges);
      setCWEsData(newCWEsData);
    } catch (err) {
      setError('Error fetching CWE data');
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!cweId) return;
    
    const formattedId = formatCWEId(cweId);
    if (!formattedId) {
      setError('Please enter a valid CWE ID number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCWEData(formattedId);
      if (!data) {
        setError(`CWE-${formattedId} not found`);
        setNodes([]);
        setEdges([]);
        setSelectedCWEs([]);
        return;
      }
      
      const { cwe, relations } = data;
      setSelectedCWEs([cwe]);
      
      const newCWEsData: Record<string, CWE> = { [cwe.id]: cwe };
      
      const newNodes: Node[] = [
        {
          id: cwe.id,
          data: { 
            label: (
              <div className="text-center" title={cwe.name}>
                <div className="text-lg font-bold border-b border-white/20 pb-1 mb-1">
                  CWE-{cwe.id}
                </div>
                <div className="text-sm">
                  {truncateText(cwe.name, 30)}
                </div>
              </div>
            )
          },
          position: { x: 0, y: 0 },
          type: 'default',
          className: `node-main transition-all duration-300 ${loading ? 'opacity-50' : ''}`
        }
      ];
      
      const relationsByType = relations.reduce((acc, rel) => {
        const type = rel.relation_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(rel);
        return acc;
      }, {} as Record<string, CWERelation[]>);
      
      const newEdges: Edge[] = [];
      const processedCWEs = new Set([cwe.id]);
      
      Object.entries(relationsByType).forEach(([relationType, rels]) => {
        rels.forEach(async (rel, index) => {
          const isSource = rel.cwe_id === cwe.id;
          const relatedId = isSource ? rel.related_cwe : rel.cwe_id;
          
          if (!processedCWEs.has(relatedId)) {
            processedCWEs.add(relatedId);
            
            const relatedData = await fetchCWEData(relatedId);
            if (relatedData) {
              newCWEsData[relatedId] = relatedData.cwe;
              
              const position = calculateNodePosition(relationType, index, rels.length);
              
              newNodes.push({
                id: relatedId,
                data: { 
                  label: (
                    <div className="text-center" title={relatedData.cwe.name}>
                      <div className="font-bold border-b border-current/20 pb-1 mb-1">
                        CWE-{relatedId}
                      </div>
                      <div className="text-sm">
                        {truncateText(relatedData.cwe.name, 25)}
                      </div>
                    </div>
                  )
                },
                position,
                type: 'default',
                className: `node-related ${getNodeStyle(relationType)} transition-all duration-300 ${loading ? 'opacity-50' : ''}`
              });
              
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
      setSelectedCWEs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 py-8">
        {/* Header and Search Section */}
        <div className="text-center mb-8">
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
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]|(?!^)-/g, '');
                    setCweId(value);
                  }}
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

        {/* Main Content Area - Horizontal Layout */}
        {nodes.length > 0 ? (
          <div className="flex gap-6">
            {/* Graph Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6 relative flex-1">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Relationship Graph</h2>
              </div>
              <Graph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
            </div>

            {/* Description Panel */}
            {selectedCWEs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden w-1/3 h-[800px] flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span>CWE-{selectedCWEs[0].id}</span>
                        <a
                          href={`https://cwe.mitre.org/data/definitions/${selectedCWEs[0].id}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white transition-colors"
                          title="View on MITRE"
                        >
                          <Info size={16} />
                        </a>
                      </h2>
                      <h3 className="text-lg mt-1 text-white/90">{selectedCWEs[0].name}</h3>
                    </div>
                    <button
                      onClick={() => removePanel(0)}
                      className="text-white/80 hover:text-white transition-colors p-1"
                      title="Close panel"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Relationship Types */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
                        Relationships
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['ChildOf', 'ParentOf', 'PeerOf', 'Other'].map((type) => {
                          const count = edges.filter(edge => 
                            edge.label === type && 
                            (edge.source === selectedCWEs[0]?.id || edge.target === selectedCWEs[0]?.id)
                          ).length;
                          
                          return (
                            <div 
                              key={type}
                              className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                                type === 'ChildOf' ? 'bg-green-100 text-green-800' :
                                type === 'ParentOf' ? 'bg-purple-100 text-purple-800' :
                                type === 'PeerOf' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <span className="font-medium">{type}</span>
                              <span className="font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
                        Description
                      </h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedCWEs[0].description}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
                        Quick Actions
                      </h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => window.open(`https://cwe.mitre.org/data/definitions/${selectedCWEs[0].id}.html`, '_blank')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Info size={16} />
                          <span>View on MITRE</span>
                        </button>
                        <button
                          onClick={() => handleViewGraph(selectedCWEs[0].id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Network size={16} />
                          <span>View Graph</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !loading && (
          <div className="text-center text-gray-500 mt-20">
            <Network className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
            <p className="text-lg">Enter a CWE ID to view its dependency graph</p>
            <p className="text-sm text-gray-400 mt-2">The graph will show relationships between Common Weakness Enumerations</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;