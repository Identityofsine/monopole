import { BaseResponse } from "shared-types";
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
	data: BaseResponse;
};

export abstract class Events<T extends string> {
	protected events: Map<T, Map<EventID, Function>> = new Map();

	private checkIfMapExists(event: T): boolean {
		if (!this.events.has(event)) {
			this.events.set(event, new Map());
			return false;
		}
		return true;
	}

	public on(event: T, fn: Function): EventID {
		if (!this.checkIfMapExists(event)) {
			console.warn("Events :: on :: \"%s\" not found", event);
			this.events.set(event, new Map());
		}
		const eventID = Math.random().toString(36).substr(2, 9);
		this.events.get(event)?.set(eventID, fn);
		return eventID;
	};

	public remove(event: T, eventID: EventID): boolean {
		return false;
	};

	public emit(event: T, ...args: any[]) {
		if (!this.checkIfMapExists(event)) {
			console.warn("Events :: emit :: \"%s\" not found", event);
			return;
		}
		this.events.get(event)?.forEach((fn: Function) => {
			fn(...args);
		});
	};
}
