// Author : Kevin Erdogan
import '../../styles/alertbox.scss';
import { useEffect, useRef, useState } from "react";


export type AlertObject = {
	throwFunction: AlertFunction,
	element: () => JSX.Element
}

export type AlertType = "ERROR" | "WARNING" | "INFO" | "SUCCESS";

export type AlertFunction = (alert: string, alert_type?: AlertType) => void;

function Alert(display_time: number = 4500): AlertObject {

	type AlertQueue = {
		alert: string,
		alert_type: AlertType
	};
	const ref = useRef<AlertObject>();
	const alert_queue = useRef<AlertQueue[]>([]);
	const [alert_queue_state, setAlertQueueState] = useState<AlertQueue>({ alert: '', alert_type: 'INFO' });
	const [display, setDisplay] = useState<boolean>(false);

	function _throw(alert: string, alert_type: AlertType = "INFO") {
		console.log(`${alert_type}:` + alert);
		m_pushAlert({ alert: alert, alert_type: alert_type });
	}

	function l_onDisplayEnd() {
		const alert = m_popAlert();
		if (alert) {
			setAlertQueueState(alert);
			setDisplay(true);
		}
		else {
			setAlertQueueState({ alert: '', alert_type: 'INFO' });
			setDisplay(false);
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
			setLDisplay(display);
		}, [display])

		useEffect(() => {
		}, [l_display]);

		function wait() {
			if (l_display) {
				setTimeout(() => {
					setLDisplay(false);
				}, display_time - 1500);
			} else {
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
					className={`alert-box ${l_display ? 'show' : 'hide'}`}
					onTransitionEnd={() => { wait(); }}
				>
					<h2>{alert_queue_state.alert_type}:{alert_queue_state.alert}</h2>
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
