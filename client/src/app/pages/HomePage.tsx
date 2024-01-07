'use client';
import styles from '../page.module.css'
import useConnectionObject from '@/hooks/ConnectionObject';
import { useEffect, useState } from 'react';
import { DataEvent, ErrorEvent } from '@/interface/events';
import ReactJson from 'react-json-view';
import RowOrganizer from '../components/board/RowOrganizer';

function HomePage() {

	const connection = useConnectionObject("ws://localhost:8337/");
	const [text, setText] = useState<object[]>([]);

	useEffect(() => {
		if (!connection) return;
		connection.Connection.on("message", (event: DataEvent) => {
			setText((old_text) => {
				return [...old_text, event.data];
			});
		});
		connection.Connection.on('error', (error: ErrorEvent) => {
			setText((old_text) => {
				return [...old_text, [error.error.message]];
			})
		});
	}, [connection])

	return (
		<main className={styles.container} >

			<div className={styles.description}>
				<p>
					<ReactJson src={text} theme="monokai" collapsed={true} />
				</p>
				<div>
				</div>
			</div>

			<div className={styles.center}>
				<RowOrganizer row_height={20} rows={4} spaces={[]} />
			</div>

		</main>
	)

}

export default HomePage;
