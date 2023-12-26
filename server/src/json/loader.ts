import * as fs from 'fs';
import { Go, Space, Street, CommunityChest, FreeParking, Chance, Tax, Railroad, Utility, GoToJail, Jail } from '../monopoly/space';
import { BuildingCommunicationLayer } from '../monopoly/monopoly';
// Purpose: Load objects from path

let cache = new Map<string, any>();

export function loadObjectFromPath<T>(path: string): T | null {
	//check if path exists
	if (!fs.existsSync(path)) {
		throw new Error(`Path ${path} does not exist`);
	}

	const file_content = fs.readFileSync(path, 'utf8');
	//convert to object
	const object = JSON.parse(file_content);
	return object as T;
}

/*
0 - go
1 - street
2 - community chest
3 - free parking
4 - chance
5 - tax
6 - railroad
7 - utility
8 - go to jail
9 - jail
 *
*/

export function castSpace(square_preobject: Space, buildingCommunicationLayer?: BuildingCommunicationLayer): Space {
	switch (square_preobject.type) {
		case 0: {
			return new Go();
		}
		case 1: {
			const street = square_preobject as Street;
			return new Street(street.id, street.name, street.price, street.rent, street.color);
		}
		case 2: {
			const community_chest = square_preobject as CommunityChest;
			return new CommunityChest(community_chest.id);
		}
		case 3: {
			return new FreeParking();
		}
		case 4: {
			const chance = square_preobject as Chance;
			return new Chance(chance.id);
		}
		case 5: {
			const tax = square_preobject as Tax;
			return new Tax(tax.id, tax.name, tax.amount);
		}
		case 6: {
			const railroad = square_preobject as Railroad;
			return new Railroad(railroad.id, railroad.name, railroad.price, railroad.rent);
		}
		case 7: {
			const utility = square_preobject as Utility;
			return new Utility(utility.id, utility.name, utility.price, utility.rent);
		}
		case 8: {
			return new GoToJail();
		}
		case 9: {
			return new Jail();
		}
	}
	return square_preobject;
}


export function cachePath<T>(path: string): T {
	if (!cache.has(path)) {
		const object = loadObjectFromPath(path);
		cache.set(path, object);
	}

	return cache.get(path) as T;
}
