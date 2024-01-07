export namespace UUID {

	export type UUID = string;

	export function generateUUID(seed: number): UUID {
		return 'xxxxxxxx-xxxx-qxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
			//generate random number based on seed and convert to hex
			const r = Math.floor((seed + Math.random() * 16) % 16);
			seed = Math.floor(seed / 16);
			//replace x with random hex digit
			if (c === 'x') {
				return r.toString(16);
			}
			return '';
		});

	}
}

export class Identifiable {
	protected uuid: UUID.UUID = UUID.generateUUID(5323);
	public name: string;
	constructor(name: string, uuid?: UUID.UUID) {
		this.name = name;
		if (uuid) {
			this.uuid = uuid;
		}
	}
	public get UUID(): UUID.UUID {
		return this.uuid;
	}
	public get Name(): string {
		return this.name;
	}

}
