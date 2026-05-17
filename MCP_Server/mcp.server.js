import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "demo-server", version: "1.0.0" });
// ... register tools, resources, prompts ...

server.registerTool(
  "addTwoNumbers",
  {
    title: "Addition Tool",
    description: "Add Two Numbers",
    inputSchema:{
      a: z.number().describe("The First Number"),
      b: z.number().describe("The Second Number"),
    },
  },

  async ({ a, b }) => ({
    contents: [{ type: "text", text: String(a + b) }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
