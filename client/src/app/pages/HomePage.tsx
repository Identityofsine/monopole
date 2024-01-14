'use client';
import styles from '../page.module.css'
import '../style.scss';
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useRef, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseIntent, BaseResponse, DecisionType, GameResponse, Identifiable, Player, Space, UUID } from 'shared-types';
import { GameHandler, GameUpdater, SpaceHandle } from '@/util/GameUpdater';
import PopUp from '../components/popup/PopUp';
import UsePopUp from '@/hooks/UsePopUp';


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
	const popup = (UsePopUp(true));

	//temp state storage
	const [name, setName] = useState<string>("");
	const [game_id, setGameID] = useState<UUID.UUID>("");
	const [decisions, setDecisions] = useState<DecisionType[]>([]);


	const game_updater = useRef<GameHandler>();

	function joinGame(uuid?: UUID.UUID) {
		connection?.connect(name, uuid);
		popup.close();
	}

	useEffect(() => {
		if (!connection) return;

		//init gameupdater
		game_updater.current = GameUpdater.create({
			send: ((intent: BaseIntent) => {
				connection.send(intent);
			}),
			getUUID: (() => {
				return uuid.current.player_uuid;
			}).bind(uuid),
			getGameUUID: (() => {
				return uuid.current.game_uuid;
			}).bind(uuid),
			askPlayer: (tree: DecisionType[]) => {
				setDecisions(tree);
			}
		}, setSpaces)

		connection.Connection.on("message", (event: DataEvent) => {

			//check messages
			if (event.data.response === "id") {
				const data = event.data as BaseResponse;
				if (typeof data.message === 'string') return;

				if (data.message?.message !== "JUST_JOINED") return;

				const ids: GameID = data.message?.object as any;
				if (ids)
					uuid.current = ids;
				else
					return;
			}

			//check if gameUpdater is initialized
			const game_functions = game_updater.current;
			if (!game_functions) throw new Error("Game updater not initialized");

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

			<popup.element key="popup">
				<div className="flex justify-center">
					<div className="flex column">
						<h2>Join Game</h2>
						<input key="input1" type="text" onChange={(e) => setGameID(e.target.value)} defaultValue={game_id} placeholder="Game ID" />
						<input key="input2" type="text" onChange={(e) => setName(e.target.value)} defaultValue={name} placeholder="Player Name" />
						<button onClick={() => { joinGame(game_id) }}>Join</button>
					</div>
					<div className="flex column">
						<h2>Create Game</h2>
						<input type="text" onChange={(e) => setName(e.target.value)} defaultValue={name} placeholder="Player Name" />
						<button onClick={() => { joinGame() }}>Create</button>
					</div>
				</div>
			</popup.element>

			<div className={styles.center}>
				<RowOrganizer row_height={20} rows={4} spaces={spaces}>
					{decisions.map((decision, index) => (
						<h2 className="pointer" onClick={() => { game_updater.current?.sendDecision(decision) }}>{decision}</h2>
					))}
				</RowOrganizer>
			</div>

		</main>
	)

}

export default HomePage;
