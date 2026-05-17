import { config } from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenAI, Type } from "@google/genai";
config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const tools = [];

const transport = new StdioClientTransport({
  command: "node",
  args: ["mcp.server.js"],
});

const client = new Client({ name: "example-client", version: "1.0.0" });

await client.connect(transport);

client.listTools().then(async (response) => {
  //   console.log(response);
  //   console.log(weatherFunctionDeclaration);

  response.tools.forEach((tool) => {
    tools.push({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "OBJECT",
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required || [],
      },
    });
  });

  //   console.log("Required Tools : " , tools);

  const aiResponse = await ai.models.generateContent({
    model: "models/gemini-3-flash-preview",
    contents: "Add 2 and 3",
    config: {
      tools: [
        {
          functionDeclarations: tools,
        },
      ],
    },
  });

  console.log("AI Response : ", aiResponse.functionCalls);

  aiResponse.functionCalls.forEach(async (call) => {
    const toolResponse = await client.callTool({
      name: call.name,
      arguments: call.args,
    });
    console.log("Tool Response : ", toolResponse);
  });
});
