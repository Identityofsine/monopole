// Author : Kevin Erdogan
import '../../styles/alertbox.scss';
import { useEffect, useRef, useState } from "react";
import Icon, { IconProps } from '../icon/Icon';


export type AlertObject = {
	throwFunction: AlertFunction,
	element: () => JSX.Element
}

export type AlertType = "ERROR" | "WARNING" | "INFO" | "SUCCESS";
export type AlertIcon = "dice" | "alert" | "house" | "info" | "payment"

export type AlertFunction = (alert: string, alert_type?: AlertType, icon_type?: AlertIcon) => void;

function mapAlertIcon(alert_icon?: AlertIcon): IconProps['icon'] {
	switch (alert_icon) {
		case "alert": {
			return "alert.svg";
		}
		case "dice": {
			return "dice.png";
		}
		case "house": {
			return "house.png";
		}
		case "info": {
			return "info.svg";
		}
		case "payment": {
			return "payment.svg";
		}
		default: {
			return "alert.svg";
		}
	}
}

function Alert(display_time: number = 4500): AlertObject {

	type AlertQueue = {
		alert: string,
		alert_type: AlertType
		icon?: AlertIcon;
	};
	const ref = useRef<AlertObject>();
	const alert_queue = useRef<AlertQueue[]>([]);
	const [alert_queue_state, setAlertQueueState] = useState<AlertQueue>({ alert: '', alert_type: 'INFO' });
	const [display, setDisplay] = useState<boolean>(false);

	function _throw(alert: string, alert_type: AlertType = "INFO", icon_type?: AlertIcon) {
		console.log(icon_type);
		m_pushAlert({ alert: alert, alert_type: alert_type, icon: icon_type });
	}

	function l_onDisplayEnd() {
		const alert = m_popAlert();
		console.log("alert:", alert);
		if (alert) {
			setAlertQueueState(alert);
			if (!display)
				setDisplay(true);
		}
		else {
			if (alert_queue_state.alert !== '') {
				setAlertQueueState({ alert: '', alert_type: 'INFO' });
				setDisplay(false);
			}
		}
	}

	function m_pushAlert(alert: AlertQueue) {
		alert_queue.current.push(alert);
		if (!display) {
			const popped_alert = m_popAlert();
			if (popped_alert) {
				setAlertQueueState(popped_alert);
				setDisplay(true);
			}
		}
	}

	function m_popAlert(): AlertQueue | undefined {
		return alert_queue.current.pop();
	}

	function AlertElement() {

		const [l_display, setLDisplay] = useState<boolean>(false);
		const timeout_ref = useRef<NodeJS.Timeout | undefined>();

		useEffect(() => {
			const is_empty = alert_queue_state.alert === '';
			if (!is_empty)
				setLDisplay(true);

			return () => {
				if (alert_queue_state.alert === '') return;
				cancel();
			}
		}, [alert_queue_state])


		useEffect(() => {
			if (l_display) {
				wait();
			}
			else {
			}
		}, [l_display]);

		function wait() {
			if (l_display) {
				timeout_ref.current = setTimeout(() => {
					setLDisplay(false);
				}, display_time - 1500);
			} else {
				l_onDisplayEnd();
			}
		}

		function next() {
			if (!l_display) {
				l_onDisplayEnd();
			}
		}

		function cancel() {
			if (timeout_ref.current) {
				clearTimeout(timeout_ref.current);
				timeout_ref.current = undefined;
			}
		}

		return (
			<div className="fixed alert-box-container">
				<div
					className={`flex content-container absolute center-absolute-x alert-box ${l_display ? 'show' : 'hide'}`}
					onTransitionEnd={() => { next() }}
					onClick={() => { cancel(); setLDisplay(false); }}
				>
					<div className="flex align-center fit-height gap-01">
						<Icon icon={mapAlertIcon(alert_queue_state.icon)} className="alert-icon" alt="icon" />
						<p className="center-text message">{alert_queue_state.alert}</p>
					</div>
				</div>
			</div>
		)
	}

	ref.current = {
		throwFunction: _throw,
		element: AlertElement
	}

	return ref.current;
}

export default Alert;
