import { DataEvent } from "@/interface/events";
import { Connection } from "./connection";

export class ConnectionHandler {

	private connection: Connection | undefined;
	private connected: boolean = false;

	public constructor(connection: Connection) {
		this.connection = connection;
		this.connect();
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
