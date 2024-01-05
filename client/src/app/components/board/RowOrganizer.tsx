
type RowDirection = "row" | "column" | "row-reverse" | "column-reverse";

type RowProps = {
	type: RowDirection;
	height: number;
	elements?: React.ReactNode[] | React.ReactNode
};

function Row(props: RowProps) {

	return (
		<div className={`${props.type}`}>
			{props.elements}
		</div>
	)
}

type RowOrganizerProps = {
	spaces: any;
	rows: number;
	row_height: number;
};

function RowOrganizer(props: RowOrganizerProps) {

	return (
		<div id="row-container">
			<Row type='row' height={props.row_height} />
			<div className="row space-between">
				<Row type='column' height={props.row_height} />
				<Row type='column-reverse' height={props.row_height} />
			</div>
			<Row type='row' height={props.row_height} />
		</div>
	)
}

export default RowOrganizer;
