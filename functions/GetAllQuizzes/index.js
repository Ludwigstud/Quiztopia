import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";

const baseHandler = async (event) => {
	const params = {
		TableName: "quiztopia",

		IndexName: "AllQuizzesIndex",

		KeyConditionExpression: "sk = :sk",
		ExpressionAttributeValues: {
			":sk": { S: "METADATA" },
		},
	};

	const { Items } = await client.send(new QueryCommand(params));

	const quizzes = Items.map((item) => unmarshall(item));

	return {
		statusCode: 200,
		body: JSON.stringify(quizzes),
	};
};

export const handler = middy(baseHandler).use(httpErrorHandler());
