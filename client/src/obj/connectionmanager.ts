import { DataEvent } from "@/interface/events";
import { Connection, ConnectionParams } from "./connection";
import { BaseIntent } from "shared-types";


export class ConnectionHandler {

	private static instance: ConnectionHandler;

	private connection: Connection | undefined;
	private connected: boolean = false;

	private constructor(connection: Connection) {
		this.connection = connection;
	}

	public static getInstance(connection: Connection | undefined): ConnectionHandler {
		if (!ConnectionHandler.instance) {
			if (!connection) {
				throw new Error("Connection not initialized, cannot create instance without connection");
			}
			ConnectionHandler.instance = new ConnectionHandler(connection);
			return ConnectionHandler.instance;
		}

		if (ConnectionHandler.instance.isConnected === false) {
		}
		return ConnectionHandler.instance;
	}

	public send(message: BaseIntent): void {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}
		this.connection.send(message);
	}

	private m_setupConnection(name: string, uuid?: string) {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}

		let packet: ConnectionParams = { intent: 'create', name: name };
		if (uuid) {
			packet.intent = 'join';
			packet.game_uuid = uuid;
		}

		this.send(packet);
		this.connection.on("message", (event: DataEvent) => {
			console.log("ConnectionHandler :: message received");
			console.log(event);
		});
		this.connection.on("close", (event: CloseEvent) => {
			console.log("ConnectionHandler :: connection closed");

		});
	}

	public async connect(name: string, game_uuid?: string): Promise<boolean> {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}
		const response = await this.connection.connect();
		if (!response) {
			return false;
		}
		this.m_setupConnection(name, game_uuid);
		return true;
	}

	public get Connection(): Connection {
		return this.connection as Connection;
	}

	public get isConnected(): boolean {
		return this.connected;
	}

}
