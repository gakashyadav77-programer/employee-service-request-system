const db = require("./config/db");

async function setupDatabase() {
  try {
    console.log("Creating database tables...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('employee', 'manager', 'admin') NOT NULL DEFAULT 'employee',
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category ENUM('IT', 'HR', 'Facility') NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
        status ENUM('Open', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
        assigned_to INT NULL,
        sla_due_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS request_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (request_id) REFERENCES service_requests(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("Users table created successfully.");
    console.log("Service requests table created successfully.");
    console.log("Request activity table created successfully.");
    console.log("Database setup completed.");

    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
}

setupDatabase();