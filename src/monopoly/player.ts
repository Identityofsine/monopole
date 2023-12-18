import { Identifiable, UUID } from "./identifiable";
import { Pair, PlayerCommunicationLayer } from "./monopoly";
import { MonopolyError } from "./monopoly.error";
import { NotificationEvent, NotificationType } from "./monopoly.types";

export class Player extends Identifiable {
	private communicationLayer: PlayerCommunicationLayer | undefined = undefined;
	private money: number = 800;
	private properties: UUID.UUID[] = [];
	private position: number = 0;

	constructor(name: string, uuid?: UUID.UUID, communicationLayer?: PlayerCommunicationLayer) {
		super(name, uuid);
		if (communicationLayer)
			this.communicationLayer = communicationLayer;
	}

	public setCommunicationLayer(communicationLayer: PlayerCommunicationLayer) {
		this.communicationLayer = communicationLayer;
	}

	public move(spaces: number): number {
		this.position += spaces;
		return this.position;
	}

	public notify(message: NotificationEvent): void {
		if (!this.communicationLayer) {
			throw new MonopolyError('Player has no communication layer');
		}

		if (message.type === NotificationType.DECISION) {
			//TODO: implement
			if (message.decision == 'roll') {
				const roll: Pair = this.communicationLayer?.rollDice();
				console.log('[player:%s] rolled %d', this.name, roll.dice1 + roll.dice2);
				this.communicationLayer.move(roll.dice1 + roll.dice2);
			}
		}
		console.log('[player:%s] %s', this.name, message.message);
	}

}
