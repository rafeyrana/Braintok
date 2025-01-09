import { OpenAI } from '@langchain/openai';
import { PineconeService } from './pineconeService';

class RAGService {
  private s3Key: string;
  private userEmail: string;
  private llm: OpenAI;
  private vectorStore: PineconeService;
  constructor(s3Key: string, userEmail: string, model_name : string = 'gpt-3.5-turbo', temperature : number = 0.7) {
    this.s3Key = s3Key;
    this.userEmail = userEmail;
    
    this.llm = new OpenAI({
      modelName: model_name,
      temperature: temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.vectorStore = new PineconeService({
      indexName: "braintok",
      indexConfig: {
        dimension: 1024,
        metric: 'cosine',
        serverlessSpec: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      }
    });
  }

  async initialize(): Promise<void> {
    await this.vectorStore.insertDocument(this.s3Key, this.userEmail);
  }

  async queryDocument(query: string): Promise<string> {
    try {
      const vectorSearchResults = await this.vectorStore.vectorSearch(query, this.userEmail, this.s3Key);
      console.log("these are the vector store results", vectorSearchResults);
      // TODO: Implement context retrieval from vector store
      // TODO: Generate response using LLM with context

      // Placeholder return
      return "Response will be implemented with Pinecone integration";
    } catch (error) {
      console.error('Error querying document:', error);
      throw error;
    }
  }
}

export default RAGService;