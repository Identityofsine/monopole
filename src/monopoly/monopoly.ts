import { Player } from "./player";
import { Space } from "./space";

class Monopoly {
	private players: Player[];
	private spaces: Space[];



}

interface PlayerCommunicationLayer {
	rollDice(): number;
	move(): Space;
	buyProperty(): boolean;

}
