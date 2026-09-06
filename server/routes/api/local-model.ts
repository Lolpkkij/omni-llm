import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { LOCAL_MODELS } from "../../../src/lib/localModels";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const action = body?.action || event.node.req.url?.split('?')[1]?.split('=')[1];

  if (!action) {
    throw createError({ statusCode: 400, statusMessage: "Action is required (status|pull|chat)" });
  }

  switch (action) {
    case "status": {
      const { modelId } = body;
      const model = LOCAL_MODELS.find(m => m.modelId === modelId);
      if (!model) throw createError({ statusCode: 404, statusMessage: "Model not found" });
      
      try {
        // Simple ping to the endpoint to check if the local server is up
        const res = await fetch(model.endpoint, { method: 'GET' });
        return { status: "online", ok: res.ok };
      } catch (e) {
        return { status: "offline", error: (e as Error).message };
      }
    }

    case "pull": {
      const { modelId } = body;
      const model = LOCAL_MODELS.find(m => m.modelId === modelId);
      if (!model || model.provider !== "ollama") {
        throw createError({ statusCode: 400, statusMessage: "Pull only supported for Ollama" });
      }

      const ollamaPullUrl = `http://127.0.0.1:11434/api/pull`;
      const upstream = await fetch(ollamaPullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.modelId }),
      });

      if (!upstream.ok) throw createError({ statusCode: upstream.status, statusMessage: "Ollama pull failed" });

      const reader = upstream.body?.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          if (!reader) { controller.close(); return; }
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    }

    case "chat": {
      const { modelId, messages } = body;
      const model = LOCAL_MODELS.find(m => m.modelId === modelId);
      if (!model) throw createError({ statusCode: 404, statusMessage: "Model not found" });

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      if (model.customHeaders) {
        for (const [key, value] of Object.entries(model.customHeaders)) {
          // Replace placeholders like {{HF_TOKEN}} with server-side environment variables
          const replaced = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => 
            process.env[varName] ?? ""
          );
          headers[key] = replaced;
        }
      }

      const upstream = await fetch(model.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model.modelId,
          messages,
          stream: true,
        }),
      });

      if (!upstream.ok) throw createError({ statusCode: upstream.status, statusMessage: "Local chat proxy error" });

      const reader = upstream.body?.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          if (!reader) { controller.close(); return; }
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    }

    default:
      throw createError({ statusCode: 400, statusMessage: `Unsupported action: ${action}` });
  }
});