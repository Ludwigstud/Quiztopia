import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import authMiddleware from "../../middleware/authMiddleware.js";

const baseHandler = async (event) => {
	const { quizName } = event.body;

	const { userId, username } = event.user;

	const quizId = uuidv4();
	const createdAt = new Date().toISOString();

	const quizItem = {
		// According to our data model
		pk: { S: `QUIZ#${quizId}` },
		sk: { S: "METADATA" },
		quizName: { S: quizName },
		creatorId: { S: userId },
		creatorUsername: { S: username },
		createdAt: { S: createdAt },
	};

	const putParams = {
		TableName: "quiztopia",
		Item: quizItem,
	};

	await client.send(new PutItemCommand(putParams));

	return {
		statusCode: 201,
		body: JSON.stringify({
			message: "Quiz created successfully",
			quizId: quizId,
		}),
	};
};

export const handler = middy(baseHandler)
	.use(jsonBodyParser())
	.use(authMiddleware())
	.use(httpErrorHandler());
