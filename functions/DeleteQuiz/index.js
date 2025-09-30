import { QueryCommand, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import authMiddleware from "../../middleware/authMiddleware.js";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
	const { quizId } = event.pathParameters;
	const { userId } = event.user;

	const queryParams = {
		TableName: "quiztopia",
		KeyConditionExpression: "pk = :pk",
		ExpressionAttributeValues: {
			":pk": { S: `QUIZ#${quizId}` },
		},
	};

	const { Items } = await client.send(new QueryCommand(queryParams));

	if (!Items || Items.length === 0) {
		throw new createHttpError.NotFound("Quiz not found");
	}

	const quizMetadata = unmarshall(Items.find((item) => item.sk.S === "METADATA"));

	if (quizMetadata.creatorId !== userId) {
		throw new createHttpError.Forbidden("You are not the owner of this quiz");
	}

	const deleteRequests = Items.map((item) => ({
		DeleteRequest: {
			Key: {
				pk: item.pk,
				sk: item.sk,
			},
		},
	}));

	const batchDeleteParams = {
		RequestItems: {
			quiztopia: deleteRequests,
		},
	};

	await client.send(new BatchWriteItemCommand(batchDeleteParams));

	return {
		statusCode: 204,
	};
};

export const handler = middy(baseHandler).use(authMiddleware()).use(httpErrorHandler());
