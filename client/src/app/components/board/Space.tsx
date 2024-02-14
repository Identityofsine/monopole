import { SpaceProps } from "./types";
import '../../styles/spaces.scss';
import Piece from "./Piece";
import { House } from "./House";

/**
 * @summary This shouldn't be used outside of the board component, this should be used to create a space on the board.
 */
function Space(props: SpaceProps) {

	return (
		<div className={`space ${(props.vertical ?? false) ? 'vertical' : ''} ${(props.big ?? false) ? 'big' : ''} ${(props?.owner && 'owned') ?? ''} relative flex column`}>

			<div className="name">
				<p>{props.name}</p>
			</div>
			<div className="players flex justify-center">
				{props.players?.map((player, idx) => (
					<Piece
						player={player}
						color={{ name: "Blue", hex: "#0000FF" }}
						key={idx}
					/>
				))}
			</div>
			<div className="homes flex justify-center">
				{Array.from(Array(props?.houses ?? 0), (_, idx) => (
					<House key={idx} />
				))}
			</div>
			<div
				className={`price flex center-flex margin-top-auto ${props.owner ? 'owned' : ''}`}
				style={{ backgroundColor: props?.color ? props.color.hex : "#FFFFFF" }}
			>
				{
					props.owner
						? <span>{props.owner}</span>
						: props.price !== 0
							? <span>${props.price}</span>
							: <span>&nbsp;</span>

				}
			</div>
		</div>
	);

}

export default Space;
