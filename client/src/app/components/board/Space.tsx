import { SpaceProps } from "./types";
import '../../styles/spaces.scss';
import Piece from "./Piece";

/**
 * @summary This shouldn't be used outside of the board component, this should be used to create a space on the board.
 */
function Space(props: SpaceProps) {

	return (
		<div className={`space ${(props.vertical ?? false) ? 'vertical' : ''} ${(props.big ?? false) ? 'big' : ''} ${(props?.owner && 'owned') ?? ''} `}>

			<span className="name">{props.name}</span>
			<div className="players flex margin-top-auto">
				{props.players?.map((player, idx) => (
					<Piece player={player} color={{ name: "Blue", hex: "#0000FF" }} key={idx} />
				))}
			</div>
		</div>
	);

}

export default Space;
