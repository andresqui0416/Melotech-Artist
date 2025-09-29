import { NextRequest } from 'next/server';

// Store connected clients
const clients = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add client to the set
      clients.add(controller);
      console.log('Client connected to SSE, total clients:', clients.size);

      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' });
      controller.enqueue(`data: ${data}\n\n`);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(controller);
        console.log('Client disconnected from SSE, total clients:', clients.size);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast events to all connected clients
export function broadcastEvent(event: { type: string; data: any }) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  
  clients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Remove disconnected clients
      clients.delete(controller);
    }
  });
  
  console.log(`Broadcasted ${event.type} to ${clients.size} clients`);
}
