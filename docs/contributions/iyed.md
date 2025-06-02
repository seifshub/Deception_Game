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
  - For clear separation of concerns, and due to different payloads per notification, each notification subtype extends the notification base.
- **Server-Sent Events (SSE)**
    - SSE Endpoint: Exposed an endpoint that clients can subscribe to get notifications in real time.

### 5. Payment Feature (Stripe Integration)
- Stripe Checkout
- Webhook Handling
