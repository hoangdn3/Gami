const API_BASE_URL = 'https://ai-math.clevai.edu.vn/quiz/load-quizs';

let QUESTIONS = [];

function getLearningObjectCode() {
    const url = window.location.href;
    const match = url.match(/learning_object_code=([^&\/]+)/);
    return match ? match[1] : null;
}

function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

function convertApiResponseToQuestions(apiResponse) {
    if (!apiResponse.status || !apiResponse.quizzes) {
        throw new Error('Invalid API response');
    }

    return apiResponse.quizzes.map(quiz => {
        const options = quiz.quiz_possible_options
            .sort((a, b) => a.option_code.localeCompare(b.option_code));

        const answers = {};
        options.forEach(opt => {
            answers[opt.option_code] = opt.option_value;
        });

        return {
            question: quiz.content,
            answers: answers,
            correct: quiz.quiz_answers.option_code,
            quizCode: quiz.quiz_code
        };
    });
}

async function loadQuestionsFromApi() {
    const learningObjectCode = getLearningObjectCode();

    if (!learningObjectCode) {
        throw new Error('learning_object_code not found in URL. URL format: ?learning_object_code=XXX');
    }

    const apiUrl = `${API_BASE_URL}?learning_object_code=${encodeURIComponent(learningObjectCode)}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    QUESTIONS = convertApiResponseToQuestions(data);

    return QUESTIONS;
}
