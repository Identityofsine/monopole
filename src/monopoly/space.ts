import { Identifiable, UUID } from "./identifiable";

export type Rent = number[];

export type Color = {
	name: string;
	id: number;
}

export abstract class Space extends Identifiable {

	public constructor(public readonly name: string) {
		super(name);
	}

	abstract onLand(): void;
}

export class Property extends Space {

	public owner: UUID.UUID | null = null;

	constructor(public readonly name: string, public readonly price: number) {
		super(name);
	}

	onLand(): void {
		if (this.owner === null) {
		}
	}

}

export class Railroad extends Property {

	constructor(public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(name, price);
	}

	onLand(): void {

	}

}

export class Utility extends Property {

	constructor(public readonly name: string, public readonly price: number, public readonly rent: Rent) {
		super(name, price);
	}

	onLand(): void {

	}

}

export class Tax extends Space {

	constructor(public readonly name: string, public readonly amount: number) {
		super(name);
	}

	onLand(): void {

	}

}

export class Chance extends Space {

	constructor() {
		super("Chance");
	}

	onLand(): void {

	}

}

export class CommunityChest extends Space {

	constructor() {
		super("Community Chest");
	}

	onLand(): void {

	}

}

export class Go extends Space {

	constructor() {
		super("Go");
	}

	onLand(): void {

	}

}

export class Jail extends Space {

	constructor() {
		super("Jail");
	}

	onLand(): void {

	}

}

export class FreeParking extends Space {
	constructor() {
		super("Free Parking");
	}

	onLand(): void {

	}
}


