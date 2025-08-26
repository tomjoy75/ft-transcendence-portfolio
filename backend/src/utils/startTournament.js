export async function startTournament(db, tournamentId) {
	const tournament = await db.get(`
		SELECT * FROM tournaments
		WHERE id = ? AND is_deleted = 0
	`, [tournamentId]);

	if (!tournament) throw new Error('Tournament not found or has been deleted');

	const players = await db.all(`
		SELECT user_id FROM tournament_players
		WHERE tournament_id = ?
		ORDER BY id ASC
	`, [tournamentId]);

	if (players.length < 2) throw new Error('Not enough players');

	const totalPlayers = players.length;
	const totalRounds = Math.ceil(Math.log2(totalPlayers));
	const fullBracketSize = 2 ** totalRounds;
	const byes = fullBracketSize - totalPlayers;

	const playerQueue = players.map(p => p.user_id);
	for (let i = 0; i < byes; i++) playerQueue.push(null);

	const allMatches = [];
	let previousRound = [];

	let matchPosition = 0;

	for (let i = 0; i < playerQueue.length; i += 2) {
		const player1 = playerQueue[i] ?? null;
		const player2 = playerQueue[i + 1] ?? null;

		if (player1 === null && player2 === null) continue;

		const match = {
			id: null,
			player1_id: player1,
			player2_id: player2,
			winner_id: null,
			player1_score: null,
			player2_score: null,
			tournament_id: tournamentId,
			round: 1,
			position: matchPosition++,
			parent_match1_id: null,
			parent_match2_id: null,
		};

		const result = await db.run(`
			INSERT INTO matches (
				player1_id, player2_id, winner_id,
				player1_score, player2_score,
				tournament_id, round, position,
				parent_match1_id, parent_match2_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, [
			match.player1_id,
			match.player2_id,
			null,
			null,
			null,
			match.tournament_id,
			match.round,
			match.position,
			null,
			null,
		]);

		match.id = result.lastID;
		allMatches.push(match);
		previousRound.push(match);
	}

	for (let round = 2; round <= totalRounds; round++) {
		const currentRound = [];

		for (let i = 0; i < previousRound.length; i += 2) {
			const parent1 = previousRound[i] ?? null;
			const parent2 = previousRound[i + 1] ?? null;

			if (!parent1 && !parent2) continue;

			const match = {
				id: null,
				player1_id: null,
				player2_id: null,
				winner_id: null,
				player1_score: null,
				player2_score: null,
				tournament_id: tournamentId,
				round,
				position: i / 2,
				parent_match1_id: parent1?.id ?? null,
				parent_match2_id: parent2?.id ?? null,
			};

			const result = await db.run(`
				INSERT INTO matches (
					player1_id, player2_id, winner_id,
					player1_score, player2_score,
					tournament_id, round, position,
					parent_match1_id, parent_match2_id
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`, [
				null,
				null,
				null,
				null,
				null,
				match.tournament_id,
				match.round,
				match.position,
				match.parent_match1_id,
				match.parent_match2_id,
			]);

			match.id = result.lastID;
			allMatches.push(match);
			currentRound.push(match);
		}

		previousRound = currentRound;
	}

	await autoAdvanceByes(db, tournamentId);
	await advanceIfThree(db, tournamentId);

	console.log(`Tournament #${tournamentId} bracket successfully generated`);
}




async function autoAdvanceByes(db, tournamentId) {
	const count = await db.get(
		`SELECT COUNT(*) AS count FROM tournament_players WHERE tournament_id = ?`,
		[tournamentId]
	);

	if (count?.count === 3) return;

	const matches = await db.all(`
		SELECT * FROM matches
		WHERE tournament_id = ?
		ORDER BY round ASC, position ASC
	`, [tournamentId]);

	const matchesById = new Map();
	for (const match of matches) {
		matchesById.set(match.id, match);
	}

	let changed = true;
	while (changed) {
		changed = false;

		for (const match of matches) {
			if (match.winner_id !== null && match.is_bye !== 1) continue;

			const hasP1 = match.player1_id !== null;
			const hasP2 = match.player2_id !== null;

			if (!hasP1 && !hasP2) {
				const parent1 = match.parent_match1_id ? matchesById.get(match.parent_match1_id) : null;
				const parent2 = match.parent_match2_id ? matchesById.get(match.parent_match2_id) : null;

				const parent1Done = !parent1 || parent1.winner_id !== null || parent1.is_bye === 1;
				const parent2Done = !parent2 || parent2.winner_id !== null || parent2.is_bye === 1;

				if (!parent1Done || !parent2Done) continue;

				if (match.is_bye !== 1) {
					await db.run(`UPDATE matches SET is_bye = 1, winner_id = NULL WHERE id = ?`, [match.id]);
					match.is_bye = 1;
					matchesById.set(match.id, match);
					changed = true;
				}
				continue;
			}

				if ((hasP1 || hasP2) && !(hasP1 && hasP2)) {
					const winnerId = match.player1_id ?? match.player2_id;

					const parentMatchId = match.player1_id === null ? match.parent_match1_id : match.parent_match2_id;
					const parentMatch = parentMatchId ? matchesById.get(parentMatchId) : null;

					const parentNotDone = parentMatch && parentMatch.winner_id === null && parentMatch.is_bye !== 1;

					if (parentNotDone) continue;

					if (match.is_bye !== 1 || match.winner_id !== winnerId) {
						await db.run(`
							UPDATE matches SET is_bye = 1, winner_id = ? WHERE id = ?
						`, [winnerId, match.id]);
						match.is_bye = 1;
						match.winner_id = winnerId;
						matchesById.set(match.id, match);
						changed = true;
					}


				for (const m of matches) {
					const isFromP1 = m.parent_match1_id === match.id;
					const isFromP2 = m.parent_match2_id === match.id;

					if (isFromP1 && m.player1_id !== winnerId) {
						await db.run(`UPDATE matches SET player1_id = ? WHERE id = ?`, [winnerId, m.id]);
						m.player1_id = winnerId;
						matchesById.set(m.id, m);
						changed = true;
					}

					if (isFromP2 && m.player2_id !== winnerId) {
						await db.run(`UPDATE matches SET player2_id = ? WHERE id = ?`, [winnerId, m.id]);
						m.player2_id = winnerId;
						matchesById.set(m.id, m);
						changed = true;
					}
				}
			}
		}
	}
}



async function advanceIfThree(db, tournamentId) {
  const players = await db.all(`SELECT user_id FROM tournament_players WHERE tournament_id = ?`, [tournamentId]);

  if (players.length !== 3) return;

  const finalMatches = await db.all(`SELECT * FROM matches WHERE tournament_id = ? AND round = 2`, [tournamentId]);
  if (finalMatches.length !== 1) return;

  const finalMatch = finalMatches[0];

  const secondMatch = await db.get(`SELECT * FROM matches WHERE tournament_id = ? AND round = 1 AND position = 1`, [tournamentId]);
  if (!secondMatch) return;

  if (secondMatch.player1_id !== null && secondMatch.player2_id === null) {
    await db.run(`UPDATE matches SET player2_id = ? WHERE id = ?`, [secondMatch.player1_id, finalMatch.id]);
    await db.run(`UPDATE matches SET winner_id = ?, is_bye = 1 WHERE id = ?`, [secondMatch.player1_id, secondMatch.id]);
  }
}