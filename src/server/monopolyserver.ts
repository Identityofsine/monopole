import { UUID } from "../monopoly/identifiable";
import { MonopolyEngine, PlayerCommunicationLayer } from "../monopoly/monopoly";
import { MonopolyError } from "../monopoly/monopoly.error";
import { MonopolyInterface, NotificationEvent } from "../monopoly/monopoly.types";
import { Player } from "../monopoly/player";
import ServerInstance from "./websocket";
import * as WebSocket from 'ws';
import { BaseIntent, BaseResponse, ConnectionIntent } from "./ws.intent";

interface MonopolyGame {
	engine: MonopolyEngine;
	clients: Map<UUID.UUID, WebSocket>;
}


export class MonopolyServer implements MonopolyInterface {

	private instance = ServerInstance.getInstance();
	private games = new Map<UUID.UUID, MonopolyGame>();

	public constructor() {
		console.log('[monopolyserver] created');
		this.m_setup();
	}

	private m_setup(): void {
		this.instance.on('connection', (event) => {
			console.log('[monopolyserver] new connection');
			const message: BaseResponse = {
				response: 'connect',
				message: 'Pick your fate.',
				success: true,
			}
			event.ws.send(JSON.stringify(message));
		});
		this.instance.on('message', (event) => {
			const data = ServerInstance.safeParse(event.data) as BaseIntent;

			const player_uuid = UUID.generateUUID(15234);
			if (data.intent === 'create') {
				const uuid = this.createGame();
				const game = this.getGame(uuid);
				if (game) {
					const player = new Player(data.name, player_uuid, undefined, this);
					this.addPlayer(player, event.ws, game);
				}
			} else {
				if (!data.game_uuid) throw new MonopolyError('No game uuid provided');
				const game = this.getGame(data.game_uuid);
				if (game) {
					const player = new Player(data.name, player_uuid, undefined, this);
					this.addPlayer(player, event.ws, game);
				}
			}

		});
	}

	private addPlayer(player: Player, ws: WebSocket, game: MonopolyGame): void {
		game.engine.addPlayer(player, this);
		game.clients.set(player.UUID, ws as WebSocket);

		const add_player_message: BaseResponse = {
			response: 'message',
			message: 'Player added ' + player.Name + ' to game ' + game.engine.ID,
			success: true,
		}
		game.clients.forEach((ws, uuid) => {
			ws.send(JSON.stringify(add_player_message));
		})
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
		//TODO: implement
	}

	public onPlayerAdded(player: Player, engine_id: UUID.UUID): void {

	}
}
