import { PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js"; // <-- Correctly importing your shared client
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";

export const baseHandler = async (event) => {
	const { username, password } = event.body;

	if (!username || !password) {
		throw new createHttpError.BadRequest("Username and password are required");
	}

	const getParams = {
		TableName: "quiztopia",
		Key: {
			pk: { S: `USER#${username}` },
			sk: { S: "PROFILE" },
		},
	};

	const { Item } = await client.send(new GetItemCommand(getParams));

	if (Item) {
		throw new createHttpError.Conflict("Username already edxists");
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const userId = uuidv4();
	const createdAt = new Date().toISOString();

	const putParams = {
		TableName: "quiztopia",
		Item: {
			pk: { S: `USER#${username}` },
			sk: { S: "PROFILE" },
			userId: { S: userId },
			hashedPassword: { S: hashedPassword },
			createdAt: { S: createdAt },
		},
	};

	try {
		await client.send(new PutItemCommand(putParams));
	} catch (error) {
		throw new createHttpError.Conflict("Username already exists");
	}
	return {
		statusCode: 201,
		body: JSON.stringify({
			message: "User registered successfully",
			userId: userId,
		}),
	};
};

export const handler = middy(baseHandler).use(jsonBodyParser()).use(httpErrorHandler());
