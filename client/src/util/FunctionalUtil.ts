/**
	* Author: Kevin Erdogan
	* Date: 02/13/2024
	* Description: This file contains the functional utility functions; these functions will not mutate any of the input.
	*
	*
	*/

import { Color } from "@/app/components/board/types";
import { Space, UUID } from "shared-types";

export namespace Functional {
	export function getSpaceByColor(spaces: Space[], color: Color): Space[] {
		return spaces.filter((space) => space?.color?.hex === color.hex);
	}

	export function getSpaceSetOwnedByPlayer(spaces: Space[], player_id: UUID.UUID): Space[] {
		type SpaceSet = {
			color: Color;
			spaces: Space[];
		}

		function pushToSet(set: SpaceSet[], space: Space) {
			const color = space.color;
			if (!color) return;
			const set_index = set.findIndex((set) => set.color.hex === color.hex);
			if (set_index === -1) {
				set.push({
					color: color,
					spaces: [space]
				});
			} else {
				set[set_index].spaces.push(space);
			}
		}

		let sets: SpaceSet[] = [];

		for (let i = 0; i < spaces.length; i++) {
			const space = spaces[i];
			if (space.color) {
				(pushToSet(sets, space));
			} else {
				continue;
			}
		}

		//go over and remove anything that does not meet max
		for (let i = 0; i < sets.length; i++) {
			const set = sets[i];
			const max = set.color.max;
			if (max && set.spaces.length !== max) {
				sets.splice(i, 1);
				i--;
			}
		}

		console.log(sets);
		return sets.map((set) => set.spaces).flat();
	}

}
