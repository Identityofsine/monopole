import { Player, Space } from "./monopoly.types";

//various inputs that are expected from the client
export type RequiredInputDecision = 'trade' | 'mortgage' | 'unmortgage' | 'build' | 'demolish';

export function isRequiredInputDecision(input: string): input is RequiredInputDecision {
	return ['trade', 'mortgage', 'unmortgage', 'build', 'demolish'].includes(input);
}

type UUID = string;

//Trade Object
export type Trade = {
	source: Player;
	offer: {
		money: number;
		properties: Space[];
	};
};


//expected input for certian decisions : can be identified by string
export type ExpectedInput = {
	'decision': RequiredInputDecision;
	'data': object
}

//expected input for certian decisions
export type ExpectedTradeInput = {
	data: {
		source: UUID;
		dest: UUID;
		offer: Trade;
	}
} & ExpectedInput;

//expected input for certian decisions
export type ExpectedBuildInput = {
	data: {
		space: UUID;
		buildings: number;
	}[]
} & ExpectedInput;


//frontend stuff that allows the frontend to understand what is expected
export type InputObject = {
	[string: string]: any
}
export const ExpectedInputObject: InputObject = {
	'decision': 'string',
	'data': {
		'sex': 'string',
		'age': 'number',
		'location': { 'lat': 'number', 'long': 'number' }
	}
}



