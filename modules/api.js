import pool from "./db.js";


/**
 * Retrieves all categories from the database.
 * @returns {Promise<Array>} An array of category objects.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const getAllCategories = async () => {
    try {
        const query = {
            text: `SELECT * FROM QuestionCategoryInfo`
        };

        const { rows } = await pool.query(query);
        return rows;

    } catch (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
    }
}

/**
 * Adds a new quiz category to the database.
 * @param {string} name - The name of the quiz category.
 * @returns {Object} An object indicating the result of the operation.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const addQuizCategory = async (name) => {
    try {
        const query = {
            text: `INSERT INTO QuestionCategoryInfo(category_name) VALUES ($1)`,
            values: [name]
        }
        const { rowCount } = await pool.query(query);

        return (rowCount === 1) ? {
            statusCode: 201,
            message: "Quiz Category added"
        } : {
            statusCode: 400,
            message: "Unable to add a category"
        }

    } catch (error) {
        console.error(`Error in addQuizCategory() call ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}

/**
 * Updates a quiz category in the database.
 * @param {number} id - The ID of the category to update.
 * @param {string} name - The new name for the category.
 * @returns {Object} An object indicating the result of the update.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const updateQuizCategory = async (id, name) => {
    try {
        const query = {
            text: `
            UPDATE QuestionCategoryInfo
            SET category_name = $2
            WHERE category_id = $1
            `,
            values: [id, name]
        }

        const { rowCount } = await pool.query(query);
        return (rowCount === 1) ? {
            statusCode: 204,
            message: "Quiz Category updated"
        } : {
            statusCode: 400,
            message: "Unable to update quiz category"
        }
    } catch (error) {
        console.error(`Error in updateQuizCategory() call: ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}

/**
 * Deletes a quiz category from the database.
 * @param {number} id - The ID of the category to delete.
 * @returns {Object} An object indicating the result of the delete operation.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const deleteQuizCategory = async (id) => {
    try {
        const query = {
            text: `
            DELETE FROM QuestionCategoryInfo
            WHERE category_id = $1
            `,
            values: [id]
        }

        const { rowCount } = await pool.query(query);
        return (rowCount === 1) ? {
            statusCode: 204,
            message: "Quiz Category deleted"
        } : {
            statusCode: 404,
            message: "Category not found"
        }
    } catch (error) {
        console.error(`Error in deleteQuizCategory() call: ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}

export const getAllQuestions = async () => {
    try {
        const query = {
            text: `
            SELECT * FROM QuestionsInfo  qi
            JOIN QuestionCategoryInfo qci
                ON qci.category_id = qi.category_id
            JOIN OptionsInfo  oi
                ON oi.question_id = qi.question_id
            ORDER BY qi.question_id`
        }

        const { rows } = await pool.query(query);

        return rows;
    } catch (error) {
        console.error(`Error in getAllQuestions() call ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}

export const getAllQuestionsByMode = async (is_training) => {
    try {
        const query = {
            text: `
            SELECT 
            qi.question_id,
            qi.question_text,
            oi.option_id,
            oi.option_text
             FROM QuestionsInfo  qi
            JOIN QuestionCategoryInfo qci
                ON qci.category_id = qi.category_id
            JOIN OptionsInfo  oi
                ON oi.question_id = qi.question_id
            WHERE qi.is_training = $1
            ORDER BY qi.question_id`,
            values: [is_training]
        }

        const { rows } = await pool.query(query);
        return rows;
    } catch (error) {
        console.error(`Error in getAllQuestionsByMode() call ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        }
    }
}


/**
 * Adds a new question, options, and correct option to the database.
 * @param {string} question_text - The text of the question.
 * @param {number} category_id - The ID of the category the question belongs to.
 * @param {boolean} is_training - Indicates if the question is for training.
 * @param {string[]} options - An array of option texts.
 * @param {string} correct_option - The correct option text.
 * @returns {Object} An object indicating the result of the operation.
 * @throws {Error} Throws an error if there's an issue with the database query.
 */
