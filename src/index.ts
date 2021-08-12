import {Exercise} from './Exercise';
import path from 'path';
import {Question} from './Question';
import {fstat, writeFileSync} from 'fs';
import {execSync} from 'child_process';

const {readFileSync} = require('fs');
const {JSDOM} = require('jsdom');

function readFile(path: string): string {
  return readFileSync(path, {
    encoding: 'utf-8',
  });
}

const GV = new JSDOM(readFile(path.resolve(process.cwd(), 'files/GV.html')));
const HS = new JSDOM(readFile(path.resolve(process.cwd(), 'files/HS.html')));

function readBody(body: HTMLBodyElement): Exercise[] {
  const exercises: Exercise[] = [];
  for (const child of body.children) {
    switch (child.tagName.toLowerCase()) {
      case 'p':
        const exercise: Exercise = new Exercise();
        exercise.title = child.outerHTML;
        exercise.questions = [];
        exercises.push(exercise);
        break;

      case 'ol':
        const currentExercise = exercises[exercises.length - 1];
        if (currentExercise) {
          let body = '';
          let nextSib = child.nextElementSibling;
          while (nextSib?.tagName.toLowerCase() === 'ul') {
            body += nextSib.outerHTML;
            nextSib = nextSib.nextElementSibling;
          }
          const question: Question = new Question();
          question.title = child.outerHTML;
          question.body = body;
          currentExercise.questions.push(question);
        }
        break;

      default:
        continue;
    }
  }
  return exercises;
}

function shuffle(array: any[]) {
  var currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function createElementFromHTML(htmlString: string): HTMLElement {
  var div = GV.window.document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild as HTMLElement;
}

const gvExercises = readBody(GV.window.document.body);
const hsExercises = readBody(HS.window.document.body);
gvExercises.forEach((e, ei) => {
  e.questions.forEach((q, qi) => {
    q.hs = hsExercises[ei].questions[qi];
  });
});

gvExercises.forEach((e) => {
  shuffle(e.questions);
});

function writeFile(
  outFile: string,
  exercises: Exercise[],
  hs: boolean = false,
) {
  let result = '';
  exercises.forEach((exercise) => {
    result += exercise.title;
    result += exercise.questions
      .map((question, qi) => {
        let q = hs ? question.hs : question;
        const element = createElementFromHTML(q.title);
        return (
          `<ol start="${qi + 1}" type="1">${element.innerHTML}</ol>` + q.body
        );
      })
      .join('');
  });
  writeFileSync(outFile, result);
}

writeFile('files/GV-out.html', gvExercises);
writeFile('files/HS-out.html', gvExercises, true);
execSync('pandoc --from=html --to=docx files/GV-out.html -o GV-out.docx');
execSync('pandoc --from=html --to=docx files/HS-out.html -o HS-out.docx');
