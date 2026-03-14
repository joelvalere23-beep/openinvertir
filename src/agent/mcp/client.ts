import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Ejemplo de cómo conectar el Agente a un servidor MCP externo.
 * Esto permitiría usar herramientas de mcp.so dinámicamente.
 */
export async function executeMcpTool(serverPath: string, toolName: string, args: any) {
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
    });

    const client = new Client({
        name: "OpenInvertit-Agent",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });

    await client.connect(transport);
    
    // Llamada a la herramienta del servidor MCP
    const result = await client.callTool({
        name: toolName,
        arguments: args,
    });

    return result;
}
