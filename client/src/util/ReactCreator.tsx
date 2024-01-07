export type ExpectedReturnType<R extends any> = (...args: any[]) => R;

export function ReactGenerateSingle(component: ExpectedReturnType<JSX.Element>, props: object) {
	return component(props);
}

export function ReactGenerateMultiple<Props extends object = {}>(component: ExpectedReturnType<JSX.Element>, props: Props[] | Props, length: number) {
	if (Array.isArray(props)) {
		if (length !== props.length) throw new Error('Length of components and props must be equal');
	} else {
		props = Array(length).fill(props);
	}
	return (props as object[]).map((prop, _idx) => component(prop));
}
