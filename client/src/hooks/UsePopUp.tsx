import PopUp, { PopUpProps } from "@/app/components/popup/PopUp";
import { Dispatch, useRef, useState } from "react";


type JSXChildProps = (props: { children?: PopUpProps['children'] }) => JSX.Element;

interface PopUpInterface {
	open: Dispatch<void>;
	close: Dispatch<void>;
	state: boolean;
	element: JSXChildProps;
}

function UsePopUp(default_state: boolean): PopUpInterface {
	const [open, setOpen] = useState<boolean>(default_state);

	function _open() {
		setOpen(true);
	}
	function _close() {
		setOpen(false);
	}

	return {
		state: open,
		open: _open,
		close: _close,
		element: ((props: { children?: PopUpProps['children'] }) => (<PopUp openState={[open, setOpen]} {...props} />))
	}
}

export default UsePopUp;
