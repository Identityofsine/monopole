import { AlertFunction, AlertType } from "@/app/components/alert/Alert";
import { GameID, ICClient, PlayerHoldableSpace } from "@/app/pages/HomePage";
import { send } from "process";
import { Dispatch, SetStateAction } from "react";
import { BaseIntent, BaseResponse, DecisionType, ExpectedMessages, GameResponse, Identifiable, Player, ResponseIntent, UUID, Space, CommandIntent, IsCommand, MonopolyEngineCommands, ErrorResponse } from "shared-types";


//TODO: move to shared-types
export type GlobalUpdateStruct = {
	host: string,
	players: Player[],
	spaces: Space[]
}

export type PlayerConnectionStruct = Player;

export type SpaceUpdateStruct = Space;

class Optional<T> {
	constructor(public value: T | undefined) { }


	public resolve(): T | undefined {
		return this.value;
	}
	public isEmpty(): boolean {
		return this.value === undefined;
	}

}

export interface GameHandler extends ISource {
	isGameUpdate(event: BaseResponse): boolean;
	isMessageObject(event: BaseResponse): boolean;
	handleGameUpdate(event: GameResponse): void;
	handleGameMessage(event: BaseResponse): GameID | void;
	castObject(message: object): Optional<GlobalUpdateStruct>;
}

/**
	* @summary {ISource is an interface that defines the methods that a class must implement to be a source of game updates, this should only be used by the Board Component}
	*/
export interface ISource {
	sendDecision(choice: DecisionType): void;
	getPlayer(uuid: UUID.UUID): Player | undefined;
}

export enum GameUpdateType {
	CONNECTION,
	PLAYER,
	SPACE
}

export type GameState = 'STARTED' | 'WAITING' | 'ENDED' | 'INACTIVE';
export type DispatchWithResult<T, R> = (value: T) => R;

//eventually change to a union type


type ReactUpdate<T> = { getState: DispatchWithResult<void, T>, setState: Dispatch<SetStateAction<T>> }
type GameUpdaterStates = ReactUpdate<PlayerHoldableSpace[]> | ReactUpdate<Player[]> | ReactUpdate<GameState> | ReactUpdate<"">;


interface GameUpdaterCommunicationLayer {
	getSpacesState: ReactUpdate<PlayerHoldableSpace[]>;
	getPlayersState: ReactUpdate<Player[]>;
	getWorldState: ReactUpdate<"">;
	getUUID: () => string;
	getGameUUID: () => string;
	alert: AlertFunction;
	send: (message: BaseIntent) => void;
}

enum GameUpdaterStatesEnum {
	GAMESTATE = 0,
	SPACE = 1,
	PLAYER = 2,
	WORLD = 3,
}

/**
 * GameUpdater
 * @summary {GameUpdater is a class that handles the game update logic by containing the state of the game and subclasses that are responsible for Space, Player, and World events}
 */
export class GameUpdater implements GameHandler {

	private states: GameUpdaterStates[] = [];
	private spaceHandle: SpaceHandle;
	private playerHandle: PlayerHandle;
	private alerter: AlertSystem;

	private constructor(private icclayer: ICClient, gameState: ReactUpdate<GameState>, spaceState: ReactUpdate<PlayerHoldableSpace[]>, playerState?: ReactUpdate<Player[]>, worldState?: ReactUpdate<''>) {
		this.states.push(gameState);
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
		this.alerter = new AlertSystem(this.m_GCLFactory.bind(this)());
	}

	private m_GCLFactory(): GameUpdaterCommunicationLayer {
		return {
			getSpacesState: this.states[GameUpdaterStatesEnum.SPACE] as ReactUpdate<PlayerHoldableSpace[]>,
			getPlayersState: this.states[GameUpdaterStatesEnum.PLAYER] as ReactUpdate<Player[]>,
			getWorldState: this.states[GameUpdaterStatesEnum.WORLD] as ReactUpdate<"">,
			getUUID: () => this.icclayer.getID.bind(this.icclayer)().player_uuid,
			getGameUUID: () => this.icclayer.getID.bind(this.icclayer)().game_uuid,
			alert: (message: string, type: AlertType = "INFO") => { this.icclayer.alert.bind(this.icclayer)(message, type) },
			send: (data: BaseIntent) => { this.icclayer.send.bind(this.icclayer)(data) }
		}
	}

