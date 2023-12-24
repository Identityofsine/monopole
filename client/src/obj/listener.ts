import { EventError } from "@/interface/eventerror";
import { DataEvent, ErrorEvent, EEvent, Events } from "@/interface/events";
import { Connection } from "./connection";


export type WebSocketEvent = "open" | "close" | "message" | "error";
type WebSocketEventArgument<T extends WebSocketEvent> = T extends "open" ? EEvent : T extends "close" ? CloseEvent : T extends "message" ? DataEvent : T extends "error" ? ErrorEvent : never;
type WebSocketFunction<T extends WebSocketEvent> = (event: WebSocketEventArgument<T>) => void;

export class WebSocketConnection extends Connection {
	protected events: Map<WebSocketEvent, Map<string, WebSocketFunction<WebSocketEvent>>> = new Map();
	private socket: WebSocket | undefined;
	private URI: string = "";

	constructor(URI: string) {
		super();
		this.URI = URI;
	}

	private async m_setupSocket(): Promise<boolean> {
		if (!this.socket) {
			throw new Error("Socket not initialized");
		}

		return new Promise((resolve, _reject) => {
			if (!this.socket) {
				throw new Error("Socket not initialized");
			}
			this.socket.onopen = (_event: Event) => {
				this.emit("open", { type: "open" });
				resolve(true);
				console.log("WebSocketConnection :: WebSocket opened");
			}
			this.socket.onmessage = (event: MessageEvent) => {
				this.emit("message", { type: "message", data: JSON.parse(event.data) });
				console.log("WebSocketConnection :: WebSocket message received");
			}
			this.socket.onclose = (event: CloseEvent) => {
				this.emit("close", { type: "close", code: event.code, reason: event.reason });
				console.log("WebSocketConnection :: WebSocket closed");
			}
			this.socket.onerror = (event: Event) => {
				this.emit("error", { type: "error", error: new EventError(event.type, "WebSocketConnection :: WebSocket") });
				this.socket?.close();
				this.socket == null;
				resolve(false);
			}
		});
	}

	async connect(): Promise<boolean> {
		if (this.socket) {
			return false;
		}
		this.socket = new WebSocket(this.URI);
		return await this.m_setupSocket();
	}

	public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
		if (!this.socket) {
			throw new Error("Socket not initialized");
		}
		this.socket.send(JSON.stringify(data));
	}

	public close(code?: number, reason?: string): void {
		if (!this.socket) {
			throw new Error("Socket not initialized");
		}
		this.socket.close(code, reason);
	}

}


