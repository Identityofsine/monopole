export class MonopolyError extends Error {
	constructor(message: string) {
		super(`[MonopolyError] ${message}`);
		this.message = message;
		this.name = 'MonopolyError';
	}
}
