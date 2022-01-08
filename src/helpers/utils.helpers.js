export function isEnterKey(e) {
  return e.keyCode && e.keyCode === 13;
}

export function isDeleteKey(e) {
  return e.keyCode && e.keyCode === 46;
}

export function isEscKey(e) {
  return e.keyCode && e.keyCode === 27;
}

export function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
