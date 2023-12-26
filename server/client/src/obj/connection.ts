import { Events } from "@/interface/events";
import { WebSocketEvent } from "./listener";

export abstract class Connection extends Events<WebSocketEvent> {
	abstract send(data: string | object | any): void;
	abstract connect(): Promise<boolean>;
	abstract close(code?: number, reason?: string): void;
}
