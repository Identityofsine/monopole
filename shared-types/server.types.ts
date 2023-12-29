import { DecisionType, MonopolyEngineCommands } from "./monopoly.types";

export type Intents = 'create' | 'join' | 'response' | 'command'
export type PlayerState = 'jail' | 'turn' | 'bankrupt' | 'idle' | 'paying'

/* Player Sending Message */
export type BaseIntent = {
	intent: Intents
	name: string
	uuid?: string
	game_uuid?: string
}

export type ConnectionIntent = {
	intent: 'create' | 'join'
} & BaseIntent

//must be the host
export type CommandIntent = {
	intent: 'command'
	command: MonopolyEngineCommands
} & Required<BaseIntent>

export type ResponseIntent = {
	intent: 'response'
	state: PlayerState
	decision: DecisionType
} & BaseIntent

/* Server Sending Message */
export type Responses = 'connect' | 'join' | 'respond' | 'message' | 'id' | 'update' | 'error'


//BaseResponse is the response that the server sends to the client, all responses that the server may send inherit from this
export type BaseResponse = {
	response: Responses;
	message?: string | Object;
	success: boolean
}

//ErrorResponse is the only response that the server sends that does not inherit from BaseResponse
export type ErrorResponse = {
	success: false;
	response: 'error';
	message: string;
}

/**
 * 'global' = everyone in the game
 * 'game' = TBD
 * 'player' = only to one (or more) player(s) but not global 
 */
export type Recipient = 'global' | 'game' | 'player'


/**
 * @summary {GameResponse is a type that the server sends to the client for game updates and decisions.}
 * @param {response} {The type of response that the server is sending, 'message' is a general message, 'respond' is a decision that the player must make(and respond to), 'update' is a game update; used for UI purposes}
 * @param {recipient} {See Recipient}
 * @param {decision} {The decision that the player must make, if the response is 'respond'}
 */
export type GameResponse = {
	response: 'message' | 'respond' | 'update';
	recipient: Recipient;
	decision?: DecisionType | DecisionType[];
} & BaseResponse
