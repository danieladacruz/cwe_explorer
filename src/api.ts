import { supabase } from './lib/supabase';
import { CWE, CWERelation } from './types';

export async function fetchCWEData(cweId: string): Promise<{ cwe: CWE, relations: CWERelation[] } | null> {
  try {
    // Format the CWE ID correctly - strip "CWE-" if present and add it back
    const numericId = cweId.replace('CWE-', '');
    const formattedId = `CWE-${numericId}`;
    
    // Fetch the CWE details
    const { data: cweData, error: cweError } = await supabase
      .from('cwe')
      .select('*')
      .eq('id', numericId)
      .maybeSingle();
    
    if (cweError) {
      console.error('Error fetching CWE:', cweError);
      return null;
    }

    if (!cweData) {
      console.error('CWE not found:', formattedId);
      return null;
    }

    // Fetch all relations for this CWE
    const { data: relations, error: relationsError } = await supabase
      .from('cwe_relations')
      .select(`
        id,
        cwe_id,
        related_cwe,
        relation_type
      `)
      .or(`cwe_id.eq.${numericId},related_cwe.eq.${numericId}`);

    if (relationsError) {
      console.error('Error fetching relations:', relationsError);
      return null;
    }

    return {
      cwe: cweData,
      relations: relations || []
    };
  } catch (error) {
    console.error('Error in fetchCWEData:', error);
    return null;
  }
}