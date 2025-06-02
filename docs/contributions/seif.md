## Seif Eddine Chouchane Contributions:

1.  **Core Entity Design and Implementation:**

    - **`Topic` Entity:** Defines topic structure and activation logic for categorizing prompts.
    - **`Prompt` Entity:** Models game prompts and their relationships to topics.
    - **`Vote` Entity:** Captures voting behavior from players during the deception phase.
    - **`PlayerResponse` Entity:** Records player-submitted answers and tracks correctness.

2.  **Service Layer Implementation:**

    - **`TopicsService`:** Handles topic creation, update, activation, and listing.
    - **`PromptsService`:** Manages CRUD and validation logic for prompts.
    - **`VotesService`:** Processes vote submissions and enforces voting rules.
    - **`ResponsesService`:** Handles player answers and correct answer checking.
    - **`VotesValidator`:** Validates voting eligibility and prevents duplicate votes.
    - **`ResponsesValidator`:** Ensures response format and game phase consistency.

3.  **GraphQL API for Game Management:**

    - **`TopicsResolver`:** Exposes GraphQL queries and mutations for topic management.
    - **`PromptsResolver`:** Exposes GraphQL queries and mutations for prompt management.

4.  **Custom Logging Middleware:**

    - **`LoggerMiddleware`:** Implements detailed, secure logging for all HTTP traffic.

5.  **Custom Exception Filters:**
    - **`GlobalExceptionFilter`:** Catches and logs unhandled exceptions (HTTP/GraphQL).
    - **`WebSocketExceptionFilterWebSocketExceptionFilter`:** Structures and emits real-time WebSocket error messages.