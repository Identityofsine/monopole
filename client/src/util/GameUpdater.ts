import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import { Dispatch, SetStateAction } from "react";
import { BaseResponse, ExpectedMessages, GameResponse, Identifiable, Player, Space } from "shared-types";


//TODO: move to shared-types
export type GlobalUpdateStruct = {
	host: string,
	players: Player[],
	spaces: Space[]
}

export type PlayerConnectionStruct = Player;

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

export enum GameUpdateType {
	CONNECTION,
	PLAYER,
	SPACE
}

type ReactUpdate = Dispatch<SetStateAction<PlayerHoldableSpace[]>>

export class SpaceHandle implements GameHandler {

	private constructor(private setState: ReactUpdate) { }

	public static create(setState: ReactUpdate): GameHandler {
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


	public updateSpaces(message: GlobalUpdateStruct): boolean {
		if (!message.spaces) return false;
		if (!message.players) return false;
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
		return true;
	}


	private playerChanged(message: PlayerConnectionStruct): boolean {
		if (!message?.position && message?.name && !message?.uuid) return false;
		this.setState((old_space) => {

			const new_space = [...old_space];
			//clear old player
			const old_space_players_index = new_space.findIndex((space) => {
				return space.players.find((player) => {
					return player.uuid === message.uuid;
				}) !== undefined;
			})

			if (old_space_players_index !== -1) {
				const old_space_players = new_space[old_space_players_index].players;
				const new_players = old_space_players.filter((player) => {
					return player.uuid !== message.uuid;
				});
				new_space[old_space_players_index].players = new_players;
			}

			const cur_space = new_space[message.position];
			if (cur_space) {
				cur_space.players.push(message);
			}
			return new_space;
		});

		return true;
	}

	public handleGameUpdate(event: GameResponse): void {
		if (this.isMessageObject(event)) {
			const message = event.message as { message: ExpectedMessages, object: any };
			if (this.updateSpaces(message.object)) return;
			if (message.message === 'PLAYER_JOINED' || message.message === 'PLAYER_UPDATED') {
				this.playerChanged(message.object);
			}
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
