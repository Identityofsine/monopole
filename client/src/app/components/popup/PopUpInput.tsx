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

function convert(input: RequiredInputDecision) {

	function helper(object: typeof ExpectedInputObject): InputField[] {
		const return_value = Object.keys(object).map(key => {
			return {
				'type': 'text',
				'label': object?.[key as string]
			}
		}) as InputField[];
		return return_value;
	}

	return helper(ExpectedInputObject);
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
