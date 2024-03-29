import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import { ISource } from "@/util/GameUpdater";
import { DecisionType, Player, UUID } from "shared-types";

export type Color = {
	name: string;
	hex: string;
	max?: number;
};

export type SpaceProps = {
	name: string;
	owner?: string
	players: Player[];
	houses: number;
	price: number;
	color: Color;
	vertical?: boolean;
	big?: boolean;
};

export type PieceProps = {
	player: Player;
	color: Color;
};

export type BoardProps = {
	spaces: PlayerHoldableSpace[];
	decisions: DecisionType[];
	inTurn: UUID.UUID;
	main_player: UUID.UUID;
	iface: ISource;
}
