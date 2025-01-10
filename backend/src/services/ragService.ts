import { OpenAI } from '@langchain/openai';
import { BufferWindowMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { PineconeService } from './pineconeService';

class RAGService {
  private s3Key: string;
  private userEmail: string;
  private llm: OpenAI;
  private vectorStore: PineconeService;
  private memory: BufferWindowMemory;
  private chain: ConversationChain;

  constructor(s3Key: string, userEmail: string, model_name: string = 'gpt-3.5-turbo', temperature: number = 0.7) {
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

    // Initialize memory with window size of 10
    this.memory = new BufferWindowMemory({ 
      memoryKey: "chat_history",
      k: 10,  
      returnMessages: true,
      inputKey: "input",
      outputKey: "response"
    });

    // Initialize chain with RAG prompt
    const template = `You are a helpful AI assistant answering questions based on provided context.

Context from document: {context}

Chat History: {chat_history}
Human: {input}
AI: `;

    const prompt = PromptTemplate.fromTemplate(template);

    this.chain = new ConversationChain({
      llm: this.llm,
      memory: this.memory,
      prompt,
      outputKey: "response",
      verbose: true
    });
  }

  async queryDocument(query: string): Promise<string> {
    try {
      // Get relevant context from vector store
      const vectorSearchResults = await this.vectorStore.vectorSearch(
        query, 
        this.userEmail, 
        this.s3Key
      );

      // Combine context chunks
      const context = vectorSearchResults.join('\n\n');

      // Generate response using chain
      const response = await this.chain.call({
        input: query,
        context: context
      });

      return response.response;
    } catch (error) {
      console.error('Error querying document:', error);
      throw error;
    }
  }
  async resetMemory(): Promise<void> {
    await this.memory.clear();
  }
}

export default RAGService;