import { PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";


const registerUserSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                username: { type: 'string', minLength: 1 }, 
                password: { type: 'string', minLength: 1 } 
            },
            required: ['username', 'password'],
            additionalProperties: false 
        }
    }
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

    if (Item) {
        throw new createHttpError.Conflict("Username already exists");
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
        ConditionExpression: "attribute_not_exists(pk)"
    };

    try {
        await client.send(new PutItemCommand(putParams));
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            throw new createHttpError.Conflict("Username already exists");
        }
        throw error;
    }

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: "User registered successfully",
            userId: userId,
        }),
    };
};


export const handler = middy(baseHandler)
    .use(jsonBodyParser())
    .use(validator({ eventSchema: transpileSchema(registerUserSchema) }))
    .use(httpErrorHandler());