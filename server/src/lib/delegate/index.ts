export type DelegateExpectedFunction<R, A> = (args: A) => Promise<R> | R;

export default class Delegate<R, A> {

	private _functions: Array<DelegateExpectedFunction<R, A>> = [];


	constructor() {
	}


	public async invoke(args: A) {
		const results = await Promise.all(this._functions.map(async func => await func(args)));
		return results;
	}

	public async add(func: DelegateExpectedFunction<R, A>) {
		this._functions.push(func);
	}

	public async remove(func: DelegateExpectedFunction<R, A>) {
		this._functions = this._functions.filter(f => f !== func);
	}

}
