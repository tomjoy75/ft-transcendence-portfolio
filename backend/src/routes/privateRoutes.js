import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import validate from "../utils/validate.js";
import path from 'path';
import { pipeline } from "stream/promises";

export default function privateRoutes(fastify, options) {
  const db = options.db;

  fastify.addHook('preHandler', fastify.checkJWT);

  fastify.get("/stats/:username", {
	handler: async (req, reply) => {
		const username = req.params.username;
		if (!username) return reply.sendError(400, "Invalid username");

		const user = await db.get("SELECT id FROM users WHERE username = ?", [username]);
		if (!user) return reply.sendError(404, "User not found");

		const stats = await db.get(`
		SELECT 
			COUNT(*) AS games_played,
			SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) AS wins,
		FROM matches
		WHERE player1_id = ? OR player2_id = ?`,
		[user.id, user.id, user.id]
		);

		return reply.send({
		games_played: stats.games_played || 0,
		wins: stats.wins || 0,
		});
		}
	});


  fastify.get("/user/:id", {
    handler: async (request, reply) => {
      if (isNaN(+request.params.id)) {
        return reply.sendError(400, "Invalid user ID");
      }
      const user = await db.get("SELECT * FROM users WHERE id = ?", [
        request.params.id,
      ]);
      // Case not a user
      if (!user) {
        return reply.sendError(404, `User ${request.params.id} not found`);
      }
      if (request.user.id === +request.params.id)
        return user;
      else 
        return reply.sendError(403, `Access denied: you are not allowed to view user ${request.params.id}`);
    },
  });

  fastify.get("/user/username/:username", {
    handler: async (request, reply) => {
      if(!request.params.username)
        return reply.sendError(400, "Invalid username");
      const user = await db.get("SELECT * FROM users WHERE username = ?", [request.params.username]);
      if (!user) {
        return reply.sendError(404, `Username ${request.params.username} not found`);
      };
      return {
        username: user.username,
        alias: user.alias,
        email: user.email,
        avatar: user.avatar,
		online: user.online === 1
      };
    }
  });

	fastify.get("/user/id/:id", {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id);
			if (!id || isNaN(id)) {
				return reply.sendError(400, "Invalid user ID");
			}
			const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
			if (!user) {
				return reply.sendError(404, `User ID ${id} not found`);
			}
			return {
				username: user.username,
				alias: user.alias,
				email: user.email,
				avatar: user.avatar,
				online: user.online === 1
			};
		}
	});

  fastify.get("/me", {
    handler: async (request, reply) => {
      // Case id is not a number
      const user = await db.get("SELECT id, username, alias, email, avatar FROM users WHERE id = ?", [
        request.user.id,
      ]);
      // Case not a user
      if (!user) {
        return reply.sendError(404, `User not found`);
      }
      return user;
    },
  });

  fastify.get("/protected", {
    handler: async (req, reply) => {
      return { message: `Hello ${req.user.username}` };
    },
  });
  
  fastify.post("/update", {
    handler: async (req, reply) => {
      const allowedFields = ['username', 'email', 'avatar', 'alias'];
      const fieldsToUpdate = [];
      const values = [];
      for (let field of allowedFields){
        if (req.body[field] !== undefined){
          if (field === 'alias' && req.body.alias.length > 40)
            return reply.sendError(400, "Alias too long");
          if (field === 'email'){
            const checkEmail = validate(req.body.email, "email");
            if (!checkEmail.valid)
              return reply.sendError(422, checkEmail.msg);
          } 
          fieldsToUpdate.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }
      if (fieldsToUpdate.length === 0)
        return reply.sendError(400,"No valid fields to update." );
      values.push(req.user.id);
      const sql = `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
      let result = {};
      try {
        result = await db.run(sql, values);
      } catch (err) {
        if (err.code == "SQLITE_CONSTRAINT") 
          return reply.sendError(409,`Username ${req.body.username} already exists`);
        else 
          return reply.sendError(500,  "Unexpected server error. Please, make an Issue");
      }
      const sendBack = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
      return sendBack;
    }
  });
  
  fastify.post("/update-password", {
    handler: async (req, reply) => {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return reply.sendError(
          400,
          "Missing required fields: oldPassword or newPassword"
        );
      }
      const checkPassword = validate(newPassword, "password");
      if (!checkPassword.valid)
        return reply.sendError(422, checkPassword.msg);
      const user = await db.get(
        "SELECT password_hash FROM users WHERE id = ?",
        [req.user.id]
      );
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) {
        return reply.sendError(401, "Unauthorized: password does not match");
      }
      if (await bcrypt.compare(newPassword, user.password_hash)){
        return reply.sendError(400, "New password can't be the same as the old one");
      }
      const password_hash = await bcrypt.hash(newPassword, 10);
      let result = {};
      try {
        result = await db.run(
          "UPDATE users SET password_hash = ? WHERE id = ?",
          [password_hash, req.user.id]
        );
      } catch (err) {
          return reply.sendError(
            500,
            "Unexpected server error. Please, make an Issue"
          );
        }
      const sendBack = await db.get("SELECT id, username, email, avatar FROM users WHERE id = ?", [req.user.id]);
      return sendBack;
    }
  })

	fastify.post("/logout", {
	handler: async (req, reply) => {
		const userId = req.user?.id;
		if (!userId) {
		return reply.sendError(401, "Unauthorized");
		}

		await db.run("UPDATE users SET online = 0 WHERE id = ?", [userId]);

		return { message: "Successfully logged out" };
	}
	});

  fastify.post("/2fa/setup", {
    handler: async(req, reply) => {
      try {
        const user = await db.get("SELECT enabled_2fa FROM users WHERE id = ?", [req.user.id]);
        if (user?.enabled_2fa){
          return reply.sendError(400, "2FA is already enabled for this user");
        }
        const secret = authenticator.generateSecret(); 
        const otpathURL = authenticator.keyuri(req.user.username, "ft_transcendence", secret);
        const qrCode = await QRCode.toDataURL(otpathURL);
        
        await db.run("UPDATE users SET secret_2fa = ? WHERE id = ?", [secret, req.user.id]);
        return {
          "qrCode": qrCode,
          // "secret": secret,
          // "otpathURL": otpathURL
        }
      } catch(err) {
        console.log(err);
        return reply.sendError(500, "Unable to generate 2FA setup");
      }
    }
  })

  fastify.post("/2fa/verify-setup", {
    handler: async(req, reply) => {
      const token = req.body.code;
      const row = await db.get("SELECT secret_2fa FROM users WHERE id = ?", [req.user.id]);
      if (!row?.secret_2fa){
        return reply.sendError(400, "No 2FA Found for this user");
      }
      // console.log("👤 User ID:", req.user?.id);
      // console.log("🔍 Code reçu :", token);
      // console.log("🔍 Secret utilisé :", row.secret_2fa);
      // const expected = authenticator.generate(row.secret_2fa);
      // console.log("🔍 Code attendu :", expected);

      const isValid = authenticator.verify({token, secret: row.secret_2fa});
      if (!isValid){
        return reply.sendError(401, "Invalid 2FA code");
      }
      await db.run("UPDATE users SET enabled_2fa = 1 WHERE id= ?", [req.user.id]);
      return {message: "2FA successfully enabled"};
    }
  })

  fastify.post("/2fa/verify-login", {
    handler: async(req, reply) => {
      if (!req.user?.twofa_pending) {
        return reply.sendError(403, "Access denied: Not a temporary 2FA token");
      }
      
      const token = req.body.code;      
      const row = await db.get("SELECT secret_2fa FROM users WHERE id = ?", [req.user.id]);
//       console.log("👤 User (tempToken):", req.user);
//       console.log("👤 User:", req.user);
// console.log("📥 Code reçu :", req.body.code);
// console.log("🔐 Secret 2FA :", row.secret_2fa);
// console.log("📤 Code attendu :", authenticator.generate(row.secret_2fa));
      if (!row?.secret_2fa){
        return reply.sendError(403, "2FA secret not found for this user");
      }
      const isValid = authenticator.verify({token, secret: row.secret_2fa});
      if (!isValid){
        return reply.sendError(401, "Invalid 2FA code");
      }
      const finalToken = fastify.jwt.sign({
        id: req.user.id,
        username: req.user.username},
        {expiresIn: '1d'});
      return reply.send({ message: "2FA validated", token: finalToken});
    }

  });
  
  fastify.post("/2fa/disable", {
    handler:async(req, reply) => {
      const user = await db.get("SELECT enabled_2fa FROM users WHERE id = ?", [req.user.id]);
      if (!user?.enabled_2fa){
        return reply.sendError(403, "2FA is not enabled for this user");
      }
      try {
        await db.run("UPDATE users SET secret_2fa = NULL, enabled_2fa = 0 WHERE id = ?", [req.user.id]);
        return reply.send({
          message: "2FA successfully disabled"
        });
      } catch (err ){
        return reply.sendError(500, "Could not disable 2FA");
      }
    }
  });

  fastify.post("/2fa/status", {
    handler:async(req, reply) => {
      const user = await db.get("SELECT enabled_2fa FROM users WHERE id = ?", [req.user.id]);
      if (!user){
        return reply.sendError(404, "User not found");
      }
      return reply.send((user.enabled_2fa)? {"enabled_2fa": true} : {"enabled_2fa": false});
    }
  });

  // fastify.delete("/user", {
  //   handler:async(req, reply) => {
  //     const result = await db.run("DELETE FROM users WHERE id = ?", [req.user.id]);
  //     if (!result.changes)
  //       return reply.sendError(404, "User not found");
  //     return reply.send({ message: "Account successfully deleted"});
  //   }
  // });

  fastify.patch("/user/alias", {
    handler:async(req, reply) => {
      if (!req.body.alias)
        return reply.sendError(400, "No alias sent");
      // Limit the length of aliases to avoid injection, overflows ...
      if (req.body.alias.length > 20)
        return reply.sendError(400, "Alias too long");
      const result = await db.run("UPDATE users SET alias = ? WHERE id = ?", [req.body.alias, req.user.id]);
      if (!result.changes)
        return reply.sendError(404, "User not found");
      return reply.send({ message: "Alias updated successfully"});
    }
  });

  fastify.post("/users/me/avatar", {
    handler:async(req, reply) => {
      const fs = await import('fs');
      const data = await req.file();
//      console.log("📂 Received file:", data);
      // if (data.file.truncated) {
      //   return reply.sendError(413, "Avatar file too large (max 2MB)");
      // }
      if (!data || !data.file){
        return reply.sendError(400, "No file upload");
      }
      const type = data.mimetype;
      if (type !== "image/png" && type !== "image/jpeg"){
        console.log("MIME type:", type);
        return reply.sendError(400, "Image must be in .jpg or .png format");
      }
      const extension = (type === "image/png") ? ".png" : ".jpg";
      const avatarName = "user_"  + req.user.id + "_" + Date.now() + extension; 
      const avatarPath = path.join(process.cwd(), "src", "avatars", avatarName);
      try {
        const writeStream = fs.createWriteStream(avatarPath);
        console.log("📂 FILE STREAM?", data.file?.readable, typeof data.file);
        await pipeline(data.file, writeStream);
        if (data.file.truncated) {
          await fs.promises.unlink(avatarPath);
          return reply.sendError(413, "Avatar file too large (max 2MB)");
        }
        // await data.toFile(avatarPath);
      } catch (err) {
        console.log(err);
        return reply.sendError(500, "Failed to upload avatar")
      }
      const publicPath = `/avatars/${avatarName}`;
      const row = await db.get('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
      const oldAvatarPath = row?.avatar; 
    
	  if (oldAvatarPath && oldAvatarPath.startsWith('/avatars/') && oldAvatarPath !== publicPath) {
	    try {
	      const relativePath = oldAvatarPath.replace(/^\/+/, ''); // убираем ведущие слэши
	      const toDeletePath = path.join(process.cwd(), 'src', relativePath);
	  
	      console.log('Deleting old avatar file:', toDeletePath);
	  
	      await fs.promises.access(toDeletePath);
	      await fs.promises.unlink(toDeletePath);
	  
	      console.log('Old avatar deleted successfully');
	    } catch (err) {
	      console.error('Failed to delete old avatar file:', err);
	    }
	  }
      console.log(`✅ Avatar uploaded for user ${req.user.id}: ${avatarName}`);
      return reply.send({
        success: true,
        avatar: publicPath
      });
    }
  })
}