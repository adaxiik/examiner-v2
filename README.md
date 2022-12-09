# Examiner V2
Examiner is simple website for practicing your skills before exams.
Just simply [open the app](https://adaxiik.github.io/examiner-v2/) and drag and drop your DLC file to the app.

# DLC structure

### DLC file is a simple JSON file with the following structure:

```json
{
    "filetype": "examiner-dlc",
    "version": "1.3",
    "name": ... ,
    "data": []
}
```
### The `data` field is an array of questions. Each question is an object with the following structure:

```json
{
    "filetype": "examiner-dlc",
    "version": "1.3",
    "name": "example",
    "data": [
        {
            "id": 1,
            "type": "question-with-answers",
            "question": {
                "type": "text",
                "content": "What is the capital of Czech Republic?"
            },
            "answers": [
                {
                    "type": "text",
                    "content": "Ostrava",
                    "correct": false
                },
                {
                    "type": "text",
                    "content": "Prague",
                    "correct": true
                },
                {
                    "type": "text",
                    "content": "Brno",
                    "correct": false
                }
            ]
        },
        {
            "id": 2,
            "type": "question-with-answers",
            "question": {
                "type": "text",
                "content": "What is the capital of Slovakia?"
            },
            "answers": [
                {
                    "type": "text",
                    "content": "Bratislava",
                    "correct": true
                },
                {
                    "type": "text",
                    "content": "Ko\u0161ice",
                    "correct": false
                },
                {
                    "type": "text",
                    "content": "Nitra",
                    "correct": false
                }
            ]
        },
        {
            "id": 3,
            "type": "self-assessment",
            "question": {
                "type": "text",
                "content": "What is the capital of Hungary?"
            },
            "answers": [
                {
                    "type": "text",
                    "content": "Budapest"
                }
            ]
        }
    ]
}
```

# Text to DLC tool
`txt2dlc.py` is a simple tool for converting text files to DLC files. 

## Usage
```sh
./txt2dlc.py <input file>
```

## Input file structure
Input file has following structure:
```
# question
+ correct answer
- wrong answer
- wrong answer

@ self-assessment question
+ correct answer
```

## Example
```
# What is the capital of Czech Republic?
- Ostrava
+ Prague
- Brno

# What is the capital of Slovakia?
+ Bratislava
- Košice
- Nitra

# What is the capital of Poland?
+ Warsaw
- Kraków
- Wrocław

@ What is the capital of Hungary?
+ Budapest
```
Output is displayed above.
