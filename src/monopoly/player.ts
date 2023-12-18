import { Identifiable, UUID } from "./identifiable";
import { Pair, PlayerCommunicationLayer } from "./monopoly";
import { MONOPOLY_CONSTS } from "./monopoly.consts";
import { MonopolyError } from "./monopoly.error";
import { NotificationEvent, NotificationType, MonopolyInterface } from "./monopoly.types";

export class Player extends Identifiable {
	private communicationLayer: PlayerCommunicationLayer | undefined = undefined;
	private monopolyInterface: MonopolyInterface | undefined = undefined;
	private jail: boolean = false;
	private money: number = 800;
	private properties: UUID.UUID[] = [];
	private position: number = 0;

	constructor(name: string, uuid?: UUID.UUID, communicationLayer?: PlayerCommunicationLayer, monopolyInterface?: MonopolyInterface) {
		super(name, uuid);
		if (communicationLayer)
			this.communicationLayer = communicationLayer;
		if (monopolyInterface)
			this.monopolyInterface = monopolyInterface;
	}

	public setCommunicationLayer(communicationLayer: PlayerCommunicationLayer) {
		this.communicationLayer = communicationLayer;
	}

	public setMonopolyInterface(monopolyInterface: MonopolyInterface) {
		this.monopolyInterface = monopolyInterface;
	}

	public move(spaces: number): number {
		const size = MONOPOLY_CONSTS.spaces;
		this.position = (this.position + spaces) % size;
		return this.position;
	}

	public setPosition(position: number): void {
		this.position = position;
	}

	public notify(message: NotificationEvent): void {
		if (!this.communicationLayer) {
			throw new MonopolyError('Player has no communication layer');
		}

		if (this.monopolyInterface) {
			this.monopolyInterface.onNotification(this, this.communicationLayer, message);
		}
		else {
			if (message.type === NotificationType.DECISION) {
				//TODO: implement
				if (message.decision == 'roll') {
					const roll: Pair = this.communicationLayer?.rollDice();
					console.log('[player:%s] rolled %d', this.name, roll.dice1 + roll.dice2);
					this.communicationLayer.move(roll.dice1 + roll.dice2);
				}
			}
		}
	}

}
