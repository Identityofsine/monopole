import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import { BaseResponse, GameResponse, Identifiable, Player, Space } from "shared-types";


//TODO: move to shared-types
export type GlobalUpdateStruct = {
	host: string,
	players: Player[],
	spaces: Space[]
}

class Optional<T> {
	constructor(public value: T | undefined) { }


	public resolve(): T | undefined {
		return this.value;
	}
	public isEmpty(): boolean {
		return this.value === undefined;
	}

}

export interface GameHandler {
	isGameUpdate(event: BaseResponse): boolean;
	isMessageObject(event: BaseResponse): boolean;
	updatePlayers(message: GlobalUpdateStruct): void;
	updateSpaces(message: GlobalUpdateStruct): void;
	handleGameUpdate(event: GameResponse): void;
	castObject(message: object): Optional<GlobalUpdateStruct>;
}

export class SpaceHandle implements GameHandler {

	private constructor(private setState: (state: PlayerHoldableSpace[]) => void) { }

	public static create(setState: (state: PlayerHoldableSpace[]) => void): GameHandler {
		return new SpaceHandle(setState);
	}

	public isGameUpdate(event: BaseResponse): boolean {
		const mutated = event as GameResponse;
		return mutated.recipient !== undefined;
	}

	public isMessageObject(event: BaseResponse): boolean {
		return typeof event.message !== 'string';
	}

	public updatePlayers(message: GlobalUpdateStruct): void {
		//TODO: implement
	}


	public updateSpaces(message: GlobalUpdateStruct): void {
		if (!message.spaces) return;
		if (!message.players) return;
		let spaces: PlayerHoldableSpace[] = message.spaces.map((space: Space) => {
			return {
				...space,
				players: []
			}
		});
		for (const player of message.players) {
			const space = spaces[player.position];
			if (space) {
				space.players.push(player);
			}
		}
		this.setState(spaces);
	}

	public handleGameUpdate(event: GameResponse): void {
		if (this.isMessageObject(event)) {
			const message = event.message as { message: string, object: any };
			this.updateSpaces(message.object);
		} else {
			//some other stuff i guess
		}
	}

	public castObject(message: object): Optional<GlobalUpdateStruct> {
		const casted = message as GlobalUpdateStruct;
		if (casted?.host && casted?.players && casted?.spaces) {
			return new Optional(casted);
		}
		return new Optional<GlobalUpdateStruct>(undefined);
	}


}



/**
//move to util
function isGameUpdate(event: BaseResponse) {
	const mutated = event as GameResponse;
	return mutated.recipient !== undefined;
}

function isMessageObject(event: BaseResponse) {
	return typeof event.message !== 'string';
}

function updatePlayers(message: { host: string, players: Identifiable[], spaces: Identifiable[] }) {
	//TODO: clean up
}

function updateSpaces(message: { host: string, players: Identifiable[], spaces: Identifiable[] }) {
	if (!message.spaces) return;
	setSpaces(message.spaces);
}

function handleGameUpdate(event: GameResponse) {
	if (isMessageObject(event)) {
		const message = event.message as { message: string, object: any };
		updateSpaces(message.object);
	} else {
		//some other stuff i guess
	}
}
*/