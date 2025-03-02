-- Habilitar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar função para verificar se uma extensão está instalada
CREATE OR REPLACE FUNCTION check_extension(extension_name text)
RETURNS boolean AS $$
DECLARE
  extension_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = extension_name
  ) INTO extension_exists;
  
  RETURN extension_exists;
END;
$$ LANGUAGE plpgsql;

-- Criar função para verificar se uma função existe
CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
RETURNS boolean AS $$
DECLARE
  function_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = function_name
  ) INTO function_exists;
  
  RETURN function_exists;
END;
$$ LANGUAGE plpgsql;

-- Criar uma função para inicializar a tabela de documentos
CREATE OR REPLACE FUNCTION initialize_documents_table(table_name text, vector_dimension integer)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id text PRIMARY KEY,
      content text NOT NULL,
      metadata jsonb NOT NULL,
      embedding vector(%s) NOT NULL
    )', table_name, vector_dimension);
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_embedding_idx ON %I 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)', 
    table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Criar uma função para encontrar documentos por similaridade
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 