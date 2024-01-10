'use client';
import styles from '../page.module.css'
import '../style.scss';
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useRef, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseIntent, BaseResponse, GameResponse, Identifiable, Player, Space, UUID } from 'shared-types';
import { GameHandler, GameUpdater, SpaceHandle } from '@/util/GameUpdater';


export type PlayerHoldableSpace = Space & {
	players: Player[];
}

type GameID = {
	game_uuid: UUID.UUID,
	player_uuid: UUID.UUID
}


function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");

	const uuid = useRef<GameID>({ game_uuid: "", player_uuid: "" });
	const [text, setText] = useState<object[]>([]);
	const [spaces, setSpaces] = useState<PlayerHoldableSpace[]>([]);

	const game_updater = useRef<GameHandler>(GameUpdater.create({
		send: (intent: BaseIntent) => {
			connection?.Connection.send(intent);
		},
		getUUID: (() => {
			console.log(uuid);
			return uuid.current.player_uuid;
		}).bind(uuid),
		getGameUUID: (() => {
			return uuid.current.game_uuid;
		}).bind(uuid)

	}, setSpaces));

	useEffect(() => {
		if (!connection) return;
		connection.connect("sex");
		connection.Connection.on("message", (event: DataEvent) => {

			if (event.data.response = "id") {
				console.log(event.data);
				const ids: GameID = event.data?.message as any;
				if (ids)
					uuid.current = ids;
				else
					return;
			}

			const game_functions = game_updater.current;
			if (game_functions.isGameUpdate(event.data)) {
				const game_event = event.data as GameResponse;
				game_functions.handleGameUpdate(game_event);
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
					<h2 className="pointer" onClick={() => { game_updater.current.roll() }}>ROLL</h2>
				</RowOrganizer>
			</div>

		</main>
	)

}

export default HomePage;
