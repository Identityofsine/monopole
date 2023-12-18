import { UUID } from "../monopoly/identifiable";
import { MonopolyEngine, PlayerCommunicationLayer } from "../monopoly/monopoly";
import { MonopolyError } from "../monopoly/monopoly.error";
import { MonopolyInterface, NotificationEvent } from "../monopoly/monopoly.types";
import { Player } from "../monopoly/player";
import ServerInstance from "./websocket";
import { ConnectionIntent } from "./ws.intent";

export class MonopolyServer implements MonopolyInterface {

	private instance = ServerInstance.getInstance();
	private games = new Map<UUID.UUID, MonopolyEngine>();

	public constructor() {

	}

	private m_setup(): void {
		this.instance.on('connection', (event) => {
			const data = event.data as ConnectionIntent;
			if (data.intent === 'create') {
				const uuid = this.createGame();
				const game = this.getGame(uuid);
				if (game) {
					const player = new Player(data.name, data.uuid, undefined, this);
					game.addPlayer(player);
				}
			} else {
				if (!data.game_uuid) throw new MonopolyError('No game uuid provided');
				const game = this.getGame(data.game_uuid);
				if (game) {
					const player = new Player(data.name, data.uuid, undefined, this);
					game.addPlayer(player);
				}
			}

		});
	}

	private createGame(): UUID.UUID {
		const uuid = UUID.generateUUID(15234);
		this.games.set(uuid, new MonopolyEngine());
		return uuid;
	}

	private getGame(uuid: UUID.UUID): MonopolyEngine | undefined {
		return this.games.get(uuid);
	}

	public onNotification(player: Player, communicationlayer: PlayerCommunicationLayer, notification: NotificationEvent): void {
	}

}
