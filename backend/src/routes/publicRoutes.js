import bcrypt from "bcrypt";
import validate from "../utils/validate.js"

export default function publicRoutes(fastify, options) {
  const db = options.db;

  // Essential routes without JWT protection

  fastify.post("/signup", async (request, reply) => {
    const { username, email, password, alias } = request.body;
    const avatar = request.body.avatar || `https://api.dicebear.com/9.x/big-smile/svg?seed=${encodeURIComponent(username)}`;
    if (!username || !email || !password ) {
      return reply.sendError(400, "Missing required fields: username, email or password (alias is optional)" );
    }
    const emailCheck = validate(email, "email");
//    console.log("content isValid : ", emailCheck);
    if (!emailCheck.valid){
      // console.log("var ", emailCheck);
      return reply.sendError(422, emailCheck.msg);
    }
    const passwordCheck = validate(password, "password");
    if (!passwordCheck.valid){
      return reply.sendError(422, passwordCheck.msg);
    }
    if (alias && alias.length > 20){
      return reply.sendError(400, "Alias too long");
    }
    const password_hash = await bcrypt.hash(password, 10);
    let result;
    try {
      result = await db.run(
        "INSERT INTO users (username, alias, email, avatar, password_hash) VALUES (?, ?, ?, ?, ?)",
        [username, alias, email, avatar, password_hash]
      );
    } catch (err) {
      // console.error("Signup error:", err);
      // console.error("Message error:", err.message);
      if (err.code === "SQLITE_CONSTRAINT") {
        if (err.message.includes("users.username")){
          return reply.sendError(
            409,
            `Username ${request.body.username} already taken`
        )}
        else if (err.message.includes("users.email")){
          return reply.sendError(
            409,
            `Email ${request.body.email} already taken`
        )}
        else {
          return reply.sendError(
            409,
            `HTTP_CONFLICT`
        )}
      } else {
        return reply.sendError(
          500,
          "Unexpected server error. Please, make an Issue"
        );
      }
    }
    return {
      id: result.lastID,
      username,
      alias,
      email,
      avatar,
    };
  });

	fastify.post("/login", async (request, reply) => {
		const { username, password } = request.body;
		if (!username || !password) {
			return reply.sendError(
			400,
			"Missing required fields: username or password"
			);
		}
		const user = await db.get(
			"SELECT username, password_hash, id, enabled_2fa FROM users WHERE username = ?",
			[username]
		);
		// Case not a valid username
		if (!user) {
			return reply.sendError(404, `User ${username} not found in database`);
		}
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return reply.sendError(401, "Unauthorized: password does not match");
		}

		await db.run("UPDATE users SET online = 1 WHERE id = ?", [user.id]);

		if (!user.enabled_2fa) {
			const token = fastify.jwt.sign(
			{
				id: user.id,
				username,
			}, // Payload
			{ expiresIn: "1d" }
			);
			console.log("✅ Token generated:", token);
			return reply.send({ message: "Login successful", token });
		} else {
			const tempToken = fastify.jwt.sign(
			{
				id: user.id,
				username: user.username,
				twofa_pending: true,
			},
			{ expiresIn: "5h" }
			); // temporary token
			return reply.send({
			message: "2FA required",
			tempToken,
			});
		}
		});
  // Routes for debug
  fastify.get('/debug/users-columns', async (req, reply) => {
    const res = await db.all("PRAGMA table_info(users)");
    return res;
  });

  fastify.post('/test-upload', async function (req, reply) {
  const data = await req.file(); // devrait fonctionner sans erreur
  return { filename: data.filename };
  });

  // Routes without JWT for testing purpose

  fastify.get("/hello", (request, reply) => {
    console.log("🧪 reply.sendError =", reply.sendError);
    return reply.sendError(418, "I'm a teapot");
  });

  fastify.get("/hello/:name", (request, reply) => {
    return `Hello ${request.params.name}`;
  });

  fastify.post("/echo", (request, reply) => {
    return { received: request.body.msg };
  });

// OLD route but should'nt exist because: 
//    - password has no hash
//    - Can accept users with no password => incoherent w login
//    - Send back the user id
  // fastify.post("/user", async (request, reply) => {
  //   const { username, alias, email, avatar } = request.body;
  //   if (!username || !alias || !email || !avatar) {
  //     return reply.code(400).send({
  //       error: {
  //         code: 400,
  //         message: "Missing required fields: username, alias, email or avatar",
  //       },
  //     });
  //   }
  //   let result;
  //   try {
  //     result = await db.run(
  //       "INSERT INTO users (username, alias, email, avatar) VALUES (?, ?, ?, ?)",
  //       [username, alias, email, avatar]
  //     );
  //   } catch (err) {
  //     if (err.code === "SQLITE_CONSTRAINT") {
  //       return reply.code(409).send({
  //         error: {
  //           code: 409,
  //           message: `Username ${request.body.username} already exists`,
  //         },
  //       });
  //     } else {
  //       return reply.code(500).send({
  //         error: {
  //           code: 500,
  //           message: "Unexpected server error. Please, make an Issue",
  //         },
  //       });
  //     }
  //   }
  //   return {
  //     id: result.lastID,
  //     username,
  //     alias,
  //     email,
  //     avatar,
  //   };
  // });

	fastify.get("/leaderboard", async (req, reply) => {
		const limit = parseInt(req.query.limit);
		if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0))
			return reply.sendError(400, "Limit must be a positive integer");

		let query = `
			SELECT u.username, u.alias, u.avatar, COUNT(winner_id) AS wins
			FROM matches m
			JOIN users u ON u.id = m.winner_id
			WHERE m.is_bye = 0
			GROUP BY winner_id
			ORDER BY wins DESC
		`;

		if (limit) {
			query += " LIMIT ?";
			return reply.send(await db.all(query, [limit]));
		}

		const result = await db.all(query);
		return reply.send(result);
	});

}