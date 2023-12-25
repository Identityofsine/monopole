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
		this.connection.on("open", (event: Event) => {
			if (this.connection)
				this.connection.send({ intent: 'create', name: 'NEXTJS' });
		});
		this.connection.on("message", (event: DataEvent) => {
			console.log(event.data);
		});
		this.connection.on("close", (event: CloseEvent) => {
			console.log("ConnectionHandler :: connection closed");
		});
	}

	public async connect(): Promise<boolean> {
		if (!this.connection) {
			throw new Error("Connection not initialized");
		}

		this.m_setupConnection();
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
