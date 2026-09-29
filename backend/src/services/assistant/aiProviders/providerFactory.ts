import { AIProvider } from "./AIProvider";
import { DeterministicAiProvider } from "./DeterministicAiProvider";
import { GeminiProvider } from "./GeminiProvider";

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  public static getProvider(): AIProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.AI_PROVIDER || "deterministic").toLowerCase();

    if (providerType === "gemini" && (process.env.AI_API_KEY || process.env.GEMINI_API_KEY)) {
      this.instance = new GeminiProvider();
    } else {
      this.instance = new DeterministicAiProvider();
    }

    return this.instance;
  }

  public static setProvider(provider: AIProvider): void {
    this.instance = provider;
  }

  public static resetProvider(): void {
    this.instance = null;
  }
}
