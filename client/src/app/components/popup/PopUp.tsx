import { Dispatch } from "react";
import "../../styles/popup.scss";

export type PopUpProps = {
	children?: React.ReactNode
	close?: Dispatch<void>
};

function PopUp(props: PopUpProps) {

	function close() {
		props.close && props?.close()
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
