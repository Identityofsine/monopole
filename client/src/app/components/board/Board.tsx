import { PlayerHoldableSpace } from "@/app/pages/HomePage";
import RowOrganizer from "./RowOrganizer";
import { BoardProps } from "./types";

function Board({ decisions, iface, spaces, inTurn, main_player }: BoardProps) {


	function mapSpaces(spaces: PlayerHoldableSpace[]) {
		return spaces.map((space, _index) => {
			return { ...space, _owner: iface.getPlayer(space?._owner ?? '')?.name ?? '' }
		});
	}

	function getPlayer(uuid: string) {
		if (iface)
			return iface?.getPlayer(uuid);
	}

	function displayName(uuid: string) {
		return getPlayer(uuid)?.name ?? '';
	}

	function turnLogic() {
		if (inTurn === '' || inTurn === undefined || main_player === '' || main_player === undefined) return <></>
		const name = displayName(inTurn);
		if (name.trim() === '') return <></>

		if (main_player !== inTurn)
			return <p>Waiting for {name}...</p>
		else
			return <p>Your turn</p>
	}

	function decisionLogic() {
		if (decisions === undefined) return <></>
		return decisions.map((decision, _index) => (
			<h2 className="pointer" onClick={() => { iface.sendDecision(decision) }}>{decision}</h2>
		))
	}

	return (
		<RowOrganizer row_height={20} rows={4} spaces={mapSpaces(spaces)}>
			{turnLogic()}
			{decisionLogic()}
		</RowOrganizer>
	)
}

export default Board;
