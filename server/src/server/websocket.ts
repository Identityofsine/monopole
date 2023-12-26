import * as WebSocket from 'ws';
import Delegate, { DelegateExpectedFunction } from '../lib/delegate';

export interface IWebSocketEvent {
	name: string;
	ws: WebSocket;
	data?: any;
}

type ServerInstanceEvents = 'connection' | 'message' | 'close' | 'listening' | 'error';

export default class ServerInstance {
	private static instance: ServerInstance;
	private server: WebSocket.Server;
	private https_server: any;
	private events: Map<ServerInstanceEvents, Delegate<void, IWebSocketEvent>> = new Map();

	private constructor() {
		//init server with settings
		this.https_server = require('http').createServer();

		this.server = new WebSocket.Server({
			port: 8337,
		});
		this.server.on('connection', (ws: WebSocket) => {
			this.call('connection', { name: 'connection', ws });
			ws.on('message', (message: Buffer) => {
				this.call('message', { name: 'message', ws: ws, data: ServerInstance.bufferToString(message) });
			});
		});
		this.server.on('listening', (ws: WebSocket, message: string) => {
			this.call('listening', { name: 'listening', ws });
		})
		this.server.on('close', (ws: WebSocket) => {
			this.call('close', { name: 'close', ws: ws });
		});
		this.server.on('error', (ws: WebSocket, error: Error) => {
			this.call('error', { name: 'error', ws, data: { error } });
		});


	}

	public static getInstance(): ServerInstance {
		if (!ServerInstance.instance) {
			ServerInstance.instance = new ServerInstance();
		}
		return ServerInstance.instance;
	}

	public static bufferToString(buffer: Buffer): string {
		let str = '';
		for (let i = 0; i < buffer.length; i++) {
			str += String.fromCharCode(buffer[i]);
		}
		return str;
	}

	public static safeParse(text: string): any {
		try {
			return JSON.parse(text);
		} catch (e) {
			return null;
		}
	}

	private async call(event: ServerInstanceEvents, args: IWebSocketEvent) {
		if (!this.events.has(event)) return;
		this.events.get(event)!.invoke(args);
	}

	public sendMessageToClient(client: WebSocket, text: string) {
		client.send(text);
	};

	public broadcastMessage(text: string) {
		this.server.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(text);
			}
		});
	}

	public on(event: ServerInstanceEvents, func: DelegateExpectedFunction<void, IWebSocketEvent>) {
		if (!func) return;
		if (!this.events.has(event)) {
			this.events.set(event, new Delegate<void, IWebSocketEvent>());
		}
		this.events.get(event)!.add(func);
	}

	public off(event: ServerInstanceEvents, func: DelegateExpectedFunction<void, IWebSocketEvent>) {
		if (!func) return;
		if (!this.events.has(event)) return;
		this.events.get(event)!.remove(func);
	}

}
