import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import RowOrganizer from "./RowOrganizer";
import { BoardProps } from "./types";

function Board({ decisions, iface, spaces }: BoardProps) {


	function mapSpaces(spaces: PlayerHoldableSpace[]) {
		return spaces.map((space, _index) => {
			return { ...space, _owner: iface.getPlayer(space?._owner ?? '')?.name ?? '' }
		});
	}

	return (
		<RowOrganizer row_height={20} rows={4} spaces={mapSpaces(spaces)}>
			{decisions?.map((decision, _index) => (
				<h2 className="pointer" onClick={() => { iface.sendDecision(decision) }}>{decision}</h2>
			))}
		</RowOrganizer>
	)
}

export default Board;
