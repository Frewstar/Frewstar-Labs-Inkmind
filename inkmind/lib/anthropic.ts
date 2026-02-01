import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client using the API key from environment variables
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default client;