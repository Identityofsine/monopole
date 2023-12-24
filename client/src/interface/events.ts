import { EventError } from "./eventerror";

export type EventID = string;


export type EEvent = {
	type: string;
	message?: string;
}

export type OpenEvent = Event;

export type ErrorEvent = {
	type: string;
	error: EventError;
};

export type DataEvent = {
	type: string;
	data: object;
};

export abstract class Events<T extends string> {
	protected events: Map<T, Map<EventID, Function>> = new Map();
	public on(event: T, fn: Function): EventID {
		return ''
	};
	public remove(event: T, eventID: EventID): boolean {
		return false;
	};
	public emit(event: T, ...args: any[]) {

	};
}
