import { MonopolyEngine, PlayerCommunicationLayer } from "../monopoly/monopoly";
import { MonopolyError } from "../monopoly/monopoly.error";
import { DecisionType, UUID, Filter, NotificationEvent, ExpectedInput, ExpectedMessages, ExpectedAlertMessages, NotificationType, ExpectedTradeInput, ExpectedTradeResponseInput, Responses, ExpectedBuildInput } from "shared-types";
import { Player } from "../monopoly/player";
import ServerInstance from "./websocket";
import * as WebSocket from 'ws';
import { BaseIntent, BaseResponse, CommandIntent, ConnectionIntent, ErrorResponse, GameResponse, ResponseIntent } from "shared-types";
import { MonopolyInterface } from "../monopoly/types";
import { Property } from "../monopoly/space";

interface MonopolyGame {
	engine: MonopolyEngine;
	clients: Map<UUID.UUID, WebSocket>;
}


namespace MessageFactory {
	export function createMessage(message: string, type: ExpectedAlertMessages = 'GENERAL_MESSAGE'): BaseResponse {
		return {
			success: true,
			response: 'info',
			message: { message: type, object: message },
		}
	}
	export function createRespond(message: string, decision: DecisionType | DecisionType[]): GameResponse {
		return {
			success: true,
			response: 'respond',
			recipient: 'player',
			message: message,
			decision: decision,
		}
	}
	export function createUpdate(message: BaseResponse['message']): GameResponse {
		return {
			success: true,
			response: 'update',
			recipient: 'global',
			message: message,
		}
	}
	export function createConnect(message: string): BaseResponse {
		return {
			success: true,
			response: 'connect',
			message: message,
		}
	}
}


export class MonopolyServer implements MonopolyInterface<PlayerCommunicationLayer> {

	private instance = ServerInstance.getInstance();
	private games = new Map<UUID.UUID, MonopolyGame>();

	public constructor() {
		console.log('[monopolyserver] created');
		this.m_setup();
	}

	private m_doesDecisionNeedInput(decision: DecisionType): boolean {
		return decision === 'buy' || decision === 'pay' || decision === 'roll' || decision === 'trade' || decision === 'build';
	}

	private m_isProperEInput(value: ExpectedInput): boolean {
		return (value.data !== undefined && value.decision !== undefined);
	}

	private m_sendError(ws: WebSocket, message: string, disconnect: boolean = false): void {
		const error: ErrorResponse = {
			success: false,
			response: 'error',
			message: message
		};
		ws.send(JSON.stringify(error));
		if (disconnect) {
			ws.close();
		}
		console.log('[monopolyserver] sent error: %s', message, disconnect ? 'and disconnected' : '');
	}

	private m_connectionStage(ws: WebSocket, data: ConnectionIntent): void {
		const player_uuid = UUID.generateUUID(15234);
		if (data.intent === 'create') {
			const uuid = this.createGame(player_uuid);
			const game = this.getGame(uuid);
			if (game) {
				const player = new Player(data.name, player_uuid, undefined, this);
				this.addPlayer(player, ws, game);
				this.m_sendGameInformation(uuid, ws);
			}
		} else if (data.intent === 'join') {
			if (!data.game_uuid) {
				this.m_sendError(ws, 'No UUID Provided', true);
				return;
			}
			const game = this.getGame(data.game_uuid);
			if (game) {
				const player = new Player(data.name, player_uuid, undefined, this);
				this.addPlayer(player, ws, game);
				this.m_sendGameInformation(data.game_uuid, ws);
			} else {
				this.m_sendError(ws, 'Game not found', true);
			}
		}
	}

	private m_handleRolls(data: ResponseIntent, ws: WebSocket, communicationlayer: PlayerCommunicationLayer) {
		const state = data.state;
		const dice = communicationlayer.rollDice();
		ws.send(JSON.stringify(MessageFactory.createMessage('You rolled ' + (dice.dice1 + dice.dice2))));

		if (state === 'turn') {
			communicationlayer.move(dice.dice1 + dice.dice2);
		} else if (state === 'jail') {
			const space = communicationlayer.move(dice.dice1 + dice.dice2, dice.dice1 === dice.dice2);
			if (space.type === 9) {
				ws.send(JSON.stringify(MessageFactory.createMessage('You are still in jail')));
			}
		} else if (state === 'paying') {
			/*
			* TODO: implement utility paying 
			* ... 
			* 
			* */
		}

	}

	private m_isPlayerInTurn(game: MonopolyGame, player: UUID.UUID): boolean {
		const engine = game.engine;
		const current_player = engine.Monopoly.CurrentPlayer;
		console.log("[monopolyserver] current player: ", current_player.UUID, "player: ", player);
		return current_player.UUID === player;
	}

