import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";

const baseHandler = async (event) => {
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

	if (!Item) {
		throw new createHttpError.Unauthorized("Invalid credentials");
	}

	const user = {
		hashedPassword: Item.hashedPassword.S,
		userId: Item.userId.S,
	};

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

export const handler = middy(baseHandler).use(jsonBodyParser()).use(httpErrorHandler());
