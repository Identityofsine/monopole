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

export enum NotificationType {
	INFO,
	DECISION,
	WARNING,
	ERROR
}

export type DecisionType = 'roll' | 'trade' | 'buy' | 'sell' | 'mortgage' | 'unmortgage' | 'build' | 'demolish' | 'ignore';

export type NotificationEvent = {
	type: NotificationType;
	message: string;
	decision?: DecisionType | DecisionType[];
}

export interface MonopolyInterface {
	onNotification(player: Player, communicationlayer: PlayerCommunicationLayer, notification: NotificationEvent): void;
	onPlayerAdded(player: Player, engine_id: UUID.UUID): void;

}
