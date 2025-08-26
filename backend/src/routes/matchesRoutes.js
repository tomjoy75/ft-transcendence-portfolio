export default function privateRoutes(fastify, options) {
	const db = options.db;

	fastify.addHook('preHandler', fastify.checkJWT);

	/**
	 * POST /matches
	 * Create a new 1v1 match (optionally part of a tournament), without result.
	 * - Body: { player1, player2, tournamentId?, round?, position?, parent_match1_id?, parent_match2_id? }
	 * - All usernames must exist.
	 * - Returns: { message, matchId }
	 * - Fails: 400 (bad input), 404 (user/tournament not found)
	 */
	fastify.post("/matches", {
		handler: async (req, reply) => {
			const { player1, player2, tournamentId, round = 1, position = 0, parent_match1_id = null, parent_match2_id = null } = req.body;

			if (!player1 || !player2)
				return reply.sendError(400, "Missing required fields: player1, player2");
			if (player1 === player2)
				return reply.sendError(400, "player1 and player2 must be different");

			if (tournamentId !== undefined && tournamentId !== null) {
				const tournament = await db.get(
					"SELECT id FROM tournaments WHERE id = ? AND is_deleted = 0",
					[tournamentId]
				);
				if (!tournament)
					return reply.sendError(404, "Tournament not found");
			}

			const players = await db.all(
				"SELECT id, username FROM users WHERE username IN (?, ?)",
				[player1, player2]
			);
			if (players.length !== 2)
				return reply.sendError(404, "One or both players not found");

			const id_pl1 = players.find(u => u.username === player1)?.id;
			const id_pl2 = players.find(u => u.username === player2)?.id;

			if (!id_pl1 || !id_pl2)
				return reply.sendError(500, "Failed to identify players");

			try {
				const result = await db.run(
					`INSERT INTO matches 
						(player1_id, player2_id, winner_id, player1_score, player2_score, tournament_id, round, position, parent_match1_id, parent_match2_id) 
						VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?)`,
					[
						id_pl1,
						id_pl2,
						tournamentId || null,
						round,
						position,
						parent_match1_id,
						parent_match2_id,
					]
				);

				return reply.send({
					message: "Match successfully created",
					matchId: result.lastID
				});
			} catch (err) {
				console.error(err);
				return reply.sendError(500, "Error creating match");
			}
		}
	});



	/**
	 * GET /matches/history/:username
	 * Returns all matches where the user participated (1v1 or tournament).
	 * - Params: :username (in URL)
	 * - Returns: [
	 *     {
	 *       opponent: string,
	 *       opponent_avatar: string | null,
	 *       date: string (ISO),
	 *       tournament_id: number | null,
	 *       you_won: boolean,
	 *       score: "X-Y"
	 *     },
	 *     ...
	 *   ]
	 * - Sorted by most recent first
	 */
	fastify.get("/matches/history/:username", {
		handler: async (req, reply) => {
			const username = req.params.username;
			if (!username)
				return reply.sendError(404, "Invalid username");
			const user = await db.get("SELECT id FROM users WHERE username = ?", [username]);
			if (!user)
				return reply.sendError(404, "User not found");
		
			const result = await db.all(`
				SELECT opponent, opponent_avatar, date, tournament_id, you_won, score FROM (
					SELECT  
						username AS opponent,  
						avatar  AS opponent_avatar,  
						m.created_at AS date,  
						tournament_id, 
						CASE WHEN winner_id = player1_id THEN 1 ELSE 0 END AS you_won, 
						player1_score || '-' || player2_score AS score
					FROM users u 
					JOIN matches m ON m.player2_id = u.id 
					WHERE player1_id = ? 
					AND m.winner_id IS NOT NULL
					AND m.is_bye = 0
				) 
				UNION 
				SELECT opponent, opponent_avatar, date, tournament_id, you_won, score FROM (
					SELECT  
						username AS opponent,  
						avatar  AS opponent_avatar,  
						m.created_at AS date,  
						tournament_id, 
						CASE WHEN winner_id = player2_id THEN 1 ELSE 0 END AS you_won, 
						player2_score || '-' || player1_score AS score
					FROM users u 
					JOIN matches m ON m.player1_id = u.id 
					WHERE player2_id = ? 
					AND m.winner_id IS NOT NULL
					AND m.is_bye = 0
				) 
				ORDER BY date DESC;

			`, [user.id, user.id]);
			
			return reply.send(result);
		}
	});


	/**
	 * GET /matches/:id
	 * Returns detailed information for a single match.
	 * - Params: :id (match ID)
	 * - Returns: {
	 *     id: number,
	 *     date: string (ISO),
	 *     player1: { username, avatar, alias, score },
	 *     player2: { username, avatar, alias, score },
	 *     winner: username,
	 *     round: number,
	 *     position: number,
	 *     parent_match1_id: number | null,
	 *     parent_match2_id: number | null
	 *   }
	 * - Aliases are resolved from tournament_players if tournament match, else from users
	 */
	fastify.get("/matches/:id", {
		handler: async (req, reply) => {
			const id = req.params.id;
			if (!id)
				return reply.sendError(404, "Invalid id");

			const match = await db.get("SELECT * FROM matches WHERE id = ?", [id]);
			if (!match)
				return reply.sendError(404, "Id not found");

			const row = await db.get(`
				SELECT 
					m.player1_id,
					u1.username AS player1_username, 
					u1.avatar AS player1_avatar, 
					COALESCE(t1.alias, u1.alias) AS player1_alias, 
					player1_score, 
					m.player2_id,
					u2.username AS player2_username, 
					u2.avatar AS player2_avatar, 
					COALESCE(t2.alias, u2.alias) AS player2_alias, 
					player2_score, 
					CASE WHEN winner_id = player1_id THEN u1.username ELSE u2.username END AS winner,
					m.round,
					m.position,
					m.parent_match1_id,
					m.parent_match2_id,
					m.is_bye,
					m.tournament_id,
					t.type AS tournament_type
				FROM matches m  
				LEFT JOIN users u1 ON u1.id = m.player1_id  
				LEFT JOIN users u2 ON u2.id = m.player2_id 
				LEFT JOIN tournament_players t1 ON t1.tournament_id = m.tournament_id AND t1.user_id = m.player1_id 
				LEFT JOIN tournament_players t2 ON t2.tournament_id = m.tournament_id AND t2.user_id = m.player2_id 
				LEFT JOIN tournaments t ON t.id = m.tournament_id
				WHERE m.id = ?
			`, [id]);

			return reply.send({
				id: match.id,
				date: match.created_at,
				player1: {
			        id: row.player1_id,
					username: row.player1_username,
					avatar: row.player1_avatar,
					alias: row.player1_alias,
					score: match.player1_score
				},
				player2: {
			        id: row.player2_id,
					username: row.player2_username,
					avatar: row.player2_avatar,
					alias: row.player2_alias,
					score: match.player2_score
				},
				winner: row.winner,
				round: row.round,
				tournamentId: row.tournament_id || null,
				type: row.tournament_type || null,
				position: row.position,
				parent_match1_id: row.parent_match1_id,
				parent_match2_id: row.parent_match2_id,
				is_bye: !!row.is_bye
			});
		}
	});


	/**
	 * POST /matches/:id/result
	 * Submits the result of a match.
	 * - Params: :id (match ID)
	 * - Body: {
	 *     winner_id: number,
	 *     player1_score: number,
	 *     player2_score: number
	 *   }
	 * - If tournament match: winner is propagated to the next match via parent_match1_id/parent_match2_id
	 * - If non-tournament match: result is saved, no extra logic
	 * - Returns: { success: true } or error
	 */
	fastify.post("/matches/:id/result", async (req, reply) => {
		try {
			const matchId = parseInt(req.params.id);
			const { winner_id, player1_score, player2_score } = req.body;

			const match = await db.get(`SELECT * FROM matches WHERE id = ?`, [matchId]);
			if (!match) {
				return reply.code(404).send({ error: "Match not found" });
			}

			if (match.winner_id !== null) {
				return reply.code(400).send({ error: "Result already submitted" });
			}

			if (![match.player1_id, match.player2_id].includes(winner_id)) {
				return reply.code(400).send({ error: "Winner must be one of the players" });
			}

			if (player1_score === player2_score)
				return reply.sendError(400, "No equality allowed");

			if ((match.player1_id === winner_id && player1_score <= player2_score) ||
				(match.player2_id === winner_id && player1_score >= player2_score))
				return reply.sendError(400, "Winner must have biggest score");

			await db.run(`
				UPDATE matches SET
					winner_id = ?, player1_score = ?, player2_score = ?
				WHERE id = ?
			`, [winner_id, player1_score, player2_score, matchId]);

			if (!match.tournament_id) {
				return reply.send({ success: true });
			}

			const nextMatches = await db.all(`
				SELECT * FROM matches
				WHERE parent_match1_id = ? OR parent_match2_id = ?
			`, [matchId, matchId]);

			for (const next of nextMatches) {
				let column = null;
				if (next.parent_match1_id === matchId) column = "player1_id";
				else if (next.parent_match2_id === matchId) column = "player2_id";

				if (column) {
					await db.run(`
						UPDATE matches SET ${column} = ? WHERE id = ?
					`, [winner_id, next.id]);
				}
			}


			const remainingMatches = await db.get(`
			SELECT COUNT(*) AS count FROM matches
			WHERE tournament_id = ? AND winner_id IS NULL
			`, [match.tournament_id]);

			if (remainingMatches.count === 0) {
				await db.run(`
					UPDATE tournaments SET status = 'finished' WHERE id = ?
				`, [match.tournament_id]);
			}

			return reply.send({ success: true });

		} catch (err) {
			console.error(err);
			return reply.code(500).send({ error: "Internal server error" });
		}
});


}
