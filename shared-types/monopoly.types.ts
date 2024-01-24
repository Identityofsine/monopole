import { ExpectedMessages } from "./server.types";

declare type UUID = string;

declare type Identifiable = {
	uuid: UUID;
	name: string;
}

export type Player = Identifiable & {
	uuid: UUID;
	name: string;
	money: number;
	position: number;
}

export type Space = Identifiable & {
	price?: number;
	_owner?: UUID; //player id
	owner?: string; //player name
	buildings?: number;
	onLand?: (...args: any) => void;
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

export type DecisionType = 'roll' | 'trade' | 'buy' | 'sell' | 'mortgage' | 'unmortgage' | 'build' | 'demolish' | 'ignore' | 'pay' | MonopolyEngineCommands;

export type NotificationEvent = {
	type: NotificationType;
	message: ExpectedMessages;
	decision?: DecisionType | DecisionType[];
	data?: object;
}

export type JailData = {
	turns: number;
	in_jail: boolean;
}

export type MonopolyEngineCommands = 'start'

export type IsCommand<T extends string> = T extends MonopolyEngineCommands ? true : false;
