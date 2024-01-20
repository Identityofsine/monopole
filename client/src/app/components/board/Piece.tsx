import { PieceProps } from "./types";
import '../../styles/pieces.scss';

function Piece(props: PieceProps) {

	return (
		<div className={`piece flex align-center justify-center`} style={{ backgroundColor: props.color.hex }}>
			<span className="player-name">{props.player.name}</span>
		</div>
	)

}

export default Piece;
