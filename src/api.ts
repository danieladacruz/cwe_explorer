import { supabase } from './lib/supabase';
import { CWE, CWERelation } from './types';

export async function fetchCWEData(cweId: string): Promise<{ cwe: CWE, relations: CWERelation[] } | null> {
  try {
    // Fetch CWE details using Supabase client
    const { data: cweData, error: cweError } = await supabase
      .from('cwe')
      .select('*')
      .eq('id', cweId)
      .single();

    if (cweError) throw cweError;
    if (!cweData) return null;

    // Fetch relations using Supabase client
    const { data: relations, error: relationsError } = await supabase
      .from('cwe_relations')
      .select('*')
      .or(`cwe_id.eq.${cweId},related_cwe.eq.${cweId}`);

    if (relationsError) throw relationsError;

    return {
      cwe: cweData,
      relations: relations || []
    };
  } catch (error) {
    console.error('Error in fetchCWEData:', error);
    return null;
  }
}