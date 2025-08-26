import fp from 'fastify-plugin';

async function sendError(fastify, opts) {
	console.log("🧩 sendError plugin loaded");
	fastify.decorateReply("sendError", function (statusCode, message) {
		this.code(statusCode).send({
			error: {
				code: statusCode,
				message,
			},
		});
	});
}

export default fp(sendError);
