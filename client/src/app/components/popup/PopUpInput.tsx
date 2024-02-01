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
import { ExpectedInput, ExpectedInputObject, RequiredInputDecision, isRequiredInputDecision } from "shared-types/server.input.types"


//typescript function thats going to go crazy...
type InputField = {
	type: 'toggle' | 'text' | 'number' | 'dropdown'
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

	return helper(ExpectedInputObject); //return result of helper function
}

type PopUpInputProps = {
	input_style: RequiredInputDecision; //expected to be react state
	onInputCompiled: DispatchWithResult<ExpectedInput, void>;
}

export default function PopUpInput({ input_style, onInputCompiled }: PopUpInputProps) {

	if (!isRequiredInputDecision(input_style)) {
		return (<></>)
	}

	function compile_data() {
		return;
	}


	console.log(convert(input_style))


	return (<></>)
}
