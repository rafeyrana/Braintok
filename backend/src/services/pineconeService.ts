import { Pinecone, Index, PineconeConfiguration } from '@pinecone-database/pinecone';
import * as pdfjsLib from 'pdfjs-dist';
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
  private dbIndex: Index;
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
      
      const pdf = await pdfjsLib.getDocument(buffer).promise;
      const maxPages = pdf.numPages;
      const pageTextPromises = [];

      // Extract text from each page
      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        pageTextPromises.push(this.extractPageText(pdf, pageNo));
      }

      const pageTexts = await Promise.all(pageTextPromises);
      const fullText = pageTexts.join(' ');

      logInfo('PDF text extraction completed', { 
        pageCount: maxPages,
        textLength: fullText.length 
      });

      return fullText;
    } catch (error) {
      logError('Error extracting text from PDF', error as Error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractPageText(pdf: any, pageNo: number): Promise<string> {
    try {
      const page = await pdf.getPage(pageNo);
      const tokenizedText = await page.getTextContent();
      const pageText = tokenizedText.items
        .map((token: any) => token.str)
        .join(' ');

      logDebug('Extracted text from page', { pageNo, textLength: pageText.length });
      return pageText;
    } catch (error) {
      logError('Error extracting page text', error as Error, { pageNo });
      throw error;
    }
  }

  private chunkText(text: string, chunkSize: number = 1024, overlap: number = 256): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      chunks.push(text.slice(startIndex, endIndex));
      startIndex = endIndex - overlap;
    }

    return chunks;
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

      logDebug('Fetching PDF from S3', { s3Key });
      const pdfBuffer = await s3Service.getObjectContent(s3Key).catch(error => {
        logError('Failed to fetch PDF from S3', error, { s3Key });
        throw new Error('Failed to fetch document from storage');
      });
    
      logDebug('Extracting text from PDF', { s3Key });
      const documentText = await this.extractTextFromPDF(pdfBuffer);
      logInfo('Text extraction completed', { 
        s3Key, 
        textLength: documentText.length 
      });
      
      logDebug('Creating text chunks', { s3Key });
      const chunks = this.chunkText(documentText);
      
      logDebug('Generating embeddings', { s3Key, chunkCount: chunks.length });
      const model = 'multilingual-e5-large';
      const embeddings = await this.client.inference.embed(
        model,
        chunks,
        { inputType: 'passage', truncate: 'END' }
      ).catch(error => {
        logError('Failed to generate embeddings', error, { s3Key, chunkCount: chunks.length });
        throw new Error('Failed to generate document embeddings');
      });

      logDebug('Preparing vectors for upsert', { s3Key });
      const vectors = chunks.map((chunk, index) => ({
        id: `${s3Key}_chunk_${index}`,
        values: Object.values(embeddings[index]),
        metadata: {
          s3Key,
          chunkIndex: index,
          content: chunk
        }
      }));

      const vectorChunks = this.chunks(vectors);
      
      try {
        await Promise.all(
          vectorChunks.map(async (chunk, batchIndex) => {
            try {
              await this.dbIndex.namespace(userEmail).upsert(chunk);
              logDebug('Batch upsert completed', { 
                s3Key, 
                batchIndex, 
                batchSize: chunk.length 
              });
            } catch (error) {
              logError('Batch upsert failed', error as Error, { 
                s3Key, 
                batchIndex, 
                batchSize: chunk.length 
              });
              throw error;
            }
          })
        );
      } catch (error) {
        logError('Vector upsert failed', error as Error, { 
          s3Key, 
          totalVectors: vectors.length 
        });
        throw new Error('Failed to store document vectors');
      }

      logInfo('Document processing completed successfully', { 
        s3Key, 
        userEmail, 
        textLength: documentText.length,
        totalVectors: vectors.length,
        batchCount: vectorChunks.length
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