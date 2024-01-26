import { cachePath, castSpace } from "../json/loader";
import { MonopolyError } from "./monopoly.error";
import { UUID, DecisionType, Filter, NotificationType, Trade, WaitObject } from "shared-types";
import { Player } from "./player";
import { Property, Space } from "./space";
import { MonopolyEngineCommands, MonopolyInterface } from "./types";

export class Pair {
	dice1: number;
	dice2: number;
	constructor(dice1: number, dice2: number) {
		this.dice1 = dice1;
		this.dice2 = dice2;
	}

	public static roll(): Pair {
		return new Pair(Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1);
	}
}

function createBoard(): Space[] {
	const json_squares = cachePath<{ spaces: Space[] }>("./src/data/spaces.json").spaces;
	const spaces: Space[] = json_squares.map((space) => castSpace(space));
	return spaces;
}

export class Monopoly {
	private UUID: UUID.UUID;
	private players: Player[] = [];
	private spaces: Space[];
	private wait: WaitObject = {
		waiting: false,
		who: '',
	}
	private currentPlayer: number = -1;
	private didCurrentPlayerRoll: boolean = false;

	public constructor(uuid?: UUID.UUID) {
		this.UUID = uuid ?? UUID.generateUUID(15234);
		this.spaces = createBoard();
		this.spaces.forEach((space: Space, index: number) => {
			space.setCommunicationLayer(this.m_BCLFactory(space));
		})
		console.log('[monopoly] created new game with id %s', this.UUID);

	}


	public m_PCLFactory(player: Player): PlayerCommunicationLayer {
		return {
			engine_id: this.UUID,
			alreadyRolled: () => this.didCurrentPlayerRoll,
			rollDice: () => { this.didCurrentPlayerRoll = true; return Pair.roll(); },
			move: (amount: number) => this.movePlayer(player, amount),
			buyProperty: () => this.buyProperty(player),
			sellProperty: () => this.sellProperty(player),
			createTrade: (_player: Player | UUID.UUID, trade: Trade) => this.createTrade(player, _player, trade),
			acceptTrade: (trade: Trade) => this.acceptTrade(player, trade),
			ignore: () => this.stopWaiting()
		}
	}

	public m_BCLFactory(space: Space): BuildingCommunicationLayer {
		return {
			engine_id: this.UUID,
			getPlayer: (uuid: UUID.UUID) => this.getPlayer(uuid),
			move: (player: Player, amount: number) => this.movePlayer(player, amount),
			sendToJail: (player: Player) => this.jailPlayer(player),
			sendToSpace: (player: Player, space: Space | number) => { /*...*/ },
			collect: (player: Player, amount: number) => player.takeMoney(amount),
			award: (player: Player | UUID.UUID, amount: number) => this.givePlayerMoney(player, amount),
			mortgage: (player: Player) => { /*...*/ },
			unmortgage: (player: Player) => { /*...*/ },
		}
	}

	public isWaiting(): boolean {
		return this.wait.waiting;
	}

	public get didRoll(): boolean {
		return this.didCurrentPlayerRoll;
	}

	private waitForPlayer(player: Player): void {
		this.wait.waiting = true;
		this.wait.who = player.UUID;
		console.log('[monopoly] waiting for player %s', player.Name);
	}

	private stopWaiting(): void {
		this.wait.waiting = false;
		this.wait.who = '';
	}

	public addPlayer(player_obj: string | Player, IMonopoly?: MonopolyInterface<PlayerCommunicationLayer>): void {
		let player: Player | null = null;
		if (typeof player_obj === 'string') {
			player = new Player(player_obj, undefined, undefined, IMonopoly);
		} else if (player_obj instanceof Player) {
			player = player_obj;
		}
		if (!player) {
			throw new Error('Invalid player object');
		}

		player.setCommunicationLayer(this.m_PCLFactory(player));
		if (IMonopoly) {
			player.setMonopolyInterface(IMonopoly);
		}

		this.players.push(player);
	}

	public givePlayerMoney(player: Player | UUID.UUID, amount: number) {
		if (player instanceof Player) {
			player.giveMoney(amount);
		} else {
			this.getPlayer(player)?.giveMoney(amount);
		}

	}

	public movePlayer(player: Player, spaces: number, unjail: boolean = false): Space {
		if (player.UUID !== (this.players[this.currentPlayer]?.UUID ?? - 1)) {
			throw new MonopolyError('Not Player\'s turn');
		}
		const current_position: number = player.Position;
		const new_position: number = player.move(spaces);
		if (new_position < current_position) {
			player.giveMoney(200);
			player.notify({ type: NotificationType.INFO, message: 'EARNED', data: 'Collected 200 for passing GO!' })
			console.log('[monopoly] player %s passed go', player.Name);
		}

		if (!unjail && player.Jail) {
			player.JailTurns++;
			if (player.JailTurns === 3) {
				player.Jail = false;
				player.JailTurns = 0;
			}
			this.stopWaiting();
			return this.spaces[new_position];
		} else if (unjail) {
			player.Jail = false;
			player.JailTurns = 0;
		}

		this.stopWaiting();
		console.log('[monopoly] player %s moved to space %d', player.Name, new_position);

		const space: Space = this.spaces[new_position];
		const land_response = space.onLand(player);

		const general_decisions: DecisionType[] = ['ignore', 'trade'];

		if (land_response.engine_should_wait) {
			if (land_response.decision === undefined) {
				land_response.decision = [];
			}
			else if (typeof land_response.decision === 'string') {
				land_response.decision = [land_response.decision];
			}
			const decisions: DecisionType[] = [...land_response.decision, ...general_decisions];
			player.notify({ type: NotificationType.DECISION, message: 'TURN_UPDATE', decision: decisions, data: { position: player.Position, ...space } })
			this.waitForPlayer(player);
		}

		return space;
	}

