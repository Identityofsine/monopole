import { Pair, PlayerCommunicationLayer } from "./monopoly";
import { MONOPOLY_CONSTS } from "./monopoly.consts";
import { MonopolyError } from "./monopoly.error";
import { Identifiable, UUID, NotificationEvent, NotificationType, MonopolyInterface, JailData } from "shared-types";

export class Player extends Identifiable {
	private communicationLayer: PlayerCommunicationLayer | undefined = undefined;
	private monopolyInterface: MonopolyInterface<PlayerCommunicationLayer> | undefined = undefined;
	private jail: JailData = { turns: 0, in_jail: false };
	private money: number = 800;
	private properties: UUID.UUID[] = [];
	private position: number = 0;

	constructor(name: string, uuid?: UUID.UUID, communicationLayer?: PlayerCommunicationLayer, monopolyInterface?: MonopolyInterface<PlayerCommunicationLayer>) {
		super(name, uuid);
		if (communicationLayer)
			this.communicationLayer = communicationLayer;
		if (monopolyInterface)
			this.monopolyInterface = monopolyInterface;
	}

	public setCommunicationLayer(communicationLayer: PlayerCommunicationLayer) {
		this.communicationLayer = communicationLayer;
	}

	public setMonopolyInterface(monopolyInterface: MonopolyInterface<PlayerCommunicationLayer>) {
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

	public get Position(): number {
		return this.position;
	}

	public get Jail(): boolean {
		return this.jail.in_jail;
	}

	public get JailTurns(): number {
		return this.jail.turns;
	}

	public get Money(): number {
		return this.money;
	}

	public set Money(money: number) {
		this.money = money;
	}

	public set Jail(jail: boolean) {
		this.jail = { turns: 0, in_jail: jail };
	}

	public set JailTurns(turns: number) {
		this.jail.turns = turns;
	}

	public giveMoney(amount: number): void {
		this.money += amount;
	}

	public takeMoney(amount: number): number {
		//dont allow negative money
		if ((this.money - amount) < 0) {
			const temp = this.money;
			this.money = 0;
			return temp;
		}
		this.money -= amount;
		return amount;
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
