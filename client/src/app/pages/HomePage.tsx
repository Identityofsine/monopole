'use client';
import styles from '../page.module.css'
import '../style.scss';
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useRef, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import RowOrganizer from '../components/board/RowOrganizer';
import { BaseIntent, BaseResponse, DecisionType, GameResponse, Identifiable, Player, Space, UUID } from 'shared-types';
import { GameHandler, GameState, GameUpdater, ISource, SpaceHandle } from '@/util/GameUpdater';
import PopUp from '../components/popup/PopUp';
import UsePopUp, { UsePopUpInput } from '@/hooks/UsePopUp';
import Board from '../components/board/Board';
import { ConnectionInterface } from '@/obj/connection';
import Alert, { AlertFunction, AlertIcon } from '../components/alert/Alert';
import PopUpInput, { IPopUpInput } from '../components/popup/PopUpInput';
import { ExpectedInput, RequiredInputDecision } from 'shared-types/server.input.types';
import dynamic from 'next/dynamic';


export type PlayerHoldableSpace = Space & {
	players: Player[];
}

export type GameID = {
	game_uuid: UUID.UUID,
	host_uuid: UUID.UUID,
	player_uuid: UUID.UUID,
}

export interface ICClient extends ConnectionInterface {
	askPlayer(tree: DecisionType[]): void;
	getID(): GameID;
	getPlayer(id: UUID.UUID): Player | undefined;
	alert: AlertFunction;
}


function HomePage() {

	//wss://fofx.zip/mserver/
	const connection = useConnectionObject("ws://localhost:8337/");
	const DynamicReactJson = dynamic(import('react-json-view'), { ssr: false });

	//debug
	const [text, setText] = useState<object[]>([]);

	//uuid stuff
	const uuid = useRef<GameID>({ game_uuid: "", player_uuid: "", host_uuid: "" });
	const [spaces, setSpaces] = useState<PlayerHoldableSpace[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);
	const [player_in_turn, setPlayerInTurn] = useState<UUID.UUID>("");

	//gamestate
	const [gamestate, setGamestate] = useState<GameState>("INACTIVE");
	const gamestate_ref = useRef<GameState>(gamestate);


	//popup_input state
	const [popup_input_state, setPopupInputState] = useState<RequiredInputDecision | ''>('');

	//popup window.
	const popup = (UsePopUp(true));
	const popup_input = (UsePopUpInput(false, () => setPopupInputState('')));
	//alert window
	const alert = Alert();

	//temp state storage
	const [name, setName] = useState<string>("");
	const [game_id, setGameID] = useState<UUID.UUID>("");

	//decisions
	const [decisions, setDecisions] = useState<DecisionType[]>([]);


	useEffect(() => {
		if (popup_input_state === '') return;
		popup_input.open();
	}, [popup_input_state]);


	const game_updater = useRef<GameUpdater>();

	function open_popup_input(type: RequiredInputDecision) {
		setPopupInputState(type);
	}

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
		}, { getState: (() => { return gamestate_ref.current; }).bind(gamestate_ref), setState: setGamestate }, { getState: () => spaces, setState: setSpaces }, { getState: () => players, setState: setPlayers }, { getState: () => player_in_turn, setState: setPlayerInTurn })
	}

	function IPopUpFactory(): IPopUpInput {
		return {
			getPlayers: () => players,
			getThisPlayer: () => getPlayer(uuid.current.player_uuid) as Player,
			getSpacesByPlayer: (player: Player) => {
				return spaces.filter((space) => {
					return space?._owner === (player?.uuid ?? '0000');
				});
			},
			getSpaces: (...ids: UUID.UUID[]) => {
				return spaces.filter((space) => ids.includes(space.uuid));
			}
		}
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

			<popup_input.element input_style={popup_input_state} onInputCompiled={(decision: DecisionType, input: ExpectedInput) => {
				game_updater.current?.sendDecision(decision, input)
			}} iface={IPopUpFactory()} />

			<div className={styles.description}>
				<p>
					<DynamicReactJson src={text} theme="monokai" collapsed={true} />
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
							onClick={() => open_popup_input('trade')}
						>
							Trade
						</span>
						<span
							style={{ fontSize: '.2rem' }}
							onClick={() => open_popup_input('build')}
						>
							Build
						</span>

						<span
							style={{ fontSize: '.2rem' }}
							onClick={() => copyToClipboard(uuid.current.game_uuid)}
						>
							Copy Game ID
						</span>
					</div>
				}
				<Board spaces={spaces} decisions={decisions} inTurn={player_in_turn} iface={game_updater.current as ISource} main_player={uuid.current.player_uuid} />
			</div>

		</main>
	)

}

export default HomePage;
