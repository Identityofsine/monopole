import { Player } from "shared-types";

export type Color = {
	name: string;
	hex: string;
};

export type SpaceProps = {
	name: string;
	players: Player[];
	color: Color;
	vertical?: boolean;
	big?: boolean;
};

export type PieceProps = {
	player: Player;
	color: Color;
};
