import {Question} from './Question';

export class Exercise {
  public title: string;

  public questions: Question[];

  public toString() {
    return this.title + this.questions?.map((q) => q.toString()).join('');
  }
}
