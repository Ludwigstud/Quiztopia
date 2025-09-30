import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	// Get the quizId from the URL path (e.g., /quizzes/{quizId})
	const { quizId } = event.pathParameters;

	const params = {
		TableName: "quiztopia",
		// We query the main table using the Partition Key
		KeyConditionExpression: "pk = :pk",
		ExpressionAttributeValues: {
			":pk": { S: `QUIZ#${quizId}` },
		},
	};

	const { Items } = await client.send(new QueryCommand(params));

	if (!Items || Items.length === 0) {
		throw new createHttpError.NotFound("Quiz not found");
	}

	// Convert all returned items (quiz metadata + questions) to normal objects
	const allItems = Items.map((item) => unmarshall(item));

	// The first item will be the quiz metadata (where sk is 'METADATA')
	const quizDetails = allItems.find((item) => item.sk === "METADATA");
	// The rest will be the questions
	const questions = allItems.filter((item) => item.sk.startsWith("QUESTION#"));

	// Combine them into a clean response object
	const response = {
		...quizDetails,
		questions: questions,
	};

	return {
		statusCode: 200,
		body: JSON.stringify(response),
	};
};

export const handler = middy(baseHandler).use(httpErrorHandler());
