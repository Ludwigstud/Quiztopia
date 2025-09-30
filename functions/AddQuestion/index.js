import { PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import authMiddleware from "../../middleware/authMiddleware.js";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	const { quizId } = event.pathParameters;

	const { questionText, answer, latitude, longitude } = event.body;

	const { userId } = event.user;

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
		throw new createHttpError.Forbidden("You are not the owner of this quiz");
	}

	const questionId = uuidv4();
	const questionItem = {
		pk: { S: `QUIZ#${quizId}` },
		sk: { S: `QUESTION#${questionId}` },
		questionText: { S: questionText },
		answer: { S: answer },
		latitude: { N: String(latitude) },
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
	.use(authMiddleware())
	.use(httpErrorHandler());
