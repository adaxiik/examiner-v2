#!/usr/bin/env node
// author: https://github.com/jakubhyza

const fs = require('fs');

function base64_encode(file) {
    
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

if(process.argv.length < 3)
{
    console.log("Usage: export-dataset.js datasetname [id_offset]");
    return;
}

var datasetname = process.argv[2];
var idOffset = process.argv.length > 3 ? parseInt(process.argv[3]) : 0;

console.log("Exporting dataset " + datasetname + " into a file " + datasetname + ".dlc");

if (fs.existsSync(datasetname))
{
    console.log("Dataset exists, exporting...");

    var datasetExport = {
        filetype: "examiner-dlc",
        version: "1.3",
        name: datasetname,
        data: []
    }

    var questions = fs.readdirSync(datasetname);
    datasetExport.data = questions.map(questionId=>{

        var questionFiles = fs.readdirSync(datasetname + "/" + questionId);

        var answers = [];

        questionFiles.forEach(file=>{
            var filepath = datasetname + "/" + questionId + "/" + file;
            if (file == "question.png")
                return;

            var isCorrect = file.charAt(0) == "c";

            answers.push({
                type: "image",
                correct: isCorrect,
                src: "data:image/png;base64," + base64_encode(filepath)
            });
        });

        return {
            id:  parseInt(questionId) + idOffset,
            type: "question-with-answers",
            question: {
                type: "image",
                src: "data:image/png;base64," + base64_encode(datasetname + "/" + questionId + "/question.png")
            },
            answers: answers
        }
    }).sort((a,b)=>a.id - b.id);

    fs.writeFileSync(datasetname + ".dlc", JSON.stringify(datasetExport, null, 4));
}