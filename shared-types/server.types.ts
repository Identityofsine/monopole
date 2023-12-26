import { DecisionType, MonopolyEngineCommands } from "./monopoly.types";

export type Intents = 'create' | 'join' | 'response' | 'command'
export type PlayerState = 'jail' | 'turn' | 'bankrupt' | 'idle' | 'paying'

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

export type Responses = 'connect' | 'join' | 'respond' | 'message' | 'id' | 'update' | 'error'

export type BaseResponse = {
	response: Responses;
	message?: string | Object;
	success: boolean
}

export type ErrorResponse = {
	success: false;
	response: 'error';
	message: string;
}

export type Recipient = 'global' | 'game' | 'player'

export type GameResponse = {
	response: 'message' | 'respond' | 'update';
	recipient: Recipient;
	decision?: DecisionType | DecisionType[];
} & BaseResponse