	public static create(icclayer: ICClient, gameState: ReactUpdate<GameState>, spaceState: ReactUpdate<PlayerHoldableSpace[]>, playerState?: ReactUpdate<Player[]>, worldState?: ReactUpdate<''>): GameUpdater {
		return new GameUpdater(icclayer, gameState, spaceState, playerState, worldState);
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

	public getPlayer(uuid: UUID.UUID): Player | undefined {
		return this.playerHandle.getPlayer(uuid);
	}

	public isError(message: BaseResponse): boolean {
		return message.response === 'error';
	}

	public handleGameMessage(message: BaseResponse): GameID | void {

		//check for error
		if (this.isError(message)) {
			this.alerter.throwError(message as ErrorResponse);
		}
		//check messages
		if (message.response === "id") {
			const data = message as BaseResponse;
			if (typeof data.message === 'string') return;

			if (data.message?.message !== "JUST_JOINED") return;

			const ids: GameID = data.message?.object as any;
			if (ids)
				return ids;
		}
		if (this.isGameUpdate(message)) {
			const game_event = message as GameResponse;
			this.handleGameUpdate(game_event);
		}
		if (this.isInfoUpdate(message)) {

		}
	}

	public isInfoUpdate(message: BaseResponse) {
		return message.response === 'message';
	}

	public handleInfoUpdate(message: BaseResponse) {
		if (typeof message.message === 'string') return;
		const info = message.message as { message: string, object: any };
		this.alerter.throwInfo(info.message);
	}

	public handleGameUpdate(event: GameResponse): void {
		if (this.isMessageObject(event)) {
			const message = event.message as { message: ExpectedMessages, object: any };
			if (this.updateSpaces(message.object as GlobalUpdateStruct)) return;
			if (message.message === 'PLAYER_JOINED' || message.message === 'PLAYER_UPDATED') {
				this.spaceHandle.playerChanged(message.object);
				this.playerHandle.updatePlayer(message.object as Player);
			} else if (message.message === "BUILDING_UPDATE") {
				this.spaceHandle.updateSingleSpace(message.object as Space);
			}
			if (event.response === 'error') {
				this.alerter.throwError(event as ErrorResponse);
			}
			if (event.response === 'respond') {
				const decision = this.playerHandle.returnDecisionTree(event);
				//does decision contain 'roll'?
				if (decision.includes('roll')) {
					this.alerter.throwInfo('Your turn!');
				}
				this.icclayer.askPlayer([...decision]);
			}
			if (event.response === 'update') {
				if (event.recipient === 'global') {
					(this.states[GameUpdaterStatesEnum.GAMESTATE] as ReactUpdate<GameState>).setState('STARTED');
					this.alerter.throwInfo('Game has started!');
					return;
				}
			}
			const ids = this.icclayer.getID();
			if (ids.player_uuid === ids.host_uuid && this.states[GameUpdaterStatesEnum.GAMESTATE].getState() === 'WAITING') {
				this.icclayer.askPlayer(['start']);
			}
		} else {
			//some other stuff i guess
		}
	}

	public sendDecision(choice: DecisionType): void {
		this.playerHandle.sendDecision(choice);
		this.icclayer.askPlayer([]);
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
		this.m_gcl?.getSpacesState.setState(spaces);
		return true;
	}

	private m_replaceSpace(uuid: UUID.UUID, space: Space) {
		//replace space but keep players and buildings
		this.m_gcl.getSpacesState.setState((old_space) => {
			const new_space = [...old_space];
			const index = new_space.findIndex((space) => {
				return space.uuid === uuid;
			});
			if (index !== -1) {
				new_space[index] = {
					...space,
					players: new_space[index].players,
					buildings: new_space[index].buildings
				}
			}
			return new_space;
		});
	}

	public updateSingleSpace(message: SpaceUpdateStruct): boolean {
		const space_uuid = message.uuid;
		if (!space_uuid) return false;
		this.m_replaceSpace(space_uuid, message);
		return true;
	}

	public playerChanged(message: PlayerConnectionStruct): boolean {
		if (!message?.position && message?.name && !message?.uuid) return false;
		this.m_gcl.getSpacesState.setState((old_space) => {

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

	private players: Player[] = [];

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

	public returnDecisionTree(message: GameResponse): DecisionType[] {
		if (!message.decision) return [];
		if (typeof message.decision === 'string') return [message.decision];

		return [...message.decision];
	}

	public getPlayer(uuid: UUID.UUID): Player | undefined {

		return this.players.find((player) => {
			return player.uuid === uuid;
		});
	}

	public updatePlayer(object: Player) {
		const new_players = [...this.players];
		const index = new_players.findIndex((player) => {
			return player.uuid === object.uuid;
		});
		if (index !== -1) {
			new_players[index] = object;
		} else {
			new_players.push(object);
		}
		this.m_gcl.getPlayersState.setState(new_players);
		this.players = new_players;
	}

	public addPlayer(object: Player) {
		this.players.push(object);
		this.m_gcl.getPlayersState.setState(this.players);
	}

	public sendDecision(choice: DecisionType): void {
		let intent_block: CommandIntent | ResponseIntent;

		if (choice === 'start') {
			intent_block = {
				intent: 'command',
				command: choice as MonopolyEngineCommands,
				name: '___',
				uuid: this.m_gcl.getUUID(),
				game_uuid: this.m_gcl.getGameUUID()
			}
			this.m_gcl.send(intent_block);
			return;
		}

		intent_block = {
			intent: 'response',
			state: 'turn',
			decision: choice,
			name: '___',
			uuid: this.m_gcl.getUUID(),
			game_uuid: this.m_gcl.getGameUUID()
		}
		this.m_gcl.send(intent_block);
	}

}


class AlertSystem {

	public constructor(private m_gcl: GameUpdaterCommunicationLayer) {
	}

	public throwInfo(message: string) {
		this.m_gcl.alert(message, "INFO");
	}

	public throwWarning(message: ErrorResponse) {
		this.m_gcl.alert(message.message, "WARNING");
	}

	public throwError(message: ErrorResponse) {
		console.log(message);
		this.m_gcl.alert(message.message, "ERROR");
	}
}
