import { Identifiable, UUID } from "shared-types";
import { BuildingCommunicationLayer } from "./monopoly";
import { MonopolyError } from "./monopoly.error";
import { DecisionType, NotificationType } from "shared-types";
import { LandInformation } from "./types";
import { Player } from "./player";

export type Rent = number[];

export type Color = {
	name: string;
	hex: string;
}

export abstract class Space extends Identifiable {

	private communicationLayer: BuildingCommunicationLayer | null = null;

	public constructor(public readonly id: number, public readonly name: string, public readonly type: number) {
		super(name);
	}

	protected m_landinformationFactory(player: Player, shouldWait: boolean, decision?: DecisionType | DecisionType[]): LandInformation {
		return {
			space: this,
			owner: '',
			rent: 0,
			engine_should_wait: shouldWait,
			decision: decision
		}
	}

	public setCommunicationLayer(layer: BuildingCommunicationLayer): void {
		this.communicationLayer = layer;
	}

	protected useCommunicationLayer(): BuildingCommunicationLayer {
		if (this.communicationLayer === null) {
			throw new MonopolyError('Communication layer not set');
		}
		return this.communicationLayer;
	}

	abstract onLand(player: Player): LandInformation;
}

export class Property extends Space {

	public _owner: UUID.UUID | null = null;

	constructor(public readonly id: number, public readonly name: string, public readonly type: number, public readonly price: number, public mortgaged: boolean = false) {
		super(id, name, type);
	}

	public get owner(): UUID.UUID | null {
		return this._owner;
	}

	public setOwner(owner: UUID.UUID | Player): void {
		if (owner instanceof Player) {
			this._owner = owner.UUID;
		} else {
			this._owner = owner;
		}
		console.log(this);
	}

	protected override m_landinformationFactory(player: Player, shouldWait: boolean, decision?: DecisionType | DecisionType[]): LandInformation {
		return {
			space: this,
			owner: this.owner ?? '',
			rent: 0,
			engine_should_wait: shouldWait,
			decision: decision
		}
	}

	onLand(player: Player): LandInformation {
		if (this.owner === null) {
			return this.m_landinformationFactory(player, true, ['buy'])
		} else if (this.owner === player.UUID) {
			return this.m_landinformationFactory(player, true, ['sell', 'mortgage', 'build', 'demolish'])
		} else {
			const collection = this.useCommunicationLayer().collect(player, this.price);
			const owner = this.useCommunicationLayer().getPlayer(this.owner);
			if (owner === undefined) throw new MonopolyError('Owner not found')
			this.useCommunicationLayer().award(this.owner, collection);

			player.notify({ type: NotificationType.INFO, message: 'STATUS_UPDATE' });
			owner.notify({ type: NotificationType.INFO, message: 'STATUS_UPDATE' });

			return this.m_landinformationFactory(player, true);
		}
	}

}

export class Street extends Property {

	private houses: number = 0;
	private hotels: number = 0;

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent, public readonly group: number, public readonly color: Color, public readonly house_cost = 0) {
		super(id, name, 1, price);
	}

	public getHouseCount(): number {
		return this.houses;
	}

	public getHotelCount(): number {
		return this.hotels;
	}

	public buildHouse(player: Player): void {
		if (this.houses < 4) {
			this.useCommunicationLayer().collect(player, this.house_cost);
			this.houses++;
		} else {
			throw new MonopolyError('Max houses reached');
		}
	}



}

export class Railroad extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(id, name, price, 6);
	}

}

export class Utility extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(id, name, price, 7);
	}

}

export class Tax extends Space {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number) {
		super(id, name, 5);
	}

	onLand(player: Player): LandInformation {
		//TODO: implement
		this.useCommunicationLayer().collect(player, this.price);
		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class Chance extends Space {

	constructor(public readonly id: number) {
		super(id, "Chance", 4);
	}

	onLand(player: Player): LandInformation {
		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class CommunityChest extends Space {

	constructor(public readonly id: number,) {
		super(id, "Community Chest", 2);
	}

	onLand(player: Player): LandInformation {
		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class Go extends Space {

	constructor() {
		super(0, "Go", 0);
	}

	onLand(player: Player): LandInformation {

		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class Jail extends Space {

	constructor() {
		super(10, "Jail", 9);
	}

	onLand(player: Player): LandInformation {
		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class GoToJail extends Space {

	constructor() {
		super(39, "Go To Jail", 10);
	}

	onLand(player: Player): LandInformation {
		this.useCommunicationLayer().sendToJail(player);
		return { space: this, engine_should_wait: false } as LandInformation;
	}

}

export class FreeParking extends Space {
	constructor() {
		super(9, "Free Parking", 3);
	}

	onLand(player: Player): LandInformation {
		return { space: this, engine_should_wait: false } as LandInformation;
	}
}


