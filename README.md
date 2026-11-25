# ERP Application

This repository contains the ERP application's backend and frontend:

- **`erp/`** — ASP.NET Core / .NET backend project.
- **`erp.client/`** — React.js frontend project.
- **`sql_queries`** — SQL script(s) required to create and initialize the database.

## Prerequisites

Install the following before running the application:

- **Visual Studio 2022**, including the **ASP.NET and web development** workload.
- The **.NET SDK** version required by the backend project. Check the `TargetFramework` value in the `.csproj` file inside `erp/` and install the SDK.
- **Node.js (LTS)** and npm.
- The Microsoft SQL Server database server and database management tool.
- **Git** (only needed to clone or update the repository).

## 1. Get the source code

Clone the repository, or open the existing local copy:

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_FOLDER>
```

If you already have the project on your computer, open a terminal in the repository's root directory instead.

## 2. Set up the database

1. Start the database server.
2. Open the `sql_queries` file (or the SQL scripts provided with the project) using a database management tool compatible with the project's database engine.
3. Execute the queries **in the order provided**. These queries should create the required database objects and any initial data needed by the application.
4. Confirm that the database and required tables were created successfully.

> **Important:** Back up any existing database before running scripts that modify or delete data. If the scripts are split across multiple files, run them in the documented order.

## 3. Configure the .NET backend

1. Open the solution (`.sln`) in the `erp/` folder with **Visual Studio 2022**.
2. Configure the backend's database connection string. Look for the `ConnectionStrings` section in `appsettings.json`.
3. Set the connection string to point to the database created in Step 2. Use your own database server name, database name, and credentials.
4. Restore NuGet packages if Visual Studio does not do so automatically.
5. Select the backend project as the startup project and run it using **F5** or **Ctrl+F5**.
6. Note the backend URL shown in Visual Studio's output or browser. The frontend may need this URL for its API configuration.

## 4. Install and run the React.js frontend

Open a **separate** Command Prompt or terminal window and change to the frontend directory:

```bash
cd erp.client
```

Install the frontend dependencies (this is normally needed the first time, or after dependency changes):

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

When Vite starts, open the local address shown in the terminal. The default address for this project is:

**http://localhost:5173/**

Keep the terminal running while using the frontend.

## 5. Verify the application

- Make sure the database server is running and the database is accessible.
- Make sure the .NET backend is running in Visual Studio 2022.
- Make sure the React development server is running in the frontend terminal.

## Troubleshooting

- **Database connection fails:** Verify the database server is running, the database exists, and the backend connection string is correct.
- **NuGet or .NET build errors:** Confirm that the required .NET SDK is installed and restore the NuGet packages.
- **`npm` is not recognized:** Install Node.js (which includes npm), reopen the terminal, and run `node --version` and `npm --version` to verify the installation.
- **Frontend cannot reach the backend:** Confirm the backend is running, check the configured API URL, and review the backend's CORS settings.
- **Port 5173 is already in use:** Stop the other process using that port.

---
