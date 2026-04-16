import asyncio
import json
from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # We use json.dumps to ensure it's a string, or send_json
        dead_links = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_links.append(connection)
        
        for dead in dead_links:
            self.disconnect(dead)

manager = ConnectionManager()