	private m_handleTradeResponse(data: ResponseIntent, ws: WebSocket, game: MonopolyGame) {

		const data_block: ExpectedTradeResponseInput = data.data as ExpectedTradeResponseInput;
		if (!data_block) {
			this.m_sendError(ws, 'Invalid Trade Response', false);
			return;
		}
		if (data.decision !== 'trade_decline' && data.decision !== 'trade_accept') {
			this.m_sendError(ws, 'Invalid Decision (?)', false);
			return;
		}
		let accepted = data.decision === 'trade_accept';
		let trade_id = data_block.data.trade_id;
		const engine = game.engine;
		const trade_obj = engine.Monopoly.Trader.getTrade(trade_id);
		if (!trade_obj) {
			this.m_sendError(ws, 'Trade not found', false);
			return;
		}
		if (accepted) {
			engine.Monopoly.Trader.completeTrade(trade_id, (property: Property) => { this.m_sendBuildingUpdate.bind(this, game)(property) });
		} else {
			engine.Monopoly.Trader.cancelTrade(trade_id);
		}
	}

	// this function handles the response from the player
	private m_responseStage(data: ResponseIntent, ws: WebSocket): void {
		try {
			if (!data.game_uuid) throw new MonopolyError('No game uuid provided');
			if (!data.uuid) throw new MonopolyError('No player uuid provided');
			const engine = this.getGame(data.game_uuid);
			if (!engine) throw new MonopolyError('No engine found');
			const player = engine.engine.Monopoly.getPlayer(data.uuid);
			if (!player) throw new MonopolyError('No player found');
			const communicationlayer = engine.engine.Monopoly.m_PCLFactory(player);

			const action = data.decision;
			switch (action) {
				case 'roll': {
					// why is this here? : Because trade_accept and trade_decline are also responses that don't require the player to be in turn
					if (!this.m_isPlayerInTurn(engine, data?.uuid ?? '')) {
						this.m_sendError(ws, 'Not your turn', false);
						return;
					}
					if (engine.engine.Monopoly.didRoll) {
						this.m_sendError(ws, 'You are waiting for a decision, please wait', false);
						return;
					}
					this.m_handleRolls(data, ws, communicationlayer);
					break;
				}
				case 'trade': {
					if (!this.m_isPlayerInTurn(engine, data?.uuid ?? '')) {
						this.m_sendError(ws, 'Not your turn', false);
						return;
					}
					const trade_data = data?.data as ExpectedTradeInput;
					if (!trade_data) {
						this.m_sendError(ws, 'Invalid Trade Request', false);
						break;
					}
					communicationlayer.createTrade(trade_data.data.dest, trade_data.data);
					break;
				}
				case 'trade_decline':
				case 'trade_accept': {
					// implement a check here that makes sure the player is in the trade. -- trade object?
					this.m_handleTradeResponse(data, ws, engine);
					break;
				}
				case 'build': {
					if (!this.m_isPlayerInTurn(engine, data?.uuid ?? '')) {
						this.m_sendError(ws, 'Not your turn', false);
						return;
					}
					console.log('[monopolyserver] building');
					const building_data = data?.data as ExpectedBuildInput;
					if (building_data.data) {
						const request = building_data.data;
						for (let i = 0; i < request.houses; i++) {
							const response = communicationlayer.buildHouse(request.property);
							if (response) {
								console.log('[monopolyserver] built house');
							} else {
								console.log('[monopolyserver] could not build house');
							}
						}
					} else {
						this.m_sendError(ws, 'Invalid build request', false);
						console.log('[monopolyserver] invalid build request: ', building_data);
					}
					break;
				}
				case 'buy': {
					let space = communicationlayer.buyProperty();
					if (space) {
						ws.send(JSON.stringify(MessageFactory.createMessage('You bought property', 'BUILDING_BOUGHT')));
						this.m_sendBuildingUpdate(engine, space);
					} else {
						this.m_sendError(ws, 'You cannot buy this property', false);
					}
				}
				case 'ignore': {
				}
				default: {
					communicationlayer.ignore();
					break;
				}
			}

			this.m_sendPlayerUpdate(engine, player);
			console.log('[monopolyserver] received response: ', data);
		}
		catch (e) {
			console.log("[monopolyserver] error with response:", data)
			console.log("Error: " + e);
		}
	}

	private m_handleHostCommand(data: CommandIntent) {
		const command = data?.command ?? '';
		const game = this.getGame(data.game_uuid);
		if (!game) throw new MonopolyError('No game found');
		const player_id = data.uuid;
		if (!player_id) throw new MonopolyError('No player uuid provided');
		if (game.engine.HostID !== player_id) throw new MonopolyError('Player is not host');
		if (command === 'start') {
			game.engine.start();
			this.broadcast(game, MessageFactory.createMessage('Game has started', 'GENERAL_MESSAGE'));
		}
	}


	//send updates to all players: This particular function sends updates to all players when something about a player changes.
	private m_sendPlayerUpdate(game: MonopolyGame, player: Player) {
		const filtered_player: Filter<Player, | 'notify' | 'giveMoney' | 'takeMoney' | 'setPosition' | 'setMonopolyInterface' | 'setCommunicationLayer'> = player;
		const update: GameResponse = {
			response: 'update',
			recipient: 'game',
			message: { message: 'PLAYER_UPDATED', object: filtered_player },
			success: true,
		}
		this.broadcast(game, update);
	}

