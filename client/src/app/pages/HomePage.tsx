'use client';
import styles from '../page.module.css'
import '../style.scss';
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useRef, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseResponse, GameResponse, Identifiable, Player, Space, UUID } from 'shared-types';
import { GameHandler, SpaceHandle } from '@/util/GameUpdater';


export type PlayerHoldableSpace = Space & {
	players: Player[];
}

function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");
	const [uuid, setUUID] = useState<UUID.UUID>("");
	const [text, setText] = useState<object[]>([]);
	const [spaces, setSpaces] = useState<PlayerHoldableSpace[]>([]);
	const space_handler = useRef<GameHandler>(SpaceHandle.create(setSpaces));

	useEffect(() => {
		if (!connection) return;
		connection.connect("sex", "93ae15d3-20d1-q68d-108-cbabeec1c097");
		connection.Connection.on("message", (event: DataEvent) => {

			if (event.data.response = "id") {
				const ids: { game_uuid: UUID.UUID, player_uuid: UUID.UUID } = event.data?.message as any;
				if (ids)
					setUUID(ids.player_uuid);
				return;
			}

			const space_functions = space_handler.current;
			if (space_functions.isGameUpdate(event.data)) {
				const game_event = event.data as GameResponse;
				space_functions.handleGameUpdate(game_event);
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
				<RowOrganizer row_height={20} rows={4} spaces={spaces}>
					<h2>ROLL</h2>
				</RowOrganizer>
			</div>

		</main>
	)

}

export default HomePage;
