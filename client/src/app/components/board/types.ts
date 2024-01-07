export type Color = {
	name: string;
	hex: string;
};

export type SpaceProps = {
	name: string;
	color: Color;
	vertical?: boolean;
	big?: boolean;
};
