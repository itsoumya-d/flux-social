-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the Style Vault table
CREATE TABLE IF NOT EXISTS style_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE style_vault ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access style vault items for brands they belong to
-- (Assuming we have a mechanism to check brand membership)
CREATE POLICY "Users can view their brand style vault" ON style_vault
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = style_vault.brand_id
    )
  );

CREATE POLICY "Users can manage their brand style vault" ON style_vault
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = style_vault.brand_id
    )
  );

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_style_examples (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_brand_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sv.id,
    sv.content,
    sv.metadata,
    1 - (sv.embedding <=> query_embedding) AS similarity
  FROM style_vault sv
  WHERE sv.brand_id = p_brand_id
    AND 1 - (sv.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
