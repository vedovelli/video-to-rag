# Video to RAG

Uma aplicação baseada em Bun que processa vídeos em conteúdo textual para chatbots com RAG (Retrieval-Augmented Generation).

## Características

- **Extração de Áudio**: Extrai áudio de arquivos MP4 usando FFmpeg
- **Transcrição**: Transcreve áudio para texto usando a API Whisper da OpenAI
- **Transformação de Conteúdo**: Transforma transcrições em páginas de suporte bem estruturadas
- **Processamento RAG**: Divide o conteúdo em chunks, gera embeddings e armazena em uma tabela vetorial no Supabase
- **Interface de Chatbot**: Interface simples para consultar a base de conhecimento e gerar respostas

## Pré-requisitos

- [Bun](https://bun.sh/) (v1.0.0 ou superior)
- [FFmpeg](https://ffmpeg.org/) (para extração de áudio)
- Conta na [OpenAI](https://openai.com/) (para transcrição e geração de conteúdo)
- Projeto no [Supabase](https://supabase.com/) (para armazenamento vetorial)

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
bun install
```

3. Crie um arquivo `.env` baseado no `.env.example` e preencha com suas credenciais:

```
OPENAI_API_KEY=sua_chave_api_openai
OPENAI_MODEL=gpt-4o
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
LOG_LEVEL=INFO
```

## Configuração do Supabase

Antes de executar a aplicação, você precisa configurar as tabelas e funções necessárias no Supabase:

1. Acesse o [Console do Supabase](https://app.supabase.com/) e faça login na sua conta.
2. Selecione seu projeto ou crie um novo.
3. Vá para a seção "SQL Editor" no menu lateral.
4. Crie uma nova consulta e cole o conteúdo do arquivo `supabase-setup.sql` ou execute cada comando separadamente:

```sql
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
```

5. Execute a consulta clicando no botão "Run".
6. Verifique se as funções foram criadas corretamente executando:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
SELECT * FROM pg_proc WHERE proname = 'match_documents';
```

7. Obtenha as credenciais do Supabase:

   - URL: Vá para Configurações do Projeto > API > URL da API
   - Chave: Vá para Configurações do Projeto > API > anon/public key

8. Atualize seu arquivo `.env` com essas credenciais.

9. Para verificar se a configuração está correta, execute:

```bash
bun run src/check-supabase.ts
```

10. Se a verificação indicar que a tabela `documents` não foi criada, inicialize-a com:

```bash
bun run src/initialize-db.ts
```

## Uso

1. Coloque seus arquivos de vídeo MP4 na pasta `data/videos/`
2. Execute o pipeline de processamento:

```bash
bun run src/index.ts
```

3. Interaja com o chatbot:

```bash
bun run src/chatbot.ts
```

## Estrutura do Projeto

```
video-to-rag/
├── data/
│   ├── videos/     # Vídeos de entrada
│   ├── audio/      # Áudio extraído
│   ├── transcripts/ # Transcrições
│   └── content/    # Conteúdo processado
├── src/
│   ├── config.ts   # Configuração
│   ├── index.ts    # Ponto de entrada
│   ├── pipeline.ts # Orquestração do pipeline
│   ├── chatbot.ts  # Interface do chatbot
│   ├── query.ts    # Utilitário de consulta
│   ├── check-supabase.ts # Verificação do Supabase
│   ├── initialize-db.ts  # Inicialização da tabela documents
│   ├── services/   # Serviços principais
│   └── utils/      # Utilitários
└── .env            # Variáveis de ambiente
```

## Licença

MIT
