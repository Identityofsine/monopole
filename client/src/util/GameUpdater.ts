import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import { Connection, ConnectionInterface } from "@/obj/connection";
import { Dispatch, SetStateAction } from "react";
import { BaseIntent, BaseResponse, ExpectedMessages, GameResponse, Identifiable, Player, ResponseIntent, Space } from "shared-types";


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
	handleGameUpdate(event: GameResponse): void;
	castObject(message: object): Optional<GlobalUpdateStruct>;
	roll(): void;
}

export enum GameUpdateType {
	CONNECTION,
	PLAYER,
	SPACE
}

type ReactUpdate<T> = Dispatch<SetStateAction<T>>
type GameUpdaterStates = ReactUpdate<PlayerHoldableSpace[]> | ReactUpdate<Player> | ReactUpdate<"">;


interface GameUpdaterCommunicationLayer {
	getSpacesState: ReactUpdate<PlayerHoldableSpace[]>;
	getPlayersState: ReactUpdate<Player>;
	getWorldState: ReactUpdate<"">;
	getUUID: () => string;
	getGameUUID: () => string;
	send: (message: BaseIntent) => void;
}

enum GameUpdaterStatesEnum {
	SPACE = 0,
	PLAYER = 1,
	WORLD = 2,
}

/**
 * GameUpdater
 * @summary {GameUpdater is a class that handles the game update logic by containing the state of the game and subclasses that are responsible for Space, Player, and World events}
 */
export class GameUpdater implements GameHandler {

	private states: GameUpdaterStates[] = [];
	private spaceHandle: SpaceHandle;
	private playerHandle: PlayerHandle;

	private constructor(private connection: ConnectionInterface, spaceState: ReactUpdate<PlayerHoldableSpace[]>, playerState?: ReactUpdate<Player>, worldState?: ReactUpdate<''>) {
		this.states.push(spaceState);
		if (playerState) {
			this.states.push(playerState);
		}
		if (worldState) {
			this.states.push(worldState);
		}
		//this must execute after the states are set
		this.spaceHandle = new SpaceHandle(this.m_GCLFactory.bind(this)());
		this.playerHandle = new PlayerHandle(this.m_GCLFactory.bind(this)());
	}

	private m_GCLFactory(): GameUpdaterCommunicationLayer {
		return {
			getSpacesState: this.states[GameUpdaterStatesEnum.SPACE] as ReactUpdate<PlayerHoldableSpace[]>,
			getPlayersState: this.states[GameUpdaterStatesEnum.PLAYER] as ReactUpdate<Player>,
			getWorldState: this.states[GameUpdaterStatesEnum.WORLD] as ReactUpdate<"">,
			getUUID: () => this.connection.getUUID.bind(this.connection)(),
			getGameUUID: () => this.connection.getGameUUID.bind(this.connection)(),
			send: (data: BaseIntent) => { this.connection.send.bind(this.connection)(data) }
		}
	}

	public static create(connection: ConnectionInterface, spaceState: ReactUpdate<PlayerHoldableSpace[]>, playerState?: ReactUpdate<Player>, worldState?: ReactUpdate<''>): GameUpdater {
		return new GameUpdater(connection, spaceState, playerState, worldState);
	}

	public isGameUpdate(event: BaseResponse): boolean {
		const mutated = event as GameResponse;
		return mutated.recipient !== undefined;
	}

	public isMessageObject(event: BaseResponse): boolean {
		return typeof event.message !== 'string';
	}

	public updateSpaces(message: GlobalUpdateStruct): boolean {
		return this.spaceHandle.updateSpaces(message);
	}

	public handleGameUpdate(event: GameResponse): void {
		if (this.isMessageObject(event)) {
			const message = event.message as { message: ExpectedMessages, object: any };
			if (this.updateSpaces(message.object as GlobalUpdateStruct)) return;
			if (message.message === 'PLAYER_JOINED' || message.message === 'PLAYER_UPDATED') {
				this.spaceHandle.playerChanged(message.object);
			}
		} else {
			//some other stuff i guess
		}
	}

	public roll(): void {
		this.playerHandle.roll();
	}

	public castObject(message: object): Optional<GlobalUpdateStruct> {
		const casted = message as GlobalUpdateStruct;
		if (casted?.host && casted?.players && casted?.spaces) {
			return new Optional(casted);
		}
		return new Optional<GlobalUpdateStruct>(undefined);
	}
}

export class SpaceHandle {

	public constructor(private m_gcl: GameUpdaterCommunicationLayer) { }

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
		this.m_gcl?.getSpacesState(spaces);
		return true;
	}


	public playerChanged(message: PlayerConnectionStruct): boolean {
		if (!message?.position && message?.name && !message?.uuid) return false;
		this.m_gcl.getSpacesState((old_space) => {

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

}

export class PlayerHandle {

	public constructor(private m_gcl: GameUpdaterCommunicationLayer) { }

	public roll() {
		const intent_block: ResponseIntent = {
			intent: 'response',
			state: 'turn',
			decision: 'roll',
			name: 'roll',
			uuid: this.m_gcl.getUUID(),
			game_uuid: this.m_gcl.getGameUUID()
		}
		this.m_gcl.send(intent_block);
	}

}

