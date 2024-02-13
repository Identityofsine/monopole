/**
* Author: Kevin Erdogan
* Purpose: This file is responsible for building houses and hotels on any given space
*/

import { Player } from "shared-types";
import { Property, Street } from "./space";

interface IBuilder {
	buildHouse(property: Property, player: Player): boolean;
	mortgageHouse(property: Property, player: Player): boolean;
}

export class Builder implements IBuilder {

	private playerOwnsPropety(player: Player, property: Property): boolean {
		return property._owner === player.uuid;
	}

	public buildHouse(property: Street, player: Player): boolean {
		if (this.playerOwnsPropety(player, property)) {
			//TODO: Implement buildHouse 

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
