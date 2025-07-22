import { config } from "dotenv";
import readline from "readline";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenAI } from "@google/genai";
config()
let tools: any[] = [];
const ai=new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});

const mcpClient= new Client({
    name: "example-client",
    version: "1.0.0",
   
})

const chatHistory: any[] = [];

const rl= readline.createInterface({
input:process.stdin,
output:process.stdout,
});

mcpClient.connect(new SSEClientTransport(
    new URL ("http://localhost:3000/sse")
  )).then(async()=>{
    console.log("Connected to MCP server");
         tools= (await mcpClient.listTools()).tools.map(tool=>{
           
            return {
                name: tool.name,
                description: tool.description,
               parameters:{
                type:tool.inputSchema.type,
                properties:tool.inputSchema.properties,
                required:tool.inputSchema.required,
               }
            }
        });
       
        chatLoop(null)
  })

  async function chatLoop(toolCall: any) {

    console.log("chatLoop called with toolCall: ", toolCall);
    if (toolCall && toolCall.name) {

chatHistory.push({
    role:"model",
    parts:[{
        text:toolCall?.name
    }]
})

const responsetools = await mcpClient.callTool ({
  name: toolCall?.name,
    arguments: toolCall?.args || {}
});
      console.log("Tool response:",responsetools);

      chatHistory.push({
        role: "model",
        parts: [
            {
                text: JSON.stringify(responsetools?.content)
            }
        ]
    })

    }
    else{
    const question = await new Promise<string>(resolve => rl.question('You: ', resolve));
   
    chatHistory.push({
        role: "user",
        parts: [
            {
                text: question
            }
        ]
    })

    }
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: chatHistory,
        config: {
            tools: [
                {
                    functionDeclarations: tools, 
                }
            ]
        }
    })
 
// console.log("response", response.candidates?.[0]?.content?.parts?.[0]);
        const parts = response.candidates?.[0]?.content?.parts || [];
        const functionCallPart = parts.find(part => part.functionCall);
        const textPart = parts.find(part => part.text);

            if(functionCallPart?.functionCall) {
//  console.log(`AI: ${textPart}`);
                return chatLoop(functionCallPart.functionCall);
            }

        chatHistory.push({
            role: "model",
            parts: [
                {
                    text: textPart?.text
                }
            ]
        })
     
    console.log(`AI: ${textPart?.text}`);
    chatLoop(null);

}