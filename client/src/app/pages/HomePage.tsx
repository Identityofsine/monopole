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
import Alert, { AlertFunction, AlertIcon } from '../components/alert/Alert';
import PopUpInput from '../components/popup/PopUpInput';
import { ExpectedInput } from 'shared-types/server.input.types';


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
	getPlayer(id: UUID.UUID): Player | undefined;
	alert: AlertFunction;
}


function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");

	//debug
	const [text, setText] = useState<object[]>([]);

	//uuid stuff
	const uuid = useRef<GameID>({ game_uuid: "", player_uuid: "", host_uuid: "" });
	const [spaces, setSpaces] = useState<PlayerHoldableSpace[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);

	//gamestate
	const [gamestate, setGamestate] = useState<GameState>("INACTIVE");
	const gamestate_ref = useRef<GameState>(gamestate);

	//popup window.
	const popup = (UsePopUp(true));
	//alert window
	const alert = Alert();

	//temp state storage
	const [name, setName] = useState<string>("");
	const [game_id, setGameID] = useState<UUID.UUID>("");

	//decisions
	const [decisions, setDecisions] = useState<DecisionType[]>([]);


	const game_updater = useRef<GameUpdater>();

	function copyToClipboard(value: string) {
		navigator.clipboard.writeText(value);
	}

	function joinGame(uuid?: UUID.UUID) {
		connection?.connect(name, uuid);
		setGamestate("WAITING");
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
			},
			getPlayer: getPlayer,
			alert: alert.throwFunction.bind(alert)
		}, { getState: (() => { return gamestate_ref.current; }).bind(gamestate_ref), setState: setGamestate }, { getState: () => spaces, setState: setSpaces }, { getState: () => players, setState: setPlayers })
	}

	function getPlayer(id: UUID.UUID): Player | undefined {
		return players?.find((player) => player.uuid === id);
	}

	useEffect(() => {
		gamestate_ref.current = gamestate;
	}, [gamestate])

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

			<PopUpInput input_style="trade" onInputCompiled={(input: ExpectedInput) => { return; }} />
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
						<input key="input2" type="text" onChange={(e) => setName(e.target.value)} value={name} placeholder="Player Name" />
						<button onClick={() => { joinGame(game_id) }}>Join</button>
					</div>
					<div className="flex column">
						<h2>Create Game</h2>
						<input type="text" onChange={(e) => setName(e.target.value)} value={name} placeholder="Player Name" />
						<button onClick={() => { joinGame() }}>Create</button>
					</div>
				</div>
			</popup.element>

			{gamestate === 'INACTIVE' &&
				<div>
					<span onClick={() => popup.open()}>Join Game</span>
				</div>
			}
			<alert.element key="alert" />
			<div className={styles.center}>
				{gamestate !== 'INACTIVE' &&
					<div className="flex space-between fill-container align-bottom">
						<span>Money:{getPlayer(uuid.current.player_uuid)?.money}</span>
						<span
							style={{ fontSize: '.2rem' }}
							onClick={() => copyToClipboard(uuid.current.game_uuid)}
						>
							Copy Game ID
						</span>
					</div>
				}
				<Board spaces={spaces} decisions={decisions} iface={game_updater.current as ISource} />
			</div>

		</main>
	)

}

export default HomePage;
