import fp from 'fastify-plugin';

async function checkJWT(fastify, opts) {
	console.log("🧩 checkJWT plugin loaded");
	fastify.decorate("checkJWT", async function (request, reply) {
        try {
            // console.log("🪪 URL:", request.url);
            // console.log("🧪 Token payload:", request.headers.authorization);
            await request.jwtVerify();
            // console.log("✅ Verified user:", request.user);
            // refuse access to road except /verify-login if it's a temp token
            if (request.url !== "/2fa/verify-login" && request.user?.twofa_pending){
                return reply.sendError(403, "Access denied: 2FA verification required");
            }
        } catch (err) {
            // console.log("❌ JWT verification failed:", err);
            return reply.sendError(401, "Invalid or missing token");
        }
	});
}

export default fp(checkJWT);

