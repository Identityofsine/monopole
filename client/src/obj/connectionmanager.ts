import { DataEvent } from "@/interface/events";
import { Connection } from "./connection";

export class ConnectionHandler {

	private static instance: ConnectionHandler;

	private connection: Connection | undefined;
	private connected: boolean = false;

	private constructor(connection: Connection) {
		this.connection = connection;
		this.connect();
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
			ConnectionHandler.instance.connect();
		}
		return ConnectionHandler.instance;
	}

	private m_setupConnection() {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}
		this.connection.send({ intent: 'create', name: 'NEXTJS' });
		this.connection.on("message", (event: DataEvent) => {
			console.log("ConnectionHandler :: message received");
			console.log(event);
		});
		this.connection.on("close", (event: CloseEvent) => {
			console.log("ConnectionHandler :: connection closed");
		});
	}

	public async connect(): Promise<boolean> {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}
		const response = await this.connection.connect();
		if (!response) {
			return false;
		}
		this.m_setupConnection();
		return true;
	}

	public get Connection(): Connection {
		return this.connection as Connection;
	}

	public get isConnected(): boolean {
		return this.connected;
	}

}
