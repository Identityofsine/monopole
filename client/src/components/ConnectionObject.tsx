'use client';

import { ConnectionHandler } from "@/obj/connectionmanager";
import { WebSocketConnection } from "@/obj/listener";
import { useEffect, useState } from "react";

function useConnectionObject(uri: string) {

	const [connection, setConnectionObject] = useState<ConnectionHandler | null>(null);

	useEffect(() => {
		if (connection) return;
		const ws_connect = new WebSocketConnection(uri);
		const _connection = new ConnectionHandler(ws_connect);
		setConnectionObject(_connection);

	}, [])

	return connection;

}

export default useConnectionObject;
