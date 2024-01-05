import { DataEvent } from "@/interface/events";
import { Connection, ConnectionParams } from "./connection";

export class ConnectionHandler {

	private connection: Connection | undefined;
	private connected: boolean = false;

	public constructor(connection: Connection) {
		this.connection = connection;
		this.connect({ intent: 'create', name: 'NEXTJS' });
	}

	private m_setupConnection(params: ConnectionParams) {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}
		this.connection.on("open", (_event: Event) => {
			if (this.connection)
				this.connection.send(params);
		});
		this.connection.on("close", (_event: CloseEvent) => {
			console.log("ConnectionHandler :: connection closed");
		});
	}

	public async connect(params: ConnectionParams): Promise<boolean> {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}

		this.m_setupConnection(params);
		const response = await this.connection.connect();
		if (!response) {
			return false;
		}
		return true;
	}

	public get Connection(): Connection {
		return this.connection as Connection;
	}

	public get isConnected(): boolean {
		return this.connected;
	}

}
