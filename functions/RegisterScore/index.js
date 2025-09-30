import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import authMiddleware from "../../middleware/authMiddleware.js";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	const { quizId } = event.pathParameters;
	const { score } = event.body;
	const { userId, username } = event.user;

	if (typeof score !== "number") {
		throw new createHttpError.BadRequest("Score must be a number");
	}

	const scoreItem = {
		pk: { S: `QUIZ#${quizId}` },
		sk: { S: `SCORE#${score}#${userId}` },
		score: { N: String(score) },
		userId: { S: userId },
		username: { S: username },
		submittedAt: { S: new Date().toISOString() },
	};

	const putParams = {
		TableName: "quiztopia",
		Item: scoreItem,
	};

	await client.send(new PutItemCommand(putParams));

	return {
		statusCode: 201,
		body: JSON.stringify({ message: "Score registered successfully" }),
	};
};

export const handler = middy(baseHandler)
	.use(jsonBodyParser())
	.use(authMiddleware())
	.use(httpErrorHandler());
