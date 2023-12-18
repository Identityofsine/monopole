import { UUID } from "./identifiable";
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

export type DecisionType = 'roll' | 'trade' | 'buy' | 'sell' | 'mortgage' | 'unmortgage' | 'build' | 'demolish';

export type NotificationEvent = {
	type: NotificationType;
	message: string;
	decision?: DecisionType;
}
