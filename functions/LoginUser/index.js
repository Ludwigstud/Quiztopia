import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { client } from "../../services/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";

const loginSchema = {
	type: "object",
	properties: {
		body: {
			type: "object",
			properties: {
				username: { type: "string", minLength: 1 },
				password: { type: "string", minLength: 1 },
			},
			required: ["username", "password"],
			additionalProperties: false,
		},
	},
};

const baseHandler = async (event) => {
	const { username, password } = event.body;

	const getParams = {
		TableName: "quiztopia",
		Key: {
			pk: { S: `USER#${username}` },
			sk: { S: "PROFILE" },
		},
	};

	const { Item } = await client.send(new GetItemCommand(getParams));

	if (!Item) {
		throw new createHttpError.Unauthorized("Invalid credentials");
	}

	const user = unmarshall(Item);

	const isMatch = await bcrypt.compare(password, user.hashedPassword);

	if (!isMatch) {
		throw new createHttpError.Unauthorized("Invalid credentials");
	}

	const token = jwt.sign({ userId: user.userId, username: username }, process.env.JWT_SECRET, {
		expiresIn: "1h",
	});

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "Login successful",
			token: token,
		}),
	};
};

export const handler = middy(baseHandler)
	.use(jsonBodyParser())
	.use(validator({ eventSchema: transpileSchema(loginSchema) }))
	.use(httpErrorHandler());
