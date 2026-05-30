import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        // Step 1 — Get files and data from frontend
        const formData = await request.formData();

        const questionPaper = formData.get('questionPaper');
        const syllabus = formData.get('syllabus');
        const totalMarks = formData.get('totalMarks');
        const pattern = formData.get('pattern');

        // Step 2 — Validate required fields
        if (!questionPaper) {
            return Response.json(
                { error: 'Question paper is required' },
                { status: 400 }
            );
        }

        if (!totalMarks) {
            return Response.json(
                { error: 'Total marks is required' },
                { status: 400 }
            );
        }

        // Step 3 — Start building contentParts with question paper
        const contentParts = [];

        // Process question paper — always a file (pdf, image, or docx)
        const qpParts = await processFileInput(questionPaper, 'Question Paper');
        contentParts.push(...qpParts);

        // Step 4 — Process syllabus
        let syllabusText = null;
        let s = 0; // 0 = text, 1 = file

        if (typeof syllabus === 'string') {
            syllabusText = syllabus;
            s = 0;
        } else if (syllabus && typeof syllabus === 'object' && syllabus.arrayBuffer) {
            const syllabusParts = await processFileInput(syllabus, 'Syllabus');
            contentParts.push(...syllabusParts);
            s = 1;
        }

        // Step 5 — Process pattern
        let patternText = null;
        let p = 0; // 0 = text, 1 = file

        if (pattern) {
            if (typeof pattern === 'string') {
                patternText = pattern;
                p = 0;
            } else if (typeof pattern === 'object' && pattern.arrayBuffer) {
                const patternParts = await processFileInput(pattern, 'Paper Pattern');
                contentParts.push(...patternParts);
                p = 1;
            }
        }

        // Step 6 — Build prompt and add as last item
        const prompt = buildPrompt(totalMarks, s, p, syllabusText, patternText);
        contentParts.push({ text: prompt });

        // Step 7 — Send to Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent(contentParts);
        const responseText = result.response.text();

        // Step 8 — Clean and parse Gemini's response
        const cleanJSON = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const analysisResult = JSON.parse(cleanJSON);

        // Step 9 — Send result back to frontend
        return Response.json({ success: true, data: analysisResult });

    } catch (error) {
        console.error('Analysis error:', error.message);
        console.error('Full error:', error);
        return Response.json(
            { error: error.message || 'Analysis failed. Please try again.' },
            { status: 500 }
        );
    }
}

async function processFileInput(file, label) {
    const fileType = file.type || '';
    const fileName = file.name || '';
    const isDocx =
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx');

    if (isDocx) {
        const bytes = await file.arrayBuffer();
        const result = await mammoth.convertToMarkdown({ arrayBuffer: bytes });
        return [
            { text: `${label} (converted from docx):\n${result.value}` }
        ];
    } else {
        // PDF or image — send as inline data
        const bytes = await file.arrayBuffer();
        return [
            { text: `${label}:` },
            {
                inlineData: {
                    data: Buffer.from(bytes).toString('base64'),
                    mimeType: fileType || 'application/pdf',
                },
            },
        ];
    }
}

function buildPrompt(totalMarks, s, p, syllabusText, patternText) {
    let context = `- Total marks stated by teacher: ${totalMarks}\n`;

    if (s === 0 && syllabusText) {
        context += `- Syllabus: ${syllabusText}\n`;
    } else {
        context += `- Syllabus is provided as an attachment\n`;
    }

    if (p === 0 && patternText) {
        context += `- Paper pattern: ${patternText}\n`;
    } else if (p === 1) {
        context += `- Paper pattern is provided as an attachment\n`;
    } else {
        context += `- No paper pattern provided\n`;
    }

    return `
You are an expert question paper examiner. Analyse this question paper and find all errors.

CONTEXT:
${context}

Find ALL of these errors and return a JSON response in EXACTLY this format, nothing else:

{
    "healthScore": 72,
    "verdict": "Needs Revision",
    "totalErrors": 12,
    "critical": 3,
    "warnings": 6,
    "suggestions": 3,
    "priorityFixes": [
        {
            "id": 1,
            "title": "error title",
            "description": "what the error is",
            "category": "Marks",
            "severity": "critical"
        }
    ],
    "errorCategories": {
        "language": {
            "count": 4,
            "severity": "critical",
            "items": [
                {
                    "id": 1,
                    "question": "Q2",
                    "type": "Spelling mistake",
                    "issue": "description of the issue"
                }
            ]
        },
        "structure": { "count": 0, "severity": "warning", "items": [] },
        "marks": { "count": 0, "severity": "critical", "items": [] },
        "syllabus": { "count": 0, "severity": "warning", "items": [] },
        "logical": { "count": 0, "severity": "critical", "items": [] }
    },
    "cleanQuestions": ["Q1", "Q3"],
    "errorBreakdown": [
        { "label": "Language", "count": 4, "color": "bg-error" },
        { "label": "Structure", "count": 2, "color": "bg-amber-500" },
        { "label": "Marks", "count": 3, "color": "bg-error" },
        { "label": "Syllabus", "count": 2, "color": "bg-amber-500" },
        { "label": "Logical", "count": 1, "color": "bg-error" }
    ]
}

RULES:
- Return ONLY the JSON, no extra text, no markdown
- healthScore is 0-100 (100 = perfect paper)
- severity is either "critical" or "warning"
- verdict is one of: "Ready to Print", "Needs Revision", "Critical Issues Found"
- List every single error you find, do not skip any
- For cleanQuestions, only include questions with zero errors
`;
}