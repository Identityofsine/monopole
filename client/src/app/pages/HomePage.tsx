'use client';
import styles from '../page.module.css'
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseResponse, GameResponse, Identifiable } from 'shared-types';

function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");
	const [text, setText] = useState<object[]>([]);
	const [spaces, setSpaces] = useState<Identifiable[]>([]);


	//move to util
	function isGameUpdate(event: BaseResponse) {
		const mutated = event as GameResponse;
		return mutated.recipient !== undefined;
	}

	function isMessageObject(event: BaseResponse) {
		return typeof event.message !== 'string';
	}

	function updatePlayers(message: { host: string, players: Identifiable[], spaces: Identifiable[] }) {
		//TODO: clean up
	}

	function updateSpaces(message: { host: string, players: Identifiable[], spaces: Identifiable[] }) {
		if (!message.spaces) return;
		setSpaces(message.spaces);
	}

	function handleGameUpdate(event: GameResponse) {
		if (isMessageObject(event)) {
			const message = event.message as { message: string, object: any };
			updateSpaces(message.object);
		} else {
			//some other stuff i guess
		}
	}

	useEffect(() => {
		if (!connection) return;
		connection.Connection.on("message", (event: DataEvent) => {
			//please clean
			if (isGameUpdate(event.data)) {
				const game_event = event.data as GameResponse;
				handleGameUpdate(game_event);
			}
			setText((old_text) => {
				return [...old_text, event.data];
			});
		});
		connection.Connection.on('error', (error: ErrorEvent) => {
			setText((old_text) => {
				return [...old_text, [error.error.message]];
			})
		});
	}, [connection])

	return (
		<main className={styles.container} >

			<div className={styles.description}>
				<p>
					<ReactJson src={text} theme="monokai" collapsed={true} />
				</p>
				<div>
				</div>
			</div>

			<div className={styles.center}>
				<RowOrganizer row_height={20} rows={4} spaces={spaces} />
			</div>

		</main>
	)

}

export default HomePage;
