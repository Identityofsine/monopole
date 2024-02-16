/**
* Author: Kevin Erdogan
* Purpose: This file is responsible for building houses and hotels on any given space
*/

import { Color, Property, Street } from "./space";
import { BuilderCommunicationLayer } from "./monopoly";
import { Player } from "./player";

export interface IBuilder {
	buildHouse(property: Property, player: Player): boolean;
	mortgageHouse(property: Property, player: Player): boolean;
}

export class Builder implements IBuilder {

	public constructor(private bcl: BuilderCommunicationLayer) {

	}

	private playerOwnsPropety(player: Player, property: Property): boolean {
		return property._owner === player.UUID;
	}

	private playerHasEnoughMoney(player: Player, cost: number): boolean {
		return player.Money >= cost;
	}

	private playerHasSetOfProperties(player: Player, property: Street): boolean {
		const uuid = this.getStreetsInSet(property.color).map((property) => { return { owner: property._owner, uuid: property.UUID } });
		for (let i = 0; i < uuid.length; i++) {
			if (uuid[i].owner !== player.UUID) {
				return false;
			}
		}
		return true;
	}

	private getStreetsInSet(color: Color): Street[] {
		const spaces = this.bcl.getSpaces();
		return spaces.filter((space) => space instanceof Street && space.color.hex === color.hex) as Street[];
	}

	public buildHouse(property: Street, player: Player): boolean {
		if (this.playerOwnsPropety(player, property)) {
			if (/* this.playerHasSetOfProperties(player, property) && */ this.playerHasEnoughMoney(player, property.house_cost)) {
				property.buildHouse(player);
				this.bcl.updateSpace(property);
				console.log("[builder(%s)]:building house", this.bcl.engine_id);
				return true;
			}
		}
		return false;
	}

	public mortgageHouse(property: Street, player: Player): boolean {
		if (this.playerOwnsPropety(player, property)) {
			//TODO: Implement mortgageHouse
			return true;
		} else {
			return false;
		}
	}

}
