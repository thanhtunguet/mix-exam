export class Question {
  public title: string;

  public body: string;

  public hs?: Question;

  public toString() {
    return this.title + this.body;
  }
}
