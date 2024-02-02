/*
 * File: PopUpInput.tsx
 * Purpose: PopUpInput is a component file that handles various Popup objects 
 * that determine how the user will input data and be able to compile data for the server to read  
 *
 * Author : Kevin Erdogan
 * Created : 01/31/2024
 * Updated : 01/31/2024 01:28 
 */
import { DispatchWithResult } from "@/util/GameUpdater";
import { useEffect, useRef, useState } from "react";
import { ExpectedInput, ExpectedInputObject, ExpectedTradeInputObject, InputObject, RequiredInputDecision, isRequiredInputDecision } from "shared-types/server.input.types"


//typescript function thats going to go crazy...
type InputField = {
	type: string;
	label: string;
}

//recursive function to flatten array
function unnest<T>(arr: T[]): T[] {
	//base return array
	let return_arr: T[] = [];
	//if array is empty or not an array, return empty array
	if (arr.length === 0 || !Array.isArray(arr)) return [];

	//iterate through array
	for (let i = 0; i < arr.length; i++) {
		const value = arr[i] as T;
		if (Array.isArray(arr[i])) { //if value is an array, recursively call unnest
			unnest(value as T[]).forEach((val: T) => { //recursively call unnest, and then push result to return array
				return_arr.push(val);
			});
		} else {
			return_arr.push(arr[i]); //if value is not an array, push to return array
		}

	}
	return return_arr;
}

function matchInputType(type: RequiredInputDecision): InputObject {
	switch (type) {
		case 'trade': {
			return ExpectedTradeInputObject;
		}
		default: {
			return ExpectedInputObject;
		}
	}
}

function convert(input: RequiredInputDecision) {

	//recursive function to flatten object
	function helper(object: typeof ExpectedInputObject): InputField[] {
		const return_value = Object.keys(object).map(key => { //iterate through object, and map to array
			const value_obj = object[key as keyof typeof ExpectedInputObject];
			if (typeof value_obj === 'object') {
				return helper(value_obj); //if value is an object, recursively call helper
			}
			return {
				'label': key as string,
				'type': value_obj as 'toggle' | 'text' | 'number' | 'dropdown'
			}
		}) as InputField[];
		return unnest(return_value); //flatten array
	}

	return helper(matchInputType(input)); //return result of helper function
}

function parse(input: InputField, pushState: (state: PopupInputStateStorage) => void): JSX.Element {

	function extract_keywords(word: string): [string, string[]] {
		let lone_word = '';
		let args = [];
		let current_arg = '';
		let stack = [];
		for (let i = 0; i < word.length; i++) {
			const char = word[i];
			if (stack.length === 0) {
				if (char === '[') {
					stack.push('[');
					continue;
				}
				lone_word += char;
			} else {
				if (char === ']') {
					stack.pop();
					args.push(current_arg);
					current_arg = '';
					continue;
				}
				current_arg += char;
			}
		}
		return [lone_word, args];
	}

	const keyword = extract_keywords(input.type);

	switch (keyword[0]) {
		case 'string': {
			const [s_input, setInputState] = useState('');
			pushState({ [input.label]: s_input });
			return (<input type='text' placeholder={input.label} value={s_input} onChange={(e) => { setInputState(e.target.value) }} />)
		}
		case 'number': {
			const [n_input, setInputState] = useState(0);
			pushState({ [input.label]: n_input });
			return (<input type='number' placeholder={input.label} value={n_input} onChange={(e) => { setInputState(parseInt(e.target.value)) }} />)
		}
		case 'dropdown': {
			const [d_input, setInputState] = useState('');
			pushState({ [input.label]: d_input });
			return (<select value={d_input} onChange={(e) => { setInputState(e.target.value) }}>
				<option value='' disabled>Select an option</option>
				{keyword[1].map((option) => {
					return (<option value={option}>{option}</option>)
				})}
			</select>
			)
		}
		default: {
			return (<></>)
		}
	}
}

type PopUpInputProps = {
	input_style: RequiredInputDecision; //expected to be react state
	onInputCompiled: DispatchWithResult<ExpectedInput, void>;
}

type PopupInputStateStorage = {
	[key: string]: string | number | boolean;
}

export default function PopUpInput({ input_style, onInputCompiled }: PopUpInputProps) {

	const input_ref = useRef<InputField[]>(convert(input_style));
	const states = useRef<PopupInputStateStorage[]>([]);

	if (!isRequiredInputDecision(input_style)) {
		return (<></>)
	}

	function compile_data() {
		states.current.forEach((state) => {
			console.log(state);
		});
		return;
	}

	function pushState(state: PopupInputStateStorage) {
		if (states.current.length === 0) {
			states.current.push(state);
			return;
		}
		let idx = states.current.findIndex((s: PopupInputStateStorage) => {
			const keys = Object.keys(s);
			const state_keys = Object.keys(state);
			return keys.every((key) => {
				return state_keys.includes(key);
			});
		})
		if (idx !== -1) {
			states.current[idx] = state;
			return;
		}
		states.current.push(state);
	}

	return (
		<div className="flex column">
			{input_ref.current.map((input, index) => {
				return parse(input, pushState)
			})}
			<button onClick={() => { compile_data() }}>Submit</button>
		</div>
	)
}