	//send updates to all players: This particular function sends updates to all players when something about a property changes.
	private m_sendBuildingUpdate(game: MonopolyGame, space: Property) {
		console.log('[monopolyserver] sending building update, space: %s', space);
		const update: GameResponse = {
			response: 'update',
			recipient: 'game',
			message: { message: 'BUILDING_UPDATE', object: space },
			success: true,
		}

		this.broadcast(game, update);
	}

	private m_setup(): void {
		this.instance.on('connection', (event) => {
			console.log('[monopolyserver] new connection');
			event.ws.send(JSON.stringify(MessageFactory.createConnect('Connected to server')));
		});
		this.instance.on('message', (event) => {
			try {
				const data = ServerInstance.safeParse(event.data) as BaseIntent;
				if (data.intent === 'create' || data.intent === 'join') {
					this.m_connectionStage(event.ws, data as ConnectionIntent);
				}
				else if (data.intent === 'response') {
					this.m_responseStage(data as ResponseIntent, event.ws);
				} else if (data.intent === 'command') {
					this.m_handleHostCommand(data as CommandIntent);
				}
			} catch (e) {
				console.log('[monopolyserver] error: ', e);
			}
		});
	}

	private m_sendGameInformation(game_id: UUID.UUID, player_socket: WebSocket): void {
		const game = this.getGame(game_id);
		if (!game) throw new MonopolyError('No game found')

		//literally send everything, current state of the board and all players
		const players = game.engine.Monopoly.Players;
		const spaces = game.engine.Monopoly.Spaces;

		const player_message: GameResponse = {
			response: 'update',
			recipient: 'player',
			success: true,
			message: {
				message: 'STATUS_UPDATE', object: { host: game.engine.HostID, players: players, spaces: spaces },
			}
		}

		player_socket.send(JSON.stringify(player_message));

	}

	private broadcast(game: MonopolyGame, message: BaseResponse): void {
		game.clients.forEach((ws, _uuid) => {
			ws.send(JSON.stringify(message));
		})
	}

	private addPlayer(player: Player, ws: WebSocket, game: MonopolyGame): void {
		game.engine.addPlayer(player, this);
		game.clients.set(player.UUID, ws as WebSocket);
		this.onPlayerAdded(player, game.engine.ID);

		const id_message: BaseResponse = {
			response: 'id',
			message: { message: 'JUST_JOINED', object: { player_uuid: player.UUID, game_uuid: game.engine.ID, host_id: game.engine.HostID } },
			success: true,
		}
		ws.send(JSON.stringify(id_message));
	}

	private createGame(player_uuid?: UUID.UUID): UUID.UUID {
		const uuid = UUID.generateUUID(15234);
		console.log('[monopolyserver] created game %s', uuid);
		const game: MonopolyGame = {
			engine: new MonopolyEngine(uuid, player_uuid, this),
			clients: new Map(),
		}
		this.games.set(uuid, game);
		return uuid;
	}

	private getGame(uuid: UUID.UUID): MonopolyGame | undefined {
		return this.games.get(uuid);
	}

	public onTurnStart(player: Player, engine_id: UUID.UUID): void {
		const game = this.getGame(engine_id);
		if (!game) throw new MonopolyError('No game found');
		this.broadcast(game, MessageFactory.createUpdate({ message: 'TURN_UPDATE', object: player }));
	}

	public onNotification(player: Player, communicationlayer: PlayerCommunicationLayer, notification: NotificationEvent): void {
		const engine = this.getGame(communicationlayer.engine_id);
		if (!engine) throw new MonopolyError('No engine found');
		const socket = engine.clients.get(player.UUID);
		if (!socket) throw new MonopolyError('No socket found');

		let response_type: Responses = 'info';
		switch (notification.type) {
			case NotificationType.DECISION: {
				response_type = 'respond';
				break;
			}
			case NotificationType.FORMAL: {
				response_type = 'formal';
				break;
			}
			case NotificationType.INFO: {
				response_type = 'info';
				break;
			}
		};


		const message: GameResponse = {
			response: response_type,
			recipient: 'player',
			decision: notification.decision,
			message: { message: notification.message, object: notification?.data ?? {} },
			success: true,
		}
		console.log('[monopolyserver] sending notification to player: %s', player.UUID, message);
		socket.send(JSON.stringify(message));
	}

	public onBuildingUpdate(space: Property, engine_id: UUID.UUID): void {
		const game = this.getGame(engine_id);
		if (!game) throw new MonopolyError('No game found');
		this.m_sendBuildingUpdate(game, space);
	}

	public onPlayerAdded(player: Player, engine_id: UUID.UUID): void {
		const engine = this.getGame(engine_id);
		if (!engine) throw new MonopolyError('No engine found');
		const message: GameResponse = {
			response: 'update',
			recipient: 'game',
			message: { message: 'PLAYER_JOINED', object: player },
			success: true,
		}
		this.broadcast(engine, message);
	}
}