	public nextTurn(): void {
		if (this.isWaiting()) return;
		this.didCurrentPlayerRoll = false;
		if (this.currentPlayer === -1)
			this.currentPlayer = 0;
		else
			this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
		const player: Player = this.players[this.currentPlayer];

		this.waitForPlayer(player);
		//is player in jail?
		if (player.Jail) {
			player.JailTurns += 1;
			player.notify({ type: NotificationType.DECISION, message: 'JAIL_UPDATE', decision: ['pay', 'roll'] });
			return;
		}
		player.notify({ type: NotificationType.DECISION, message: 'TURN_UPDATE', decision: 'roll' });
	}

	public jailPlayer(player: Player): void {
		const jailSpace: number = this.spaces.findIndex((space) => space.type === 9);
		player.setPosition(jailSpace);
		player.Jail = true;
		player.notify({ type: NotificationType.DECISION, message: 'SENT_TO_JAIL', decision: ['pay', 'roll'], data: 'You are now in Jail!' });
	}

	public getPlayer(uuid: UUID.UUID): Player | undefined {
		return this.players.find(player => player.UUID === uuid);
	}

	public get playersCount(): number {
		return this.players.length;
	}

	public get Players(): Filter<Player, | 'notify' | 'giveMoney' | 'takeMoney' | 'setPosition' | 'setMonopolyInterface' | 'setCommunicationLayer'>[] {
		return this.players;
	}

	public get Spaces(): Filter<Space, 'setCommunicationLayer' | 'onLand' | 'Name' | 'UUID'>[] {
		return this.spaces.map((space) => { return { ...space, setCommunicationLayer: undefined, onLand: undefined } });
	}


	public get CurrentPlayer(): Player {
		return this.players[this.currentPlayer];
	}

	private buyProperty(player: Player): Property | false {
		const position = player.Position;
		const space = this.spaces[position];
		//check if space is  Property
		if (space instanceof Property) {
			const property = space as Property;
			if ((property?.owner ?? '') === '') {
				if (player.Money >= property.price) {
					player.takeMoney(property.price);
					property.setOwner(player.UUID);
					console.log('[monopoly] player %s bought %s for %d', player.Name, property.name, property.price);
					return property;
				} else {
					return false;
				}
			} else {
				throw new MonopolyError('Property already owned');
			}
		} else {
			throw new MonopolyError('Space is not a property');
		}
	}

	private sellProperty(player: Player): boolean {
		//TODO: implement
		return false;
	}

	private createTrade(trader: Player, player: Player | UUID.UUID, trade: Trade): boolean {
		//TODO: implement
		return false;
	}

	private acceptTrade(player: Player, trade: Trade): boolean {
		//TODO: implement
		return false;
	}

}

export class MonopolyEngine {
	private id: UUID.UUID;
	private host_id: UUID.UUID = '';
	private monopoly: Monopoly;
	private gameStarted: boolean = false;
	private engineThread: Promise<void> | undefined;
	private ENGINE_TICK: number = 150;

	public constructor(uuid?: UUID.UUID, master_id?: UUID.UUID) {
		this.host_id = master_id ?? '';
		this.id = uuid ?? UUID.generateUUID(15234);
		this.monopoly = new Monopoly(this.id);
	}

	public get ID(): UUID.UUID {
		return this.id;
	}

	public get HostID(): UUID.UUID {
		return this.host_id;
	}

	public addPlayer(player: Player | string, IMonopoly?: MonopolyInterface<PlayerCommunicationLayer>): void {
		if (this.gameStarted) throw new MonopolyError('Game already started');
		this.monopoly.addPlayer(player, IMonopoly);
	}

	public executeCommand(command: MonopolyEngineCommands): void {
		switch (command) {
			case 'start': {
				this.start();
			}
			default: {
				console.log("[monopolyengine]: unknown command")
				break;
			}
		}
	}

	public start(): void {
		this.gameStarted = true;
		this.engineThread = this.engine();
	}

	public get Monopoly(): Monopoly {
		return this.monopoly;
	}

	public get GameStarted(): boolean {
		return this.gameStarted;
	}

	public get EngineThread(): Promise<void> | undefined {
		return this.engineThread;
	}

	public static async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	private async engine() {
		while (this.gameStarted) {

			this.monopoly.nextTurn();
			await MonopolyEngine.sleep(this.ENGINE_TICK)
		}
	}
}

export interface CommunicationLayer {
	engine_id: UUID.UUID;
}

export interface PlayerCommunicationLayer extends CommunicationLayer {
	rollDice(): Pair;
	alreadyRolled(): boolean;
	move(amount: number, unjail?: boolean): Space;
	buyProperty(): Property | false;
	sellProperty(): boolean;
	createTrade(player: Player | UUID.UUID, trade: Trade): boolean;
	acceptTrade(trade: Trade): boolean;
	ignore(): void;
}

export interface BuildingCommunicationLayer extends CommunicationLayer {
	move(player: Player | UUID.UUID, amount: number): Space;
	getPlayer(player: UUID.UUID): Player | undefined;
	sendToJail(player: Player | UUID.UUID): void;
	sendToSpace(player: Player | UUID.UUID, space: Space): void;
	collect(player: Player | UUID.UUID, amount: number): number;
	award(player: Player | UUID.UUID, amount: number): void;
	mortgage(player: Player | UUID.UUID, property: Property): void;
	unmortgage(player: Player | UUID.UUID, property: Property): void;
}
