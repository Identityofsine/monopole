'use client';

import { ConnectionHandler } from "@/obj/connectionmanager";
import { WebSocketConnection } from "@/obj/listener";
import { useEffect, useRef } from "react";

type Props = {
	uri: string;
}

function useConnectionObject(uri: string) {

	const ref = useRef<ConnectionHandler>();

	useEffect(() => {
		if (ref.current) return;
		ref.current = new ConnectionHandler(new WebSocketConnection(uri));
	}, [ref.current])

	return ref.current;

}

export default useConnectionObject;