export const addQuestionWithOptions = async (question_text, category_id, is_training, options, correct_option) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Insert question
        const questionResult = await client.query(`
            INSERT INTO QuestionsInfo(question_text, category_id, is_training)
            VALUES ($1, $2, $3)
            RETURNING question_id
        `, [question_text, category_id, is_training]);

        const question_id = questionResult.rows[0].question_id;

        // Step 2: Insert options
        const optionValues = options.map(option_text => [question_id, option_text, options.indexOf(option_text) === correct_option]);
        await client.query(`
            INSERT INTO OptionsInfo(question_id, option_text, is_correct)
            VALUES ${optionValues.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ')}
        `, optionValues.flat());

        await client.query('COMMIT');

        return {
            statusCode: 201,
            message: "Question and options added successfully",
            question_id: question_id
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error in addQuestionWithOptions() call: ${error}`);
        return {
            statusCode: 501,
            message: "Internal Server Error."
        };
    } finally {
        client.release();
    }
}


export const saveUserResponses = async (userId, responses) => {
    const client = await pool.connect();
    try {

        await client.query('BEGIN');

        const testIdQuery = {
            text: `INSERT INTO TestInfo(user_id) VALUES($1) RETURNING test_id`,
            values: [userId]
        }

        const testIdResults = await client.query(testIdQuery);

        const testId = testIdResults.rowCount === 1 ? testIdResults.rows[0].test_id : 0;

        if (testId == 0) {
            await client.query('ROLLBACK');
            return {
                statusCode: 501,
                message: "Error submitting responses",
            }
        } else {
            let query = `INSERT INTO ResponseInfo(test_id, user_id, question_id, user_option_id) VALUES`;

            const insertValues = responses.map(response => {
                const [questionId, optionId] = response;
                return `(${testId}, '${userId}', ${questionId}, ${optionId})`; // Return each value set
            });
            query += insertValues.join(', '); // Combine all value sets

            // Now, query contains the complete insert statement
            await client.query(query);
        }


        const scoreResultQuery = {
            text: `
            SELECT 
                ri.test_id, 
                ri.user_id, 
                ri.question_id, 
                ri.user_option_id, 
                oi.option_text, 
                qi.question_text, 
                oi.is_correct,
                COUNT(CASE WHEN oi.is_correct THEN 1 END) OVER() AS correct_count
                FROM 
                ResponseInfo ri 
                JOIN 
                OptionsInfo oi 
                ON 
                ri.user_option_id = oi.option_id
                JOIN 
                QuestionsInfo qi 
                ON 
                qi.question_id = ri.question_id
                WHERE 
                ri.test_id = $1
                `,
            values: [testId]
        }

        const resultSummary = await client.query(scoreResultQuery);

        const finalScore = resultSummary.rows[0].correct_count;

        await client.query("COMMIT");
        return {
            statusCode: 200,
            message: "Responses submitted successfully",
            resultSummary: resultSummary.rows,
            finalScore: finalScore
        }

    } catch (error) {
        console.error(`Error in saveUserResponses() call: ${error} `);
        await client.query('ROLLBACK');
        return {
            statusCode: 500,
            message: "Internal Server Error",
            error: error.message
        }
    } finally {
        await client.release();
    }
}


export const updateQuestionCategory = async (questionId, categoryId, questionText) => {
    try {
        const query = {
            text: `
            UPDATE QuestionsInfo 
            SET category_id = $2, question_text = $3
            WHERE question_id = $1
            `,
            values: [questionId, categoryId, questionText]
        }

        const { rowCount } = await pool.query(query);

        return (rowCount == 1) ? {
            statusCode: 200,
            success: true,
            message: 'Question Category updated'
        } : {
            statusCode: 404,
            success: false,
            message: 'Question Id not found'
        }
    } catch (error) {
        console.error(`Error in updateQuestionCategory() call ${error}`);
        return {
            statusCode: 501,
            success: false,
            message: "Internal server error"
        }
    }
}

export const submitQuestionReport = async (userId, questionId, description) => {
    try {
        const query = {
            text: `
            INSERT INTO 
            ReportsInfo(user_id, question_id, report_description)
            VALUES($1, $2, $3)
            `,
            values: [userId, questionId, description]
        }

        const { rowCount } = await pool.query(query);

        return rowCount == 1 ? {
            statusCode: 201,
            success: true,
            message: 'Report submitted successfully'
        } : {
            statusCode: 400,
            success: false,
            message: 'Unable to submit report'
        }
    } catch (error) {
        console.error(`Error in submitQuestionReport() call ${error}`);
        return {
            statusCode: 501,
            success: false,
            message: "Internal server error"
        }
    }
}