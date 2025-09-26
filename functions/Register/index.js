import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import {client} from "../../services/db";



export const handler = (event) => {
	const { username, password } = event.body;

    const sendData = new client.PutItemCommand({

        TableName: ""

    })

    
};
