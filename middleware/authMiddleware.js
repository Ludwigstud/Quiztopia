import jwt from "jsonwebtoken";
import createHttpError from "http-errors";

const authMiddleware = () => {
	// The 'before' hook runs before your main handler.
	const before = async (request) => {
		try {
			// 1. Get the token from the Authorization header.
			// The header format is "Bearer <token>", so we split the string and take the second part.
			const token = request.event.headers.authorization?.split(" ")[1];

			if (!token) {
				// If no token is provided, the user is not authorized.
				throw new createHttpError.Unauthorized("Token not provided");
			}

			// 2. Verify the token using the same secret from your serverless.yml.
			// This will throw an error if the token is invalid (expired, wrong signature, etc.).
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// 3. Attach the decoded user information to the event object.
			// This makes the user's ID and username available inside your main handler!
			request.event.user = decoded;
		} catch (error) {
			// If jwt.verify fails or there's no token, we throw an Unauthorized error.
			// Middy's httpErrorHandler will catch this and send a proper 401 response.
			throw new createHttpError.Unauthorized("Invalid or expired token");
		}
	};

	return {
		before,
	};
};

export default authMiddleware;
