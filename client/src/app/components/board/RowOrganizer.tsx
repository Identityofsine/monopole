import { Identifiable } from "shared-types";
import "../../styles/row.scss";
import { useEffect, useRef } from "react";
import { ReactGenerateMultiple, ReactGenerateSingle } from "@/util/ReactCreator";
import Space from "./Space";
import { SpaceProps } from "./types";

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
	spaces: Identifiable[];
	rows: number;
	row_height: number;
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
	const spaces = useRef<SpaceOrganizer<SpaceProps>>({ top: [], bottom: [], left: [], right: [] });

	useEffect(() => {
		//TODO: Have this update on window resize
		if (!ref.current) return;
		dimensions.current.width = ref.current.clientWidth;
		dimensions.current.height = ref.current.clientHeight;
		sortSpaces();
	}, [ref])

	function sortSpaces() {
		spaces.current = { top: [], bottom: [], left: [], right: [] };
		if (!props.spaces) return;
		props.spaces?.forEach((space, idx) => {
			//ugly code
			let space_prop: SpaceProps = {
				name: space.Name,
				color: { name: 'red', hex: 'red' }
			}
			if (idx <= 11) {
				if (idx === 0 || idx === 11) {
					space_prop.big = true;
				}
				spaces.current.top.push(space_prop);
			} else if (idx > 11 && idx < 20) {
				space_prop.vertical = true;
				spaces.current.right.push(space_prop);
			} else if (idx >= 20 && idx <= 31) {
				if (idx === 20 || idx === 31) {
					space_prop.big = true;
				}
				spaces.current.bottom.push(space_prop);
			} else {
				space_prop.vertical = true;
				spaces.current.left.push(space_prop);
			}
		});
	}


	return (
		<div id="row-container" ref={ref}>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.current.top, spaces.current.top.length)} height={props.row_height} />
			<div className="row space-between middle">
				<Row type='column' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.current.left, spaces.current.left.length)} height={props.row_height} />
				<Row type='column-reverse' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.current.right, spaces.current.right.length)} height={props.row_height} />
			</div>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, spaces.current.bottom, spaces.current.bottom.length)} height={props.row_height} />
		</div>
	)
}

export default RowOrganizer;
