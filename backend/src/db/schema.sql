-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    filename TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    upload_status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_email for faster queries
CREATE INDEX idx_documents_user_email ON documents(user_email);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own documents
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

-- Create policy to allow users to insert their own documents
CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.jwt() ->> 'email' = user_email);

-- Create document_embeddings table
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    embedding_status TEXT NOT NULL DEFAULT 'pending',
    embedding_provider TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error TEXT,
    UNIQUE(document_id, embedding_provider)
);
