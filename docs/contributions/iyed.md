## Iyed Abdelli Contributions:

### 1. Generics
- **Base Entity**  
  `BaseEntity` class to standardize common fields (e.g., `id`, `createdAt`, `updatedAt`) across all database entities.
- **Generic CRUD Service**  
- **Generic Resolver (GraphQL)**  

### 2. Authentication & Authorization
- Session-Based Authentication  
- Role-Based Access Control
    - Roles: `regular`, `admin`

### 3. Friendship Feature
- Manage Friends
    - Send/Accept/Reject Requests
    - Friend List

### 4. Notifications & Real-Time Updates
- **Notification Entities**
  - Defined an abstract notification class that contains common fields.
  - For clear separation of concerns, and due to different payloads for each notification type, each notification subtype extends the base notification class.
- **Server-Sent Events (SSE)**
  - SSE Endpoint: Exposed an endpoint that clients can subscribe to in order to receive notifications in real time.
### 5. Payment Feature (Stripe Integration)
- Stripe Checkout
- Webhook Handling
