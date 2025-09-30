import { PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import jsonBodyParser from "@aws-sdk/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import authMiddleware from "../../middleware/authMiddleware.js";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	// Get the quizId from the URL path
	const { quizId } = event.pathParameters;
	// Get the question details from the request body
	const { questionText, answer, latitude, longitude } = event.body;
	// Get the logged-in user's info from the auth middleware
	const { userId } = event.user;

	// --- Authorization Check: Does this user own the quiz? ---
	const getParams = {
		TableName: "quiztopia",
		Key: {
			pk: { S: `QUIZ#${quizId}` },
			sk: { S: "METADATA" },
		},
	};

	const { Item } = await client.send(new GetItemCommand(getParams));

	if (!Item) {
		throw new createHttpError.NotFound("Quiz not found");
	}

	const quiz = unmarshall(Item);

	if (quiz.creatorId !== userId) {
		// 403 Forbidden means "I know who you are, but you don't have permission to do this."
		throw new createHttpError.Forbidden("You are not the owner of this quiz");
	}
	// --- End of Authorization Check ---

	const questionId = uuidv4();
	const questionItem = {
		pk: { S: `QUIZ#${quizId}` }, // Same partition key as the quiz
		sk: { S: `QUESTION#${questionId}` }, // Unique sort key for the question
		questionText: { S: questionText },
		answer: { S: answer },
		latitude: { N: String(latitude) }, // DynamoDB numbers are sent as strings
		longitude: { N: String(longitude) },
	};

	const putParams = {
		TableName: "quiztopia",
		Item: questionItem,
	};

	await client.send(new PutItemCommand(putParams));

	return {
		statusCode: 201,
		body: JSON.stringify({
			message: "Question added successfully",
			questionId: questionId,
		}),
	};
};

export const handler = middy(baseHandler)
	.use(jsonBodyParser())
	.use(authMiddleware()) // Protect the endpoint
	.use(httpErrorHandler());
