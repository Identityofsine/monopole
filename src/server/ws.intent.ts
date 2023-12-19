import { DecisionType } from "../monopoly/monopoly.types"

export type Intents = 'create' | 'join' | 'response'

export type BaseIntent = {
	intent: Intents
	name: string
	uuid?: string
	game_uuid?: string
}

export type ConnectionIntent = {
	intent: 'create' | 'join'
} & BaseIntent

export type ResponseIntent = {
	intent: 'response'
	decision: DecisionType
} & BaseIntent

export type Responses = 'connect' | 'join' | 'respond' | 'message' | 'id' | 'update'

export type BaseResponse = {
	response: Responses;
	message?: string | Object;
	success: boolean
}

export type GameResponse = {
	response: 'message' | 'respond' | 'update';
	decision?: DecisionType | DecisionType[];
} & BaseResponse
