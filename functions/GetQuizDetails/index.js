import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	const { quizId } = event.pathParameters;

	const params = {
		TableName: "quiztopia",

		KeyConditionExpression: "pk = :pk",
		ExpressionAttributeValues: {
			":pk": { S: `QUIZ#${quizId}` },
		},
	};

	const { Items } = await client.send(new QueryCommand(params));

	if (!Items || Items.length === 0) {
		throw new createHttpError.NotFound("Quiz not found");
	}

	const allItems = Items.map((item) => unmarshall(item));

	const quizDetails = allItems.find((item) => item.sk === "METADATA");

	const questions = allItems.filter((item) => item.sk.startsWith("QUESTION#"));

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
