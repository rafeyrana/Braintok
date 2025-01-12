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

      try {
        // Generate response using chain
        const response = await this.chain.call({
          input: query,
          context: context
        });

        return response.response;
      } catch (chainError) {
        console.error('Chain error:', chainError);
        
        // Fallback: Direct LLM call without memory if chain fails
        const fallbackResponse = await this.llm.predict(
          `Context: ${context}\n\nQuestion: ${query}\n\nAnswer: `
        );

        // Try to save to memory but don't break if it fails
        try {
          await this.memory.saveContext(
            { input: query },
            { response: fallbackResponse }
          );
        } catch (memoryError) {
          console.error('Memory save error:', memoryError);
        }

        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error querying document:', error);
      
      // Final fallback response if everything fails
      return "I apologize, but I'm having trouble processing your request at the moment. Please try asking your question again, or rephrase it slightly differently.";
    }
  }
  async resetMemory(): Promise<void> {
    await this.memory.clear();
  }
}

export default RAGService;