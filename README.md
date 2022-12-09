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
    "id": .. ,
    "type": .. ,
    "question": {
        ..
    },
    "answers": [
        ..
    ]
 }
```

- `id` is unique question id, recommended to use 0,1...
- `type` is a type of question, can be `self-assessment` or `question-with-answers`

## For type `question-with-answers`:

### `question` is an object with the following structure:
- `type` (text/image)
- `content` or `src`, depending on the type

### `answers` is an array of objects with the following structure:
- `type` (text/image)
- `content` or `src`, depending on the type
- `correct` (true/false)
    
## For type `self-assessment`:
- same as `question-with-answers`, but without `correct` field in `answers`


# Example

```json
{
    "filetype": "examiner-dlc",
    "version": "1.3",
    "name": "Example",
    "data": [
        {
            "id": 0,
            "type": "question-with-answers",
            "question": {
                "type": "text",
                "content": "What is the capital of Czech Republic?"
            },
            "answers": [
                {
                    "type": "text",
                    "content": "Prague",
                    "correct": true
                },
                {
                    "type": "text",
                    "content": "Brno",
                    "correct": false
                },
                {
                    "type": "text",
                    "content": "Ostrava",
                    "correct": false
                }
            ]
        },
        {
            "id": 1,
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
                    "content": "Košice",
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
            "id": 2,
            "type": "self-assessment",
            "question": {
                "type": "text",
                "content": "What is the capital of Poland?"
            },
            "answers": [
                {
                    "type": "text",
                    "content": "Warsaw"
                },
                {
                    "type": "text",
                    "content": "Krakow"
                },
                {
                    "type": "text",
                    "content": "Wroclaw"
                }
            ]
        }
    ]
}