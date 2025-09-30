import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";

const baseHandler = async (event) => {
	const { quizId } = event.pathParameters;

	const params = {
		TableName: "quiztopia",
		KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk_prefix)",
		ExpressionAttributeValues: {
			":pk": { S: `QUIZ#${quizId}` },
			":sk_prefix": { S: "SCORE#" },
		},
		
		ScanIndexForward: false,
		
		Limit: 10,
	};

	const { Items } = await client.send(new QueryCommand(params));

	const leaderboard = Items.map((item) => unmarshall(item));

	return {
		statusCode: 200,
		body: JSON.stringify(leaderboard),
	};
};

export const handler = middy(baseHandler).use(httpErrorHandler());
