import { Player, UUID } from "shared-types";

export type Color = {
	name: string;
	hex: string;
};

export type SpaceProps = {
	name: string;
	owner?: UUID.UUID
	players: Player[];
	color: Color;
	vertical?: boolean;
	big?: boolean;
};

export type PieceProps = {
	player: Player;
	color: Color;
};
