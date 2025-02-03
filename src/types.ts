export interface CWE {
  id: string;
  name: string;
  description: string;
}

export interface CWERelation {
  id: number;
  cwe_id: string;
  related_cwe: string;
  relation_type: RelationType;
}

export type RelationType = 
  | 'PeerOf'
  | 'ChildOf'
  | 'CanPrecede'
  | 'CanFollow'
  | 'StartsWith'
  | 'ResultsIn'
  | 'ContributesTo'
  | 'Requires'
  | 'RequiredBy'
  | 'SimilarTo';