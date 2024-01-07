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
	const spaces = useRef<SpaceOrganizer<Identifiable>>({ top: [], bottom: [], left: [], right: [] });

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
			if (idx < 10) {
				spaces.current.top.push(space);
			} else if (idx < 20) {
				spaces.current.bottom.push(space);
			} else if (idx < 30) {
				spaces.current.left.push(space);
			} else {
				spaces.current.right.push(space);
			}
		});
	}


	return (
		<div id="row-container" ref={ref}>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, { name: 'Anal Way', color: { 'name': 'red', hex: 'red' } }, 11)} height={props.row_height} />
			<div className="row space-between middle">
				<Row type='column' elements={ReactGenerateMultiple<SpaceProps>(Space, { name: 'Anal Way', color: { 'name': 'red', hex: 'red' }, vertical: true }, 9)} height={props.row_height} />
				<Row type='column-reverse' elements={ReactGenerateMultiple<SpaceProps>(Space, { name: 'Anal Way', color: { 'name': 'red', hex: 'red' }, vertical: true }, 9)} height={props.row_height} />
			</div>
			<Row type='row' elements={ReactGenerateMultiple<SpaceProps>(Space, { name: 'Anal Way', color: { 'name': 'red', hex: 'red' } }, 11)} height={props.row_height} />
		</div>
	)
}

export default RowOrganizer;
