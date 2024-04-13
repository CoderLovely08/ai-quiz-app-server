import pool from "./db.js";

/**
 * Authenticates admin credentials.
 * @param {string} username - The admin username.
 * @param {string} password - The admin password.
 * @returns {Object} An object indicating the result of the authentication.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const authenticateAdminCredentials = async (username, password) => {
    try {
        const query = {
            text: `
                SELECT admin_id, admin_name
                FROM AdminInfo
                WHERE 
                    admin_user_name = $1
                AND admin_password = $2
            `,
            values: [username, password]
        }

        const { rowCount, rows } = await pool.query(query);

        return (rowCount === 1) ? {
            statusCode: 200,
            message: "Login Successful!",
            admin_id: rows[0].admin_id,
            admin_name: rows[0].admin_name,

        } : {
            statusCode: 401,
            message: "Invalid credentials. Please try again."
        }
    } catch (error) {
        console.error(`Error authenticating admin credentials: ${error.message}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}