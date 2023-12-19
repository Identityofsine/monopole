import { Identifiable, UUID } from "./identifiable";
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

	abstract onLand(player: Player): void;
}

export class Property extends Space {

	public owner: UUID.UUID | null = null;

	constructor(public readonly id: number, public readonly name: string, public readonly type: number, public readonly price: number) {
		super(id, name, type);
	}

	onLand(player: Player): void {
		if (this.owner === null) {
		}
	}

}

export class Street extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent, public readonly color: Color) {
		super(id, name, 1, price);
	}

	onLand(player: Player): void {
		console.log('[monopoly] landed on street %s', this.name);
	}

}

export class Railroad extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(id, name, price, 6);
	}

	onLand(player: Player): void {

	}

}

export class Utility extends Property {

	constructor(public readonly id: number, public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(id, name, price, 7);
	}

	onLand(player: Player): void {

	}

}

export class Tax extends Space {

	constructor(public readonly id: number, public readonly name: string, public readonly amount: number) {
		super(id, name, 5);
	}

	onLand(player: Player): void {

	}

}

export class Chance extends Space {

	constructor(public readonly id: number) {
		super(id, "Chance", 4);
	}

	onLand(player: Player): void {

	}

}

export class CommunityChest extends Space {

	constructor(public readonly id: number,) {
		super(id, "Community Chest", 2);
	}

	onLand(player: Player): void {

	}

}

export class Go extends Space {

	constructor() {
		super(0, "Go", 0);
	}

	onLand(player: Player): void {

	}

}

export class Jail extends Space {

	constructor() {
		super(10, "Jail", 9);
	}

	onLand(player: Player): void {

	}

}

export class GoToJail extends Space {

	constructor() {
		super(39, "Go To Jail", 10);
	}

	onLand(player: Player): void {

	}

}

export class FreeParking extends Space {
	constructor() {
		super(9, "Free Parking", 3);
	}

	onLand(player: Player): void {

	}
}


