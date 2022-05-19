// author: https://github.com/jakubhyza

const fs = require('fs');

function base64_encode(file) {
    
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

var datasetname = process.argv[2];
console.log("Exporting dataset " + datasetname + " into a file " + datasetname + ".dlc");

if (fs.existsSync(datasetname))
{
    console.log("Dataset exsists, exporting...");

    var datasetExport = {
        filetype: "examiner-dlc",
        version: "1.0",
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
            id:  parseInt(questionId),
            question: {
                type: "image",
                src: "data:image/png;base64," + base64_encode(datasetname + "/" + questionId + "/question.png")
            },
            answers: answers
        }
    }).sort((a,b)=>a.id - b.id);

    fs.writeFileSync(datasetname + ".dlc", JSON.stringify(datasetExport, null, 4));
}