#!/usr/bin/env python3

import sys
import os
import json


QUESTION_TYPES = {'#': 'question-with-answers', '@': 'self-assessment'}

_i = 0
def aiota(reset=False):
    global _i
    if reset:
        _i = 0
    else:
        _i += 1
    return _i

def main():
    # Check if the user has supplied a file
    if len(sys.argv) < 2:
        print("Usage: txt2dlc.py <file>")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        lines = f.readlines()

    lines = [line.strip() for line in lines]    

    result = {}
    result['filetype'] = 'examiner-dlc'
    result['version'] = '1.3'
    result['name'] = os.path.splitext(sys.argv[1])[0]
    result['data'] = []

    index = 0
    while index < len(lines):
        line = lines[index]
        if line.startswith('#'):
            index = ParseQuestion(lines, index, result)
        elif line.startswith('@'):
            index = ParseSelfAssessment(lines, index, result)
        else:
            if(not line):
                index += 1
                continue
            print("Warning: Unknown line:")
            print(">>", lines[index-1])
            print(">>",lines[index])
            print(">>",lines[index+1])
            index += 1



    with open(result['name'] + '.dlc', 'w') as f:
        json.dump(result, f, indent=4)

    print("Done!")

def ParseQuestion(lines, index, result):
    question = {}
    question['id'] = aiota()
    question['type'] = QUESTION_TYPES[lines[index][0]]
    question['question'] = {}
    question['question']['type'] = 'text'
    question['question']['content'] = lines[index][1:].strip()
    question['answers'] = []
    index += 1
    while index < len(lines) and (lines[index].startswith('+') or lines[index].startswith('-')):
        answer = {}
        answer['type'] = 'text'
        answer['content'] = lines[index][1:].strip()
        answer['correct'] = lines[index].startswith('+')
        question['answers'].append(answer)
        index += 1
    result['data'].append(question)
    return index


def ParseSelfAssessment(lines, index, result):
    question = {}
    question['id'] = aiota()
    question['type'] = QUESTION_TYPES[lines[index][0]]
    question['question'] = {}
    question['question']['type'] = 'text'
    question['question']['content'] = lines[index][1:].strip()
    question['answers'] = []
    index += 1
    while index < len(lines) and lines[index].startswith('+'):
        answer = {}
        answer['type'] = 'text'
        answer['content'] = lines[index][1:].strip()
        question['answers'].append(answer)
        index += 1
    result['data'].append(question)
    return index


if __name__ == '__main__':
    main()