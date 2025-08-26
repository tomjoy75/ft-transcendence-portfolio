import { startTournament } from "../utils/startTournament.js";

export default function privateRoutes(fastify, options) {
	const db = options.db;

	fastify.addHook('preHandler', fastify.checkJWT);

	/**
	 * POST /tournaments/create
	 * Create a new tournament with a unique name.
	 * Requires authentication.
	 * - Body: { name: string, type: string }
	 * - Automatically sets the current user as "created_by"
	 * - created_at is set by DB (DEFAULT CURRENT_TIMESTAMP)
	 */
	fastify.post("/tournaments/create", {
		handler: async (req, reply) => {
			const { name, type } = req.body;

			if (!name || !type)
				return reply.sendError(400, "Missing required fields: name or type");

			if (typeof name !== "string" || name.trim().length < 3)
				return reply.sendError(400, "Invalid tournament name");

			if (type !== "local" && type !== "remote")
				return reply.sendError(400, "Invalid tournament type. Must be 'local' or 'remote'");

			let result;
			try {
				result = await db.run(
					"INSERT INTO tournaments (name, created_by, type) VALUES (?, ?, ?)",
					[name.trim(), req.user.id, type]
				);
			} catch (err) {
				console.log(err);
				if (err.code === "SQLITE_CONSTRAINT" && err.message.includes("UNIQUE"))
					return reply.sendError(409, `Tournament name ${name} already exists`);
				else
					return reply.sendError(500, "Unexpected server error while creating tournament");
			}

			return reply.send({
				message: `Tournament ${name} successfully created`,
				tournament_id: result.lastID
			});
		}
	});

	/**
	 * GET /tournaments
	 * Fetch all tournaments, ordered by most recent first.
	 * Requires authentication.
	 * - Returns: [{ id, name, created_by, created_at}, ...]
	 */
	fastify.get("/tournaments", {
		handler: async (req, reply) => {
			try {
				const tournaments = await db.all("SELECT * FROM tournaments WHERE is_deleted = 0 AND status IN ('not started', 'started') ORDER BY created_at DESC");
				return tournaments;
			} catch (err) {
				return reply.sendError(500, "Unable to fetch tournaments");
			}
		}
	});

	/**
	 * GET /tournaments/:id
	 * Fetch a single tournament by ID.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Returns: { id, name, created_by, created_at, status } or 404 if not found
	*/
	fastify.get("/tournaments/:id", {
		handler: async (req, reply) => {
			const tournamentId = parseInt(req.params.id);
			if (isNaN(tournamentId)) {
				return reply.sendError(400, "Invalid tournament ID");
			}

			try {
				const tournament = await db.get(
					"SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0",
					[tournamentId]
				);

				if (!tournament) {
					return reply.sendError(404, `Tournament ID ${tournamentId} not found`);
				}

				return tournament;
			} catch (err) {
				console.error(err);
				return reply.sendError(500, "Unable to fetch tournament");
			}
		}
	});


	/**
	 * POST /tournaments/:id/join
	 * Join an existing tournament.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Body: { alias?: string }
	 *   If alias not provided, fallback to user's alias from profile.
	 * - Prevents duplicate participation in same tournament.
	 */
	fastify.post("/tournaments/:id/join", {
		handler: async (req, reply) =>{
			// Check tournament exists
			const id = req.params.id;
			if (!id) {
				return reply.sendError(400, "invalid id");
			}
			const tournament = await db.get("SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0", [id]);
			if (!tournament)
				return reply.sendError(404, `tournament id ${id} not found`) 
			// Create entry in tournament_players
			let alias = req.body.alias;
			if (!alias){
				const row = await db.get("SELECT alias FROM users WHERE id = ?", [req.user.id]);
				alias = row?.alias;
				//console.log("alias is : ", alias);
			}

			// Ensure tournament has not started yet
			const match = await db.get("SELECT * FROM matches WHERE tournament_id = ? LIMIT 1", [id]);
			if (match)
				return reply.sendError(403, "Cannot join tournament after it has started");
			
			// Check user is not already inscribed
			try {
				await db.run("INSERT INTO tournament_players (tournament_id, user_id, alias) VALUES (?, ?, ?)", [id, req.user.id, alias]);
			} catch (err) {
				// console.log(err);
				if (err.code === "SQLITE_CONSTRAINT" && err.message.includes ("UNIQUE"))
					return reply.sendError(409, `You already joined the tournament ${tournament.name}`);
				else
					return reply.sendError(500, "Unexpected server error while creating tournament");
			}
			return reply.send({
				message: "User joined tournament"
			});
		}
	})

	/**
	 * POST /tournaments/:id/leave
	 * Leave a tournament before it starts.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Only allowed if tournament has not started yet.
	 * - Removes the user from tournament_players.
	 */
	fastify.post("/tournaments/:id/leave", {

		handler: async (req, reply) => {
			// Validate tournament ID
			const id = req.params.id;
			if (!id)
				return reply.sendError(400, "invalid id");

			// Check if tournament exists and not deleted
			const tournament = await db.get("SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0", [id]);
			if (!tournament)
				return reply.sendError(404, `tournament id ${id} not found`);

			// Ensure tournament has not started yet
			const match = await db.get("SELECT * FROM matches WHERE tournament_id = ? LIMIT 1", [id]);
			if (match)
				return reply.sendError(403, "Cannot leave tournament after it has started");

			// Delete user from tournament_players
			const result = await db.run("DELETE FROM tournament_players WHERE tournament_id = ? AND user_id = ?", [id, req.user.id]);
			if (result.changes === 0)
				return reply.sendError(404, "You are not registered in this tournament");

			return reply.send({ message: "User left tournament" });
		}
	});

	/**
	 * POST /tournaments/:id/start
	 * Start a tournament by creating the tournament bracket matches.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Checks if tournament exists and not already started
	 * - Checks if current user is the tournament creator
	 * - Creates matches with rounds, positions and parent match references
	 * - Returns success message
	 */
	fastify.post("/tournaments/:id/start", {
		
		handler: async (req, reply) => {
			const tournamentId = req.params.id;
			const userId = req.user.id;

			// Get tournament and check that it exists
			const tournament = await db.get(
				"SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0",
				[tournamentId]
			);
			if (!tournament) {
				return reply.sendError(404, `Tournament ID ${tournamentId} not found`);
			}

			// Check if the user is the creator of torurnament
			if (tournament.created_by !== userId) {
				return reply.sendError(403, "Only the tournament creator can start the tournament");
			}

			// Check if tournament is started
			const existingMatches = await db.get(
				"SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ?",
				[tournamentId]
			);
			if (existingMatches.count > 0) {
				return reply.sendError(409, "Tournament already started");
			}

			try {
				await startTournament(db, tournamentId);

				await db.run(
				"UPDATE tournaments SET status = 'started' WHERE id = ?",
				[tournamentId]
				);

				return reply.send({ message: `Tournament ${tournament.name} started successfully` });
			} catch (err) {
				console.error(err);
				return reply.sendError(500, "Failed to start tournament");
			}
		},
	});


	/**
	 * GET /tournaments/:id/players
	 * List all players registered in a given tournament.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Returns: [{ user_id, username, alias, avatar, score }, ...]
	 * - Uses a JOIN between tournament_players and users
	 */
	fastify.get("/tournaments/:id/players", {
		handler: async (req, reply) => {
			const id = req.params.id;
			if (!id) {
				return reply.sendError(400, "invalid id");
			}

			const tournament = await db.get(
				"SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0",
				[id]
			);

			if (!tournament) {
				return reply.sendError(404, `tournament id ${id} not found`);
			}

			const players = await db.all(`
				SELECT 
					users.id AS user_id,
					users.username,
					tournament_players.alias,
					users.avatar,
					tournament_players.score
				FROM tournament_players
				JOIN users ON tournament_players.user_id = users.id
				WHERE tournament_players.tournament_id = ?
			`, [id]);

			return reply.send(players);
		}
	});


	/**
	 * GET /tournaments/:id/matches
	 * Get all matches of a tournament ordered by round and position.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Returns array of matches with their details for the tournament bracket
	 */
	fastify.get("/tournaments/:id/matches", {
		handler: async (req, reply) => {
			const tournamentId = req.params.id;

			const tournament = await db.get("SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0", [tournamentId]);
			if (!tournament)
				return reply.sendError(404, `Tournament ID ${tournamentId} not found`);

			const matches = await db.all(
				`SELECT 
					m.id,
					m.round,
					m.position,
					m.winner_id,
					m.player1_id,          
					m.player2_id,          
					m.player1_score,
					m.player2_score,
					m.tournament_id,
					m.parent_match1_id,
					m.parent_match2_id,
					m.is_bye,
					u1.username AS player1_username,
					u2.username AS player2_username
				FROM matches m
				LEFT JOIN users u1 ON u1.id = m.player1_id
				LEFT JOIN users u2 ON u2.id = m.player2_id
				WHERE m.tournament_id = ?
				ORDER BY m.round ASC, m.position ASC`,
				[tournamentId]
			);

			return reply.send(matches);
		}
	});

	/**
	 * GET /tournaments/:id/status
	 * Get current status of a tournament including number of matches, finished matches, and if tournament is finished.
	 * Requires authentication.
	 * - Params: id (tournament ID)
	 * - Returns: { totalMatches, finishedMatches, tournamentFinished, winnerId }
	 */
	fastify.get("/tournaments/:id/status", {
		handler: async (req, reply) => {
			const tournamentId = req.params.id;

			const tournament = await db.get("SELECT * FROM tournaments WHERE id = ? AND is_deleted = 0", [tournamentId]);
			if (!tournament)
				return reply.sendError(404, `Tournament ID ${tournamentId} not found`);

			const totalMatches = await db.get("SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ?", [tournamentId]);
			const finishedMatches = await db.get("SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ? AND winner_id IS NOT NULL", [tournamentId]);

			const finalMatch = await db.get("SELECT * FROM matches WHERE tournament_id = ? ORDER BY round DESC LIMIT 1", [tournamentId]);

			const tournamentFinished = finalMatch && finalMatch.winner_id !== null;

			return reply.send({
				totalMatches: totalMatches.count,
				finishedMatches: finishedMatches.count,
				status: tournament.status,
				winnerId: tournamentFinished ? finalMatch.winner_id : null,
			});
		}
	});

	/**
	 * DELETE /tournaments/:id
	 * Deletes a tournament by ID, only if the user is the creator.
	 * Requires authentication.
	 */
	fastify.delete("/tournaments/:id", {
		handler: async (req, reply) => {
			const id = req.params.id;
			const userId = req.user.id;

			const tournament = await db.get("SELECT * FROM tournaments WHERE id = ?", [id]);
			if (!tournament)
				return reply.sendError(404, `Tournament ID ${id} not found`);

			if (tournament.created_by !== userId)
				return reply.sendError(403, "You are not the creator of this tournament");

			try {
				// await db.run("DELETE FROM tournament_players WHERE tournament_id = ?", [id]); 
			
				await db.run("UPDATE tournaments SET is_deleted = 1 WHERE id = ?", [id]); // TODO: if tournament soft delete is needed, adapt this! 

				return reply.send({ message: `Tournament ${tournament.name} deleted` });
			} catch (err) {
				console.error(err);
				return reply.sendError(500, "Unexpected error while deleting tournament");
			}
		}
	});

}

