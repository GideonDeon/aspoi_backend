# ASPOI Backend

**ASPOI Backend** is the server-side application for the ASPOI project.  
It provides a RESTful API, data models, and database integration for the ASPoi platform.  
This backend is built with **Node.js / Next.js** and uses **Prisma** as the ORM for database access.

---

## Project Structure

Available in this repo

---

## Getting Started

Follow these steps to get the backend up and running locally:

## 1. Clone the repository

```bash
git clone https://github.com/GideonDeon/aspoi_backend.git
cd aspoi_backend
```
## 2. Install dependencies
- npm install


## 3. Set up environment variables

Create a .env file at the root and provide necessary variables

 ## **Database**

This project uses Prisma as the ORM:

### Generate Prisma Client
npx prisma generate

### Run Migrations
npx prisma migrate dev --name init

## **Running the App**

Start the development server:

- npm run dev



The server should be running on:

http://localhost:3000


You can explore API routes under app/api/….

## License

This project is licensed under the MIT License.

