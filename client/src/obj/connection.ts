import { Events } from "@/interface/events";
import { WebSocketEvent } from "./listener";
import { BaseIntent, DecisionType } from "shared-types";

export type ConnectionParams = {
	intent: 'join' | 'create',
	name: string
	game_uuid?: string
}

export abstract class Connection extends Events<WebSocketEvent> {
	abstract send(data: string | BaseIntent): void;
	abstract connect(): Promise<boolean>;
	abstract close(code?: number, reason?: string): void;
}

export interface ConnectionInterface {
	send(data: BaseIntent): void;
	askPlayer(tree: DecisionType[]): void;
	getUUID(): string;
	getGameUUID(): string;
}
