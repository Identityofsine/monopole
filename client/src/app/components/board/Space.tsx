import { SpaceProps } from "./types";
import '../../styles/spaces.scss';

/**
 * @summary This shouldn't be used outside of the board component, this should be used to create a space on the board.
 */
function Space(props: SpaceProps) {

	return (
		<div className={`space ${(props.vertical ?? false) ? 'vertical' : ''} ${(props.big ?? false) ? 'big' : ''}`}>
			<span className="name">{props.name}</span>
		</div>
	);

}

export default Space;
