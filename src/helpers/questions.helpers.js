export function replaceQuestion(questions, oldQuestion, newQuestion) {
  const index = questions.findIndex((q) => q.id === oldQuestion.id);
  if (index >= 0) {
    questions[index] = newQuestion;
  }
  return questions;
}
