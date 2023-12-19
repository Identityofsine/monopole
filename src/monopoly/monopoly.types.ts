import { UUID } from "./identifiable";
import { PlayerCommunicationLayer } from "./monopoly";
import { Player } from "./player";
import { Space } from "./space";


export type Trade = {
	source: Player;
	offer: {
		money: number;
		properties: Space[];
	};
};

export type WaitObject = {
	waiting: boolean;
	who: Player | UUID.UUID;
	notification?: NotificationEvent;
}

export type LandInformation = {
	space: Space;
	owner?: UUID.UUID;
	rent?: number; //current rent
	decision?: DecisionType | DecisionType[];
	engine_should_wait: boolean;
}

export enum NotificationType {
	INFO,
	DECISION,
	WARNING,
	ERROR
}

//Keys should be an array
export type Keys<O extends object> = Array<keyof O>;

//exclude keys from type
export type Filter<A extends Record<string, any>, B extends keyof A> = {
	[K in Exclude<keyof A, B>]: A[K]
}

export type DecisionType = 'roll' | 'trade' | 'buy' | 'sell' | 'mortgage' | 'unmortgage' | 'build' | 'demolish' | 'ignore';

export type NotificationEvent = {
	type: NotificationType;
	message: string;
	decision?: DecisionType | DecisionType[];
	data?: Object;
}

export interface MonopolyInterface {
	onNotification(player: Player, communicationlayer: PlayerCommunicationLayer, notification: NotificationEvent): void;
	onPlayerAdded(player: Player, engine_id: UUID.UUID): void;

}
