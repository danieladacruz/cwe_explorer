/*
  # Secure CWE data access
  
  1. Security
    - Enable RLS on `cwe` and `cwe_relations` tables
    - Add policies for public read access
    - No write access needed (read-only data)
*/

-- Enable RLS
ALTER TABLE cwe ENABLE ROW LEVEL SECURITY;
ALTER TABLE cwe_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to CWE data"
  ON cwe
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to CWE relations"
  ON cwe_relations
  FOR SELECT
  TO public
  USING (true);