import PopUp, { PopUpProps } from "@/app/components/popup/PopUp";
import PopUpInput, { PopUpInputProps } from "@/app/components/popup/PopUpInput";
import { Dispatch, useCallback, useRef, useState } from "react";


type JSXChildProps = (props: { children?: PopUpProps['children'] }) => JSX.Element;
type JSXInputProps = (props: PopUpInputProps) => JSX.Element;

interface PopUpInterface<T> {
	open: Dispatch<void>;
	close: Dispatch<void>;
	state: boolean;
	element: T;
}

function UsePopUp(default_state: boolean): PopUpInterface<JSXChildProps> {
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

export function UsePopUpInput(default_state: boolean): PopUpInterface<JSXInputProps> {
	const [open, setOpen] = useState<boolean>(default_state);

	function _open() {
		setOpen(true);
	}
	function _close() {
		setOpen(false);
	}

	function render(props: PopUpInputProps) {
		return open ? <PopUpInput {...props} close={_close} /> : <></>;
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

