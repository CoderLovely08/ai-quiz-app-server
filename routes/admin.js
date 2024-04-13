import express from 'express'
const router = express.Router();
import cors from 'cors'
import { config } from 'dotenv'
config()

// Import admin module
import { authenticateAdminCredentials } from '../modules/admin.js'


// Parse JSON request bodies
router.use(express.json());

// Parse URL-encoded request bodies
router.use(express.urlencoded({ extended: true }));

router.post('/login', async (req, res) => {
    try {
        // Handle get request for users
        const { username, password } = req.body;
        const result = await authenticateAdminCredentials(username, password);
        res.json(result);
    } catch (error) {
        console.error(`Error in POST /admin/login route: ${error}`);
        res.statusCode.json({
            statusCode: 404,
            message: 'Bad Request'
        })
    }
});

export default router;
