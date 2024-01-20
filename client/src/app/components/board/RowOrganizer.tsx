import { Identifiable } from "shared-types";
import "../../styles/row.scss";
import { useEffect, useRef, useState } from "react";
import { ReactGenerateMultiple, ReactGenerateSingle } from "@/util/ReactCreator";
import Space from "./Space";
import { SpaceProps } from "./types";
import { PlayerHoldableSpace } from "@/app/pages/HomePage";

type RowDirection = "row" | "column" | "row-reverse" | "column-reverse";

type RowProps = {
	type: RowDirection;
	height: number;
	unit?: 'px' | 'em' | 'rem' | '%';
	elements?: React.ReactNode[] | React.ReactNode
};

function Row(props: RowProps) {

	const styles = props.type === 'row' || props.type === 'row-reverse' ? { height: `${props.height}${props.unit ?? '%'}` } : { width: `${props.height}${props.unit ?? '%'}` };
	return (
		<div className={`${props.type}`} style={styles}>
			{props.elements}
		</div>
	)
}

export type RowOrganizerProps = {
	spaces: PlayerHoldableSpace[];
	rows: number;
	row_height: number;
	children?: React.ReactNode;
};

type SpaceOrganizer<T extends object> = {
	top: T[];
	bottom: T[];
	left: T[];
	right: T[];
}

function RowOrganizer(props: RowOrganizerProps) {

	const ref = useRef<HTMLDivElement>(null);
	const dimensions = useRef({ width: 0, height: 0 });
	const [spaces, setSpace] = useState<SpaceOrganizer<SpaceProps>>({ top: [], bottom: [], left: [], right: [] });

	useEffect(() => {
		//TODO: Have this update on window resize
		if (!ref.current) return;
		dimensions.current.width = ref.current.clientWidth;
		dimensions.current.height = ref.current.clientHeight;
	}, [])

	useEffect(() => {
		sortSpaces();
	}, [props.spaces]);

	function pushSpaces(spot: keyof SpaceOrganizer<SpaceProps>, spaces: SpaceProps) {
		setSpace((old_state) => {
			const new_state = { ...old_state };
			new_state[spot].push(spaces);
			return new_state;
		})
	}

	function sortSpaces() {
		if (!props.spaces) return;
		setSpace({ top: [], bottom: [], left: [], right: [] });
		props.spaces?.forEach((space, idx) => {
			//ugly code
			let space_prop: SpaceProps = {
				name: space.name,
				color: { name: 'red', hex: 'red' },
				players: space.players,
				owner: space?._owner
			}
			if (idx < 11) {
				if (idx === 0 || idx === 10) {
					space_prop.big = true;
				}
				pushSpaces('top', space_prop);
			} else if (idx >= 11 && idx < 20) {
				space_prop.vertical = true;
				pushSpaces('right', space_prop);
			} else if (idx >= 20 && idx < 31) {
				if (idx === 20 || idx === 30) {
					space_prop.big = true;
				}
				pushSpaces('bottom', space_prop);
			} else {
				space_prop.vertical = true;
				pushSpaces('left', space_prop);
			}
		});
	}


	return (
		<div id="row-container" ref={ref}>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.top, spaces.top.length)} height={props.row_height} />
			<div className="row space-between middle">
				<Row type='column-reverse' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.left, spaces.left.length)} height={props.row_height} />
				<div className="center">
					{props.children}
				</div>
				<Row type='column' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.right, spaces.right.length)} height={props.row_height} />
			</div>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.bottom, spaces.bottom.length)} height={props.row_height} />
		</div>
	)
}

export default RowOrganizer;
