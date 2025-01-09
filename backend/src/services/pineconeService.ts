import { Pinecone, Index, PineconeConfiguration } from '@pinecone-database/pinecone';
import pdfParse from 'pdf-parse';

import { logInfo, logError, logDebug } from '../utils/logger';
import { s3Service } from './s3Service';
interface PineconeIndexConfig {
  dimension: number;
  metric?: 'euclidean' | 'cosine' | 'dotproduct';
  serverlessSpec?: {
    cloud: 'aws' | 'gcp';
    region: string;
  };
}

interface PineconeServiceConfig {
  indexName: string;
  indexConfig: PineconeIndexConfig;
}

export class PineconeService {
  static instance: PineconeService;
  private client: Pinecone;
  private dbIndex!: Index;
  private readonly indexName: string;

  public constructor(config: PineconeServiceConfig) {
    try {
      if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY is not set');
      }
      this.client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      
      this.indexName = config.indexName;
      this.initializeIndex(config.indexConfig).catch(error => {
        console.error('Failed to initialize Pinecone index:', error);
        throw new Error('Pinecone index initialization failed');
      });
    } catch (error) {
      console.error('Failed to create Pinecone client:', error);
      throw new Error('Pinecone client initialization failed');
    }
  }

  private async initializeIndex(indexConfig: PineconeIndexConfig): Promise<void> {
    try {
      const indexList = await this.client.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);
      
      if (!indexExists) {
        console.log(`Creating new index: ${this.indexName}`);
        await this.client.createIndex({
          name: this.indexName,
          dimension: indexConfig.dimension,
          metric: indexConfig.metric || 'cosine',
          spec: {
            serverless: indexConfig.serverlessSpec || {
              cloud: 'aws',
              region: 'us-west-2'
            }
          }
        });
        
        await this.waitForIndex();
      } else {
        console.log(`Using existing index: ${this.indexName}`);
      }

      this.dbIndex = this.client.index(this.indexName);
    } catch (error) {
      console.error('Error during index initialization:', error);
      throw new Error('Failed to initialize index');
    }
  }

  private async waitForIndex(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const indexDescription = await this.client.describeIndex(this.indexName);
        if (indexDescription.status?.ready) {
          console.log('Index is ready');
          return;
        }
      } catch (error) {
        console.warn(`Attempt ${attempts + 1}: Index not ready yet`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }
    
    throw new Error('Index failed to become ready in time');
  }

  public static getInstance(config: PineconeServiceConfig): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService(config);
    }
    return PineconeService.instance;
  }

  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      logDebug('Starting PDF text extraction');
      
      const data = await pdfParse(buffer);
      const text = data.text;

      logInfo('PDF text extraction completed', { 
        pageCount: data.numpages,
        textLength: text.length 
      });

      return text;
    } catch (error) {
      logError('Error extracting text from PDF', error as Error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private chunkText(text: string, chunkSize: number = 512, overlap: number = 128): string[] {
    try {
      logDebug('Starting text chunking', { textLength: text.length });
      
      // Calculate total chunks needed
      const totalChunks = Math.ceil(text.length / (chunkSize - overlap));
      const chunks: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * (chunkSize - overlap);
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push(chunk);
        
        if (i % 10 === 0) {
          logDebug('Chunking progress', { 
            chunksCreated: i + 1, 
            totalChunks,
            lastChunkLength: chunk.length 
          });
        }
      }

      logDebug('Text chunking completed', { 
        totalChunks: chunks.length,
        averageChunkSize: Math.round(text.length / chunks.length)
      });

      return chunks;
    } catch (error) {
      logError('Error during text chunking', error as Error, { textLength: text.length });
      throw new Error('Failed to chunk text');
    }
  }

  private chunks<T>(array: T[], batchSize: number = 200): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  public async insertDocument(s3Key: string, userEmail: string): Promise<void> {
    try {
      logInfo('Starting document insertion process', { s3Key, userEmail });

      // 1. Fetch and extract text
      const pdfBuffer = await s3Service.getObjectContent(s3Key);
      const documentText = await this.extractTextFromPDF(pdfBuffer);
      logInfo('Text extraction completed', { 
        s3Key, 
        textLength: documentText.length 
      });

      // 2. Create chunks
      const chunks = this.chunkText(documentText);
      logInfo('Text chunking completed', { 
        s3Key, 
        totalChunks: chunks.length 
      });

      // 3. Generate embeddings and upsert in batches
      const BATCH_SIZE = 50;
      const model = 'multilingual-e5-large';
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        logDebug('Processing batch', { 
          s3Key, 
          batchNumber: Math.floor(i/BATCH_SIZE) + 1,
          totalBatches: Math.ceil(chunks.length/BATCH_SIZE)
        });
        
        const embeddings = await this.client.inference.embed(
          model,
          batchChunks,
          { inputType: 'passage', truncate: 'END' }
        );

        const batchVectors = batchChunks.map((chunk, index) => ({
          id: `${s3Key}_chunk_${i + index}`,
          values: Object.values(embeddings[index]),
          metadata: {
            s3Key,
            chunkIndex: i + index,
            content: chunk
          }
        }));

        await this.dbIndex.namespace(userEmail).upsert(batchVectors);
        
        logDebug('Batch processed and uploaded', { 
          s3Key, 
          batchNumber: Math.floor(i/BATCH_SIZE) + 1,
          chunksProcessed: Math.min(i + BATCH_SIZE, chunks.length)
        });
      }

      logInfo('Document processing completed successfully', { 
        s3Key, 
        userEmail, 
        totalChunks: chunks.length
      });
    } catch (error) {
      logError('Document insertion failed', error as Error, { s3Key, userEmail });
      throw error;
    }
  }
  public async deleteDocument(s3Key: string, userEmail: string): Promise<void> {
    try {
      // TODO: Implement delete functionality
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
  
  public async vectorSearch(
    query: string,
    userEmail: string,
    s3Key: string,
    topN: number = 3
  ): Promise<string[]> {
    try {
      logInfo('Starting vector search', { userEmail, s3Key, topN });

      // Generate embedding for the query
      const model = 'multilingual-e5-large';
      const queryEmbedding = await this.client.inference.embed(
        model,
        [query],
        { inputType: 'query', truncate: 'END' }
      ).catch(error => {
        logError('Failed to generate query embedding', error as Error);
        throw new Error('Failed to process search query');
      });

      // Search in Pinecone with metadata filter
      const searchResults = await this.dbIndex.namespace(userEmail).query({
        vector:  Object.values(queryEmbedding[0]),
        filter: { s3Key: { $eq: s3Key } },
        topK: topN,
        includeMetadata: true
      });

      // Extract content from metadata
      const contentResults = searchResults.matches.map(match => 
        match.metadata?.content as string
      ).filter(Boolean);

      logInfo('Vector search completed', {
        userEmail,
        s3Key,
        resultsFound: contentResults.length
      });

      return contentResults;
    } catch (error) {
      logError('Vector search failed', error as Error, {
        userEmail,
        s3Key,
        topN
      });
      throw error;
    }
  }
}