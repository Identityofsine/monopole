export class EventError extends Error {

	private readonly errorlogmessage: string;

	constructor(message: string, source: string) {
		super(message);
		this.name = "[EventError: " + source + "]";
		this.errorlogmessage = `${this.name}: ${message}`;
	}

	public print() {
		console.error(this.errorlogmessage);
	}

	public printAndStackTrace() {
		console.trace(this);
	}
}
