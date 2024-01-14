import PopUp, { PopUpProps } from "@/app/components/popup/PopUp";
import { Dispatch, useCallback, useRef, useState } from "react";


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
		console.log('close')
		setOpen(false);
	}

	function render(props: { children?: PopUpProps['children'] }) {
		return open ? <PopUp close={_close} {...props} /> : <></>;
	}

	//only rerender when 'open' changes
	const renderCallback = useCallback(render, [open]);

	return {
		state: open,
		open: _open,
		close: _close,
		element: renderCallback
	};
}

export default UsePopUp;
