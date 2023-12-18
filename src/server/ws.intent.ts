export type ConnectionIntent = {
	intent: 'create' | 'join'
	name: string
	game_uuid?: string
	uuid?: string

}
