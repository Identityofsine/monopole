/**
* Author: Kevin Erdogan
* Purpose: This file is responsible for building houses and hotels on any given space
*/

import { Player } from "shared-types";
import { Property } from "./space";

interface IBuilder {
	buildHouse(property: Property, player: Player): boolean;
	mortgageHouse(property: Property, player: Player): boolean;
}

export class Builder implements IBuilder {

	public buildHouse(property: Property, player: Player): boolean {

		//TODO: Implement buildHouse 
		return false;
	}

	public mortgageHouse(property: Property, player: Player): boolean {
		//TODO: Implement mortgageHouse
		return false;
	}

}
