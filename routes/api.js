import express from 'express'
const router = express.Router();
import cors from 'cors'
import { config } from 'dotenv'
config()

// Import admin module
import {
    getAllCategories,
    addQuizCategory,
    updateQuizCategory,
    deleteQuizCategory,
    getAllQuestions,
    getAllQuestionsByMode,
    addQuestionWithOptions,
    saveUserResponses,
    updateQuestionCategory,
    submitQuestionReport
} from '../modules/api.js'


// Parse JSON request bodies
router.use(express.json());

// Parse URL-encoded request bodies
router.use(express.urlencoded({ extended: true }));

router.route('/quiz/category')
    .get(async (req, res) => {
        try {
            const result = await getAllCategories();
            res.json(result);
        } catch (error) {
            console.error(`Error in GET /api/quiz/category route: ${error}`);
            res.json({
                statusCode: 404,
                message: 'Bad Request',
                error: error
            })
        }
    })
    .post(async (req, res) => {
        try {
            // Handle get request for users
            const { name } = req.body;
            const result = await addQuizCategory(name);
            res.json(result);
        } catch (error) {
            console.error(`Error in POST /api/quiz/category route: ${error}`);
            res.statusCode.json({
                statusCode: 404,
                message: 'Bad Request'
            })
        }
    })
    .put(async (req, res) => {
        try {
            const { id, name } = req.body;
            const result = await updateQuizCategory(id, name);
            res.json(result);
        } catch (error) {
            console.error(`Error in PUT /api/quiz/category route: ${error}`);
            res.statusCode.json({
                statusCode: 404,
                message: 'Bad Request'
            })
        }
    })
    .delete(async (req, res) => {
        try {
            const { id } = req.body;
            const result = await deleteQuizCategory(id);
            res.json(result);
        } catch (error) {
            console.error(`Error in DELETE /api/quiz/category route: ${error}`);
            res.json({
                statusCode: 404,
                message: 'Bad Request',
                error: error
            })
        }
    })

router.route('/quiz/questions')
    .get(async (req, res) => {
        try {
            const result = await getAllQuestions();

            const questionMap = new Map();

            result.forEach(item => {
                const { question_id, option_id, option_text, is_correct } = item;

                if (questionMap.has(question_id)) {
                    const question = questionMap.get(question_id);
                    question.options.push({
                        option_id,
                        option_text,
                        is_correct
                    });
                } else {
                    questionMap.set(question_id, {
                        question_id: item.question_id,
                        question_text: item.question_text,
                        category_id: item.category_id,
                        category_name: item.category_name,
                        is_training: item.is_training,
                        options: [{
                            option_id,
                            option_text,
                            is_correct
                        }]
                    });
                }
            });

            const output = [...questionMap.values()];
            res.json(output);
        } catch (error) {
            console.error(`Error in GET /api/quiz/questions route: ${error}`);
            res.json({
                statusCode: 404,
                message: 'Bad Request',
                error: error
            })
        }
    })
    .post(async (req, res) => {
        try {
            const { category_id, correct_option, is_training, options, question_text } = req.body;

            // Insert the new question into the QuestionsInfo table
            const result = await addQuestionWithOptions(question_text, category_id, is_training, options, correct_option);

            res.json({
                statusCode: 201,
                message: 'Question added successfully'
            });
        } catch (error) {
            console.error(`Error in POST /api/quiz/questions route: ${error}`);
            res.json({
                statusCode: 500,
                message: 'Internal Server Error'
            });
        }
    })
    .put(async (req, res) => {
        try {
            const { questionId, questionText, categoryId } = req.body;
            const result = await updateQuestionCategory(questionId, categoryId, questionText);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.message
            })
        } catch (error) {
            console.error(`Error in put /api/quiz/questions route: ${error}`);
            res.json({
                statusCode: 500,
                message: 'Internal Server Error'
            });
        }
    })


router.route('/quiz/test')
    .get(async (req, res) => {
        try {
            const result = await getAllQuestionsByMode(req.query.isTraining);

            let selectedQuestionIds = new Set();

            // Use Fisher-Yates shuffle algorithm to shuffle the questions
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }

            // Keep selecting until you have exactly 30 unique question IDs
            for (let i = 0; selectedQuestionIds.size < 30 && i < result.length; i++) {
                selectedQuestionIds.add(result[i].question_id);
            }

            // Convert the set back to an array if needed
            selectedQuestionIds = Array.from(selectedQuestionIds);

            const questionMap = new Map();

            result.forEach(item => {
                const { question_id } = item;

                if (!questionMap.has(question_id) && selectedQuestionIds.includes(question_id)) {
                    questionMap.set(question_id, {
                        question_id: item.question_id,
                        question_text: item.question_text,
                        category_id: item.category_id,
                        category_name: item.category_name,
                        is_training: item.is_training,
                        options: []
                    });
                }

                const optionItem = {
                    option_id: item.option_id,
                    option_text: item.option_text
                }
                questionMap.get(question_id)?.options.push(optionItem);
            });

            const output = [...questionMap.values()];
            res.json(output);
        } catch (error) {
            console.error(`Error in /quiz/test GET request: ${error}`);
            res.status(500).json({
                message: "Internal Server Error."
            });
        }
    })
    .post(async (req, res) => {
        try {
            const { uId, responses } = (req.body);

            const result = await saveUserResponses(uId, responses);

            let summary = [];
            if (result.statusCode === 200) {
                result.resultSummary.forEach(question => {
                    const item = {
                        question: question.question_text,
                        option: question.option_text,
                        isCorrect: question.is_correct,
                    }
                    summary.push(item)
                })
            }

            res.json({
                result: result,
                summary: summary,
            })
        } catch (error) {
            console.log(`Error in POST /api/quiz/test route: ${error}`);
        }
    })


router.route('/report-question')
    .post((async (req, res) => {
        try {
            const { questionId, userId, description } = req.body;

            const result = await submitQuestionReport(userId, questionId, description);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.message
            })

        } catch (error) {
            console.log(`Error in POST /api/quiz/test route: ${error}`);
        }
    }))
export default router;
