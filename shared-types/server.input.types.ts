import { Player, Space } from "./monopoly.types";

//various inputs that are expected from the client
export type RequiredInputDecision = 'trade' | 'mortgage' | 'unmortgage' | 'build' | 'demolish';

export function isRequiredInputDecision(input: string): input is RequiredInputDecision {
	return ['trade', 'mortgage', 'unmortgage', 'build', 'demolish'].includes(input);
}

type UUID = string;

//Trade Object
export type Trade = {
	money: number;
	properties: UUID[];
};


//expected input for certian decisions : can be identified by string
export type ExpectedInput = {
	'decision': RequiredInputDecision;
	'data': any;
}

//expected input for certian decisions
export type ExpectedTradeInput = {
	data: {
		source: UUID;
		dest: UUID;
		offer: Trade;
		request: Trade;
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
	'data': {}
}

export const ExpectedTradeInputObject: InputObject = {
	'decision': '&string[trade]',
	'data': {
		'offer': {
			'source': '&dropdown[player]',
			'dest': '!dropdown[player]',
			'offering': {
				't_money': 'number',
				't_spaces': 'dropdown[space]',
			},
			'request': {
				'r_money': 'number',
				'r_spaces': '^dropdown[space]',
			}
		}
	}
}



