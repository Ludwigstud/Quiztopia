import jwt from "jsonwebtoken";
import createHttpError from "http-errors";

const authMiddleware = () => {
	const before = async (request) => {
		try {
			const token = request.event.headers.authorization?.split(" ")[1];

			if (!token) {
				throw new createHttpError.Unauthorized("Token not provided");
			}

			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			request.event.user = decoded;
		} catch (error) {
			throw new createHttpError.Unauthorized("Invalid or expired token");
		}
	};

	return {
		before,
	};
};

export default authMiddleware;
