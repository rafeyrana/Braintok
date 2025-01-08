import { Pinecone, Index, PineconeConfiguration } from '@pinecone-database/pinecone';

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
  private static instance: PineconeService;
  private client: Pinecone;
  private dbIndex: Index;
  private readonly indexName: string;

  private constructor(config: PineconeServiceConfig) {
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

  public async insertDocument(s3Key: string, userEmail: string): Promise<void> {
    try {
      
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error inserting document:', error);
      throw error;
    }
  }

  public async queryDb(s3Key: string, userEmail: string): Promise<any> {
    try {
      // TODO: Implement query functionality
      throw new Error('Not implemented');
    } catch (error) {
      console.error('Error querying database:', error);
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
}