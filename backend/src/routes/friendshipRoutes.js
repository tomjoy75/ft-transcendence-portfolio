export default function privateRoutes(fastify, options) {
  const db = options.db;

  fastify.addHook('preHandler', fastify.checkJWT);

  fastify.post("/friends/request/:username", {
    handler: async (req, reply) => {
      const username = req.params.username;
      if(!username)
        return reply.sendError(400, "Invalid username");
      const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
      if (!user)
        return reply.sendError(404, `Username ${username} not found`);
      if (req.user.id === user.id)
        return reply.sendError(400, "You can't send a request to yourself");
      if (await db.get("SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
        [req.user.id, user.id, user.id, req.user.id]))
        return reply.sendError(404, "Request already pending");
      let result;
      try {
        result = await db.run(
          "INSERT INTO friendships (user1_id, user2_id, status) VALUES (?, ?, 'pending')",
          [req.user.id, user.id])
      } catch (err){
        if (err.code === "SQLITE_CONSTRAINT") {
          if (err.message.includes("UNIQUE constraint failed"))
            return reply.sendError(
          409,
          "friendship already created"
        );
        return reply.sendError(
          409,
          `Friendship conflict – check status or existing entry`)
        } else {
          return reply.sendError(
            500,
            "Unexpected server error. Please, make an Issue"
          );
        }
      }
      return reply.send({ message: "Friend request sent successfully"});
    }
  });

  fastify.post("/friends/accept/:username", {
    handler: async (req, reply) => {
      const username = req.params.username;
      if(!username)
        return reply.sendError(400, "Invalid username");
      const friend = await db.get("SELECT id FROM users WHERE username = ?", [username])
      if (!friend)
        return reply.sendError(404, `Username ${username} not found`);
      const friendship = await db.get("SELECT * FROM friendships WHERE user1_id = ? AND user2_id = ? AND status = 'pending'",
        [friend.id, req.user.id]
      );
      if (!friendship)
        return reply.sendError(404, "No pending request from this user");
      try {
        await db.run("UPDATE friendships SET status = 'accepted' WHERE id = ?", [friendship.id]);
      } catch (err){
        if (err.code === "SQLITE_CONSTRAINT") {
          return reply.sendError(
            409,
            `HTTP_CONFLICT`)
        } else {
          return reply.sendError(
            500,
            "Unexpected server error. Please, make an Issue"
          );
        }
      }
      return reply.send({ message: "Friend request accepted"});
    }
  });

  fastify.delete("/friends/decline/:username", {
    handler: async (req, reply) => {
      const username = req.params.username;
      if(!username)
        return reply.sendError(400, "Invalid username");
      const friend = await db.get("SELECT id FROM users WHERE username = ?", [username])
      if (!friend)
        return reply.sendError(404, `Username ${username} not found`);
      const friendship = await db.get("SELECT * FROM friendships WHERE ( \
        (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) \
        ) AND status = 'pending'", 
        [friend.id, req.user.id, req.user.id, friend.id]
      );
      if (!friendship)
        return reply.sendError(404, "No pending request from this user");
      try {
        await db.run("DELETE  FROM friendships WHERE id = ?", [friendship.id]);
      } catch (err){
        if (err.code === "SQLITE_CONSTRAINT") {
          return reply.sendError(
            409,
            `HTTP_CONFLICT`)
        } else {
          return reply.sendError(
            500,
            "Unexpected server error. Please, make an Issue"
          );
        }
      }
      return reply.send({ message: "Friend request declined"});
    }
  });

  fastify.delete("/friends/remove/:username", {
    handler: async (req, reply) => {
      const username = req.params.username;
      if(!username)
        return reply.sendError(400, "Invalid username");
      const friend = await db.get("SELECT id FROM users WHERE username = ?", [username])
      if (!friend)
        return reply.sendError(404, `Username ${username} not found`);
      const friendship = await db.get("SELECT * FROM friendships WHERE ( \
        (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) \
        ) AND status = 'accepted'", 
        [friend.id, req.user.id, req.user.id, friend.id]
      );
      if (!friendship)
        return reply.sendError(404,  `${username} not a friend`);
      try {
        await db.run("DELETE FROM friendships WHERE id = ?", [friendship.id]);
      } catch (err){
        if (err.code === "SQLITE_CONSTRAINT") {
          return reply.sendError(
            409,
            `HTTP_CONFLICT`)
        } else {
          return reply.sendError(
            500,
            "Unexpected server error. Please, make an Issue"
          );
        }
      }
      return reply.send({ message:`Friend ${username} successfully removed`});
    }
  });

  fastify.get("/friends/list", {
    handler: async (req, reply) => {
      try { 
        const result = await db.all(
  			"SELECT users.id, users.username, users.alias, users.email, users.avatar \
  			 FROM users \
  			 JOIN ( \
  			   SELECT \
  			     CASE \
  			       WHEN user1_id = ? THEN user2_id \
  			       WHEN user2_id = ? THEN user1_id \
  			     END AS id \
  			   FROM friendships \
  			   WHERE status = 'accepted' AND (user1_id = ? OR user2_id = ?) \
  			 ) f ON users.id = f.id",
  			[req.user.id, req.user.id, req.user.id, req.user.id]);			

        return reply.send(result);
      } catch (err) {
        return reply.sendError(500, "Unable to fetch friends list");
      }
    }
  });

  fastify.get("/friends/pending", {
    handler: async (req, reply) => {
      try {
        const result = await db.all("SELECT users.id, users.username, users.alias, users.email, users.avatar \
                      FROM users \
                      JOIN ( \
                        SELECT user1_id AS friend_id\
                        FROM friendships \
                        WHERE status = 'pending' AND user2_id = ? \
                      )f ON users.id = f.friend_id \
        ", [req.user.id]);
        return reply.send(result);
      } catch (err) {
        return reply.sendError(500, "Unable to fetch pending list");
      }
    }
  })
}