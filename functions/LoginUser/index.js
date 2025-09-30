import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { client } from "../../services/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import createHttpError from "http-errors";

// This is the main logic for handling a login attempt.
const baseHandler = async (event) => {
    const { username, password } = event.body;

    // 1. Basic validation to ensure we received a username and password.
    if (!username || !password) {
        throw new createHttpError.BadRequest("Username and password are required");
    }

    // 2. Prepare the command to fetch the user from DynamoDB.
    const getParams = {
        TableName: "quiztopia",
        Key: {
            pk: { S: `USER#${username}` },
            sk: { S: "PROFILE" },
        },
    };

    const { Item } = await client.send(new GetItemCommand(getParams));

    // 3. If no Item is returned, the user does not exist. We send a generic
    //    "Unauthorized" error to avoid telling attackers that the username is valid.
    if (!Item) {
        throw new createHttpError.Unauthorized("Invalid credentials");
    }

    // 4. Manually "unmarshall" the user data from DynamoDB format.
    //    We need the hashedPassword to compare it.
    const user = {
        hashedPassword: Item.hashedPassword.S,
        userId: Item.userId.S
    };

    // 5. Use bcrypt.compare to securely check if the provided password
    //    matches the stored hash. This is the core of the authentication logic.
    const isMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isMatch) {
        // If it doesn't match, the password was incorrect.
        throw new createHttpError.Unauthorized("Invalid credentials");
    }

    // 6. If the password is correct, create a JSON Web Token (JWT).
    //    This token will be used to authenticate the user for protected endpoints.
    const token = jwt.sign(
        { userId: user.userId, username: username },
        process.env.JWT_SECRET, // Your secret key from serverless.yml
        { expiresIn: "1h" }      // The token will be valid for 1 hour
    );

    // 7. Return a success response with the token.
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Login successful",
            token: token,
        }),
    };
};

// Wrap the handler with Middy middleware.
export const handler = middy(baseHandler)
    .use(jsonBodyParser())
    .use(httpErrorHandler());