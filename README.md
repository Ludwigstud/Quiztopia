Quiztopia API

This project is a serverless REST API that powers "Quiztopia," a location-based quiz application. Built as an individual examination, the API handles user authentication with JWT, creation and management of quizzes with associated questions, and a scoring system with leaderboards. Protected endpoints ensure that only the owner of a quiz can modify it.

The project is developed in Node.js with the Serverless Framework on AWS, utilizing Lambda, API Gateway, and DynamoDB (Single-Table Design). Middy.js is used to handle all middleware, including validation and authentication.
