Quiztopia API

Detta projekt är en serverless REST-tjänst som driver "Quiztopia", en platsbaserad quiz-applikation. Byggd som en individuell examination, hanterar API:et användarautentisering med JWT, skapande och hantering av quiz med tillhörande frågor, samt poängsättning med topplistor. Skyddade ändpunkter säkerställer att endast ägaren av ett quiz kan modifiera det.

Projektet är utvecklat i Node.js med Serverless Framework på AWS och använder Lambda, API Gateway och DynamoDB (Single-Table Design). Middy.js används för att hantera all middleware, inklusive validering och autentisering.
