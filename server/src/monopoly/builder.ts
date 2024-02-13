/**
* Author: Kevin Erdogan
* Purpose: This file is responsible for building houses and hotels on any given space
*/

import { Property, Street } from "./space";
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

	public buildHouse(property: Street, player: Player): boolean {
		if (this.playerOwnsPropety(player, property)) {
			//TODO: Implement buildHouse 
			if (this.playerHasEnoughMoney(player, property.house_cost)) {
				property.buildHouse(player);
			}
			return true;
		} else {

			return false;
		}
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
