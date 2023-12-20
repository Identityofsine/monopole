import { UUID } from "../monopoly/identifiable";
import { MonopolyEngine, PlayerCommunicationLayer } from "../monopoly/monopoly";
import { MonopolyError } from "../monopoly/monopoly.error";
import { DecisionType, Filter, MonopolyInterface, NotificationEvent } from "../monopoly/monopoly.types";
import { Player } from "../monopoly/player";
import ServerInstance from "./websocket";
import * as WebSocket from 'ws';
import { BaseIntent, BaseResponse, ConnectionIntent, GameResponse, ResponseIntent } from "./ws.intent";
import { Space } from "../monopoly/space";

interface MonopolyGame {
	engine: MonopolyEngine;
	clients: Map<UUID.UUID, WebSocket>;
}


namespace MessageFactory {
	export function createMessage(message: string): BaseResponse {
		return {
			success: true,
			response: 'message',
			message: message,
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
	export function createConnect(message: string): BaseResponse {
		return {
			success: true,
			response: 'connect',
			message: message,
		}
	}
}


export class MonopolyServer implements MonopolyInterface {

	private instance = ServerInstance.getInstance();
	private games = new Map<UUID.UUID, MonopolyGame>();

	public constructor() {
		console.log('[monopolyserver] created');
		this.m_setup();
	}

	private m_connectionStage(ws: WebSocket, data: ConnectionIntent): void {
		const player_uuid = UUID.generateUUID(15234);
		if (data.intent === 'create') {
			const uuid = this.createGame();
			const game = this.getGame(uuid);
			if (game) {
				const player = new Player(data.name, player_uuid, undefined, this);
				this.addPlayer(player, ws, game);
				this.m_sendGameInformation(uuid, ws);
			}
		} else if (data.intent === 'join') {
			if (!data.game_uuid) throw new MonopolyError('No game uuid provided');
			const game = this.getGame(data.game_uuid);
			if (game) {
				const player = new Player(data.name, player_uuid, undefined, this);
				this.addPlayer(player, ws, game);
				this.m_sendGameInformation(data.game_uuid, ws);
			}
		}
	}

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
			if (action === 'roll') {
				const dice = communicationlayer.rollDice();
				ws.send(JSON.stringify(MessageFactory.createMessage('You rolled ' + (dice.dice1 + dice.dice2))));
				communicationlayer.move(dice.dice1 + dice.dice2);
			} else if (action == 'ignore') {
				communicationlayer.ignore();
			} else if (action == 'buy') {
				if (communicationlayer.buyProperty()) {
					ws.send(JSON.stringify(MessageFactory.createMessage('You bought property')));
				} else {
					ws.send(JSON.stringify(MessageFactory.createMessage('Unable to buy property')));
				}
				communicationlayer.ignore();
			}
			this.m_sendUpdate(engine, player);

			console.log('[monopolyserver] received response: ', data);
		}
		catch (e) {
			console.log("[monopolyserver] error with response:", data)
			console.log("Error: " + e);

		}
	}

	private m_sendUpdate(game: MonopolyGame, player: Player) {
		const filtered_player: Filter<Player, | 'notify' | 'giveMoney' | 'takeMoney' | 'setPosition' | 'setMonopolyInterface' | 'setCommunicationLayer'> = player;
		const update: GameResponse = {
			response: 'update',
			recipient: 'game',
			message: { message: 'Player ' + filtered_player.Name + ' has updated', object: filtered_player },
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
			const data = ServerInstance.safeParse(event.data) as BaseIntent;
			if (data.intent === 'create' || data.intent === 'join') {
				this.m_connectionStage(event.ws, data as ConnectionIntent);
			}
			else if (data.intent === 'response') {
				this.m_responseStage(data as ResponseIntent, event.ws);
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
				message: 'STATUS_UPDATE', object: { players: players, spaces: spaces },
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

		const add_player_message: BaseResponse = {
			response: 'message',
			message: 'Player added ' + player.Name + ' to game ' + game.engine.ID,
			success: true,
		}
		//this.broadcast(game, add_player_message);

		const id_message: BaseResponse = {
			response: 'id',
			message: { player_uuid: player.UUID, game_uuid: game.engine.ID },
			success: true,
		}
		ws.send(JSON.stringify(id_message));
	}

	private createGame(): UUID.UUID {
		const uuid = UUID.generateUUID(15234);
		console.log('[monopolyserver] created game %s', uuid);
		const game: MonopolyGame = {
			engine: new MonopolyEngine(uuid),
			clients: new Map(),
		}
		this.games.set(uuid, game);
		return uuid;
	}

	private getGame(uuid: UUID.UUID): MonopolyGame | undefined {
		return this.games.get(uuid);
	}

	public onNotification(player: Player, communicationlayer: PlayerCommunicationLayer, notification: NotificationEvent): void {
		const engine = this.getGame(communicationlayer.engine_id);
		if (!engine) throw new MonopolyError('No engine found');
		const socket = engine.clients.get(player.UUID);
		if (!socket) throw new MonopolyError('No socket found');

		const message: GameResponse = {
			response: 'respond',
			recipient: 'player',
			decision: notification.decision,
			message: { message: notification.message, object: notification.data },
			success: true,
		}
		socket.send(JSON.stringify(message));
	}

	public onPlayerAdded(player: Player, engine_id: UUID.UUID): void {

	}
}
