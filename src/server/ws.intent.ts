export type Intents = 'create' | 'join' | 'respond'

export type BaseIntent = {
	intent: Intents
	name: string
	uuid?: string
	game_uuid?: string
}

export type ConnectionIntent = {
	intent: 'create' | 'join'
} & BaseIntent

export type Responses = 'connect' | 'join' | 'respond' | 'message'

export type BaseResponse = {
	response: Responses;
	message?: string;
	success: boolean
}
