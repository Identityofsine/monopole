import "../../styles/popup.scss";

export type PopUpProps = {
	children?: React.ReactNode
	openState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
};

function PopUp(props: PopUpProps) {

	if (props.openState) {
		if (!props.openState[0]) return null;
	}

	function close() {
		if (props.openState) {
			props.openState[1](false);
		}
	}

	return (
		<div className="popup center-absolute">
			<div className="close-button absolute">
				<span className="icon" onClick={close}>X</span>
			</div>
			<div className="popup-content">
				{props.children}
			</div>
		</div>
	)
}

export default PopUp;
