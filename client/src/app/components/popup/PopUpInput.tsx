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
import { UUID } from "crypto";
import { useEffect, useRef, useState } from "react";
import { Player, Space } from "shared-types";
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
				return { label: key, type: helper(value_obj) }; //if value is an object, recursively call helper
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

type ParseKeywordObject = {
	category: string;
	value: ParseKeywordReturn;
}
type ParseKeywordReturn = { label: string, parsed: [string, string[], ParseFlag?][] };

function condense_jsx_array(arr: JSX.Element[]): JSX.Element {
	if (arr.length === 0) return <></>;
	if (arr.length === 1) return arr[0];
	return (
		<>
			{arr}
		</>
	)
}

enum ParseFlag {
	NOTHING = 0x00,
	SELF_FILL = 0x01,
	IGNORE_SELF = 0x02,
	ONLY_TARGET = 0x04,
}

function parse(input: InputField, pushState: (state: PopupInputStateStorage) => void, iface?: IPopUpInput): JSX.Element {


	function extract_keywords(word: string, category?: string): ParseKeywordObject | ParseKeywordObject[] {
		let lone_word = '';
		let args: string[] = [];
		let current_arg = '';
		let stack = [];
		let flag: ParseFlag = 0x00;
		if (!word) return { category: '', value: { label: '', parsed: [[lone_word, args, flag]] } };
		if (typeof word === 'object') {
			const word_mutate = word as InputField[];
			const keywords = word_mutate.map((input) => {
				//check if type is an array/object
				const new_category = typeof input.type === 'object' ? input.label : category;
				let copy = extract_keywords(input.type, new_category) as ParseKeywordObject;
				if (copy.value) {
					copy.value.label = input.label;
				}
				return copy;
			});
			return keywords;
		}

		for (let i = 0; i < word.length; i++) {
			const char = word[i];
			if (char.at(0) === '&') {
				flag |= 0x01;
				continue;
			} else if (char.at(0) === '!') {
				flag |= 0x02;
				continue;
			} else if (char.at(0) === '^') {
				flag |= 0x04;
				continue;
			}
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
		return { category: category ?? '', value: { label: category ?? '', parsed: [[lone_word, args, flag]] } };
	}

	type Sections = {
		name: string;
		elements: JSX.Element[];
	}

	//section storage
	let sections: Sections[] = [];
	function create_section(name: string) {
		if (!sections.find((section) => section.name === name)) {
			sections.push({ name: name, elements: [] });
		}
		return get_section(name);
	}

	function get_section(name: string) {
		return sections.find((section) => section.name === name);
	}

	function push_to_section(name: string, element: JSX.Element) {
		const section = create_section(name);

		if (section) section.elements.push(element);
	}

	function compile_sections(): JSX.Element {
		return condense_jsx_array(sections.map((section) => {
			return (
				<div className="flex column" style={{ gap: '.1rem' }}>
					<h3 className="section-title" style={{ margin: '0', padding: '0', fontSize: '.4rem' }}>{section.name}</h3> {/* TODO: MOVE INTO A SCSS FILE */}
					{condense_jsx_array(section.elements)}
				</div>
			)
		}));
	}


	function compile_input(parsed_obj: ParseKeywordObject): boolean {
		if (!parsed_obj?.value || !parsed_obj?.value?.parsed) return (false);
		const label = parsed_obj.value.label;
		const parsed = parsed_obj.value.parsed;
		const category = parsed_obj.category;

		function combine_react_element(new_elem: JSX.Element) {
			push_to_section(category, new_elem);
		}
		function craft_div(children: JSX.Element) {
			return (
				<div className="flex ">
					{children}
				</div>
			)
		}

		for (let i = 0; i < parsed.length; i++) {
			const word = parsed[i];
			const type: string = word[0];
			const args: string[] = word[1];
			const flag: ParseFlag = word[2] ?? 0x00;
			switch (type) {
				case 'string': {
					const [s_input, setInputState] = useState(args[0] ?? '');
					pushState({ [label]: s_input });
					combine_react_element(
						craft_div(
							<>
								<label style={{ fontSize: 'small' }}>{label}: </label>
								{flag ? <input type='text' placeholder={label} value={s_input} onChange={(e) => { setInputState(e.target.value) }} disabled /> : <input type='text' placeholder={label} value={s_input} onChange={(e) => { setInputState(e.target.value) }} />}
							</>
						)
					)
					break;
				}
				case 'number': {
					const [n_input, setInputState] = useState(0);
					pushState({ [label]: n_input });
					combine_react_element(
						craft_div(
							<>
								<label style={{ fontSize: 'small' }}>{label}: </label>
								<input type='number' placeholder={label} value={n_input} onChange={(e) => { setInputState(parseInt(e.target.value)) }} />
							</>
						)
					)
					break;
				}
				case 'dropdown': {
					const auto_fill = flag === ParseFlag.SELF_FILL;
					const ignore_self = flag === ParseFlag.IGNORE_SELF;
					const [d_input, setInputState] = useState(auto_fill ? iface?.getThisPlayer()?.uuid ?? '' : '');
					useEffect(() => {
						if (!iface || d_input !== '') return;
						setInputState(auto_fill ? iface?.getThisPlayer()?.uuid ?? '' : '');
						return () => { }
					}, [iface])
					pushState({ [label]: d_input });
					combine_react_element(
						craft_div(
							<>
								<label style={{ fontSize: 'small' }}>{label}: </label>
								<select value={d_input} onChange={(e) => { setInputState(e.target.value) }} disabled={auto_fill}>
									<option value='' disabled>Select an option</option>
									{args[0] === 'player' ?
										iface?.getPlayers().map((option) => {
											if (ignore_self && option.uuid === iface?.getThisPlayer()?.uuid) return;
											return (<option value={option.uuid}>{option.name}</option>)
										})
										: args[0] === 'space' ?
											iface?.getSpacesByPlayer(iface.getThisPlayer()).map((option) => {
												return (<option value={option.uuid}>{option.name}</option>)
											})
											: args.map((option) => {
												return (<option value={option}>{option}</option>)
											})}
								</select>
							</>
						)
					)
					break;
				}
				default: {
					return false;
				}
			}
		}
		return true;
	}

	//return result of display_input
	let keyword = extract_keywords(input.type, input.label);
	if (Array.isArray(keyword)) {
		keyword = unnest(keyword);
	} else {
		keyword = [keyword];
	}
	keyword.forEach((word) => {
		compile_input(word);
	});

	return compile_sections();

}

type PopUpInputProps = {
	input_style: RequiredInputDecision; //expected to be react state
	onInputCompiled: DispatchWithResult<ExpectedInput, void>;
	iface?: IPopUpInput;
}

type PopupInputStateStorage = {
	[key: string]: string | number | boolean;
}

export interface IPopUpInput {
	getThisPlayer(): Player;
	getPlayers(): Player[];
	getSpacesByPlayer(player: Player): Space[];
	getSpaces(...spaces: UUID[]): Space[]
}

export default function PopUpInput({ input_style, onInputCompiled, iface }: PopUpInputProps) {

	const input_ref = useRef<InputField[]>(convert(input_style));
	const states = useRef<PopupInputStateStorage[]>([]);

	if (!isRequiredInputDecision(input_style)) {
		return (<></>)
	}

	function compile_data() {

		let output: ExpectedInput = { decision: input_style, data: {} as any } as ExpectedInput;
		function compile_trade(keys: string[], current_state: PopupInputStateStorage) {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				switch (key) {
					case 'source': {
						output.data = {
							source: current_state[key] as string,
							...output.data ?? {}
						};
						break;
					}
					case 'dest': {
						output.data = {
							dest: current_state[key] as string,
							...output.data ?? {}
						};
						break;
					}
					case 't_money': {
						output.data.offer = {
							money: current_state[key] as number,
							...output.data?.offer ?? {}
						};
						break;
					}
					case 't_spaces': {
						output.data.offer = {
							properties: current_state[key],
							...output.data?.offer ?? {}
						};
						break;
					}
					case 'r_money': {
						output.data.request = {
							money: current_state[key] as number,
							...output.data?.request ?? {}
						};
						break;
					}
					case 'r_spaces': {
						output.data.request = {
							properties: current_state[key],
							...output.data?.request ?? {}
						};
						break;
					}
					default: {
						break;
					}
				}
			}
		}

		for (let i = 0; i < states.current.length; i++) {
			const state = states.current[i];
			const keys = Object.keys(state) as string[];
			if (input_style === 'trade') compile_trade(keys, state);
		}

		onInputCompiled(output);
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
				return parse(input, pushState, iface)
			})}
			<button onClick={() => { compile_data() }}>Submit</button>
		</div>
	)
}
