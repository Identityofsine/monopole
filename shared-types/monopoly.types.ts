declare type UUID = string;

declare type Player = {

}

declare type Space = {

}

export type Trade = {
	source: Player;
	offer: {
		money: number;
		properties: Space[];
	};
};

export type WaitObject = {
	waiting: boolean;
	who: Player | UUID;
	notification?: NotificationEvent;
}

export type LandInformation = {
	space: Space;
	owner?: UUID;
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

export type DecisionType = 'roll' | 'trade' | 'buy' | 'sell' | 'mortgage' | 'unmortgage' | 'build' | 'demolish' | 'ignore' | 'pay';

export type NotificationEvent = {
	type: NotificationType;
	message: string;
	decision?: DecisionType | DecisionType[];
	data?: Object;
}

export type JailData = {
	turns: number;
	in_jail: boolean;
}

export interface MonopolyInterface<T extends object> {
	onNotification(player: Player, communicationlayer: T, notification: NotificationEvent): void;
	onPlayerAdded(player: Player, engine_id: UUID): void;
}

export type MonopolyEngineCommands = 'start'



