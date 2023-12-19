import { Identifiable, UUID } from "./identifiable";
import { DecisionType, LandInformation } from "./monopoly.types";
import { Player } from "./player";

export type Rent = number[];

export type Color = {
	name: string;
	id: number;
}

export abstract class Space extends Identifiable {


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

	abstract onLand(player: Player): LandInformation;
}

export class Property extends Space {

	public _owner: UUID.UUID | null = null;

	constructor(public readonly id: number, public readonly name: string, public readonly type: number, public readonly price: number) {
		super(id, name, type);
	}

	public get owner(): UUID.UUID | null {
		return this._owner;
	}

	public setOwner(owner: UUID.UUID | null): void {
		this._owner = owner;
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
			return this.m_landinformationFactory(player, true, ['buy', 'ignore'])
		} else if (this.owner === player.UUID) {
			return this.m_landinformationFactory(player, true, ['sell', 'mortgage', 'build', 'demolish', 'ignore'])
		}
		return this.m_landinformationFactory(player, true, ['trade', 'ignore']);
	}

}

export class Street extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent, public readonly color: Color) {
		super(id, name, 1, price);
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

	constructor(public readonly id: number, public readonly name: string, public readonly amount: number) {
		super(id, name, 5);
	}

	onLand(player: Player): LandInformation {
		//TODO: implement
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


