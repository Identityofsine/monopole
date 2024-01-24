'use client';
import styles from '../page.module.css'
import '../style.scss';
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useRef, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseIntent, BaseResponse, DecisionType, GameResponse, Identifiable, Player, Space, UUID } from 'shared-types';
import { GameHandler, GameState, GameUpdater, ISource, SpaceHandle } from '@/util/GameUpdater';
import PopUp from '../components/popup/PopUp';
import UsePopUp from '@/hooks/UsePopUp';
import Board from '../components/board/Board';
import { ConnectionInterface } from '@/obj/connection';


export type PlayerHoldableSpace = Space & {
	players: Player[];
}

export type GameID = {
	game_uuid: UUID.UUID,
	host_uuid: UUID.UUID,
	player_uuid: UUID.UUID
}

export interface ICClient extends ConnectionInterface {
	askPlayer(tree: DecisionType[]): void;
	getID(): GameID;
}


function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");

	//debug
	const [text, setText] = useState<object[]>([]);

	//uuid stuff
	const uuid = useRef<GameID>({ game_uuid: "", player_uuid: "", host_uuid: "" });
	const [spaces, setSpaces] = useState<PlayerHoldableSpace[]>([]);

	//gamestate
	const [gamestate, setGamestate] = useState<GameState>("WAITING");

	//popup window.
	const popup = (UsePopUp(true));

	//temp state storage
	const [name, setName] = useState<string>("");
	const [game_id, setGameID] = useState<UUID.UUID>("");

	//decisions
	const [decisions, setDecisions] = useState<DecisionType[]>([]);


	const game_updater = useRef<GameHandler>();

	function joinGame(uuid?: UUID.UUID) {
		connection?.connect(name, uuid);
		popup.close();
	}

	function m_gameUpdaterFactory() {
		if (!connection) throw new Error("Connection not initialized");

		return GameUpdater.create({
			send: ((intent: BaseIntent) => {
				connection.send(intent);
			}),
			getID: (() => {
				return uuid.current;
			}).bind(uuid),
			askPlayer: (tree: DecisionType[]) => {
				setDecisions(tree);
			}
		}, { state: gamestate, setState: setGamestate }, { state: spaces, setState: setSpaces })

	}

	useEffect(() => {
		if (!connection) return;

		//init gameupdater
		game_updater.current = m_gameUpdaterFactory();

		connection.Connection.on("message", (event: DataEvent) => {
			//check if gameUpdater is initialized
			const game_functions = game_updater.current;
			if (!game_functions) throw new Error("Game updater not initialized");
			const ids = game_functions.handleGameMessage(event.data);
			if (ids) uuid.current = ids;

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
				<Board spaces={spaces} decisions={decisions} iface={game_updater.current as ISource} />
			</div>

		</main>
	)

}

export default HomePage;
