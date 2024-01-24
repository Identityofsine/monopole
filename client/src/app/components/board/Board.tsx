import RowOrganizer from "./RowOrganizer";
import { BoardProps } from "./types";

function Board({ decisions, iface, spaces }: BoardProps) {

	return (
		<RowOrganizer row_height={20} rows={4} spaces={spaces}>
			{decisions?.map((decision, index) => (
				<h2 className="pointer" onClick={() => { iface.sendDecision(decision) }}>{decision}</h2>
			))}
		</RowOrganizer>
	)
}

export default Board;
