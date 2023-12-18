import { UUID } from "./identifiable";
import { MonopolyError } from "./monopoly.error";
import { MonopolyInterface, NotificationType, Trade, WaitObject } from "./monopoly.types";
import { Player } from "./player";
import { Space } from "./space";

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

export class Monopoly {
	private players: Player[] = [];
	private spaces: Space[] = [];
	private wait: WaitObject = {
		waiting: false,
		who: '',
	}
	private currentPlayer: number = -1;


	private m_PCLFactory(player: Player): PlayerCommunicationLayer {
		return {
			rollDice: () => Pair.roll(),
			move: (amount: number) => this.movePlayer(player, amount),
			buyProperty: () => this.buyProperty(player),
			sellProperty: () => this.sellProperty(player),
			createTrade: (_player: Player | UUID.UUID, trade: Trade) => this.createTrade(player, _player, trade),
			acceptTrade: (trade: Trade) => this.acceptTrade(player, trade)
		}
	}

	private isWaiting(): boolean {
		return this.wait.waiting;
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

	public addPlayer(player_obj: string | Player, IMonopoly?: MonopolyInterface): void {
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

	public movePlayer(player: Player, spaces: number): Space {
		if (player.UUID !== (this.players[this.currentPlayer]?.UUID ?? - 1)) {
			throw new MonopolyError('Not Player\'s turn');
		}
		const new_position: number = player.move(spaces);
		this.stopWaiting();
		console.log('[monopoly] player %s moved to space %d', player.Name, new_position);

		//const space: Space = this.spaces[new_position];
		player.notify({ type: NotificationType.DECISION, message: 'You are on space ' + new_position, decision: ['buy', 'ignore'] })

		return {} as Space;
	}

	public nextTurn(): void {
		if (this.isWaiting()) return;
		if (this.currentPlayer === -1)
			this.currentPlayer = 0;
		else
			this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
		const player: Player = this.players[this.currentPlayer];

		this.waitForPlayer(player);
		player.notify({ type: NotificationType.DECISION, message: 'It is your turn', decision: 'roll' });
	}


	public get CurrentPlayer(): Player {
		return this.players[this.currentPlayer];
	}

	private buyProperty(player: Player): boolean {
		//TODO: implement
		return false;
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
	private monopoly: Monopoly = new Monopoly();
	private gameStarted: boolean = false;
	private engineThread: Promise<void> | undefined;
	private ENGINE_TICK: number = 150;

	public addPlayer(player: Player | string, IMonopoly?: MonopolyInterface): void {
		this.monopoly.addPlayer(player, IMonopoly);
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

export interface PlayerCommunicationLayer {
	rollDice(): Pair;
	move(amount: number): Space;
	buyProperty(): boolean;
	sellProperty(): boolean;
	createTrade(player: Player | UUID.UUID, trade: Trade): boolean;
	acceptTrade(trade: Trade): boolean;
}
