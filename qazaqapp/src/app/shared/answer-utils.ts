const normalizePattern = /[^\p{L}\p{N}\s]/gu;

export function normalizeAnswer(value: string): string {
  return value
    .toLocaleLowerCase('kk-KZ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(normalizePattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isAcceptableAnswer(actual: string, acceptableAnswers: string[]): boolean {
  const normalizedActual = normalizeAnswer(actual);
  if (!normalizedActual) {
    return false;
  }

  return acceptableAnswers.some((candidate) => {
    const normalizedCandidate = normalizeAnswer(candidate);
    if (!normalizedCandidate) {
      return false;
    }

    return (
      normalizedActual === normalizedCandidate ||
      normalizedActual.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedActual) ||
      similarity(normalizedActual, normalizedCandidate) >= 0.84
    );
  });
}

export function isSpeechMatch(expected: string, actual: string): boolean {
  const normalizedExpected = normalizeAnswer(expected);
  const normalizedActual = normalizeAnswer(actual);
  if (!normalizedExpected || !normalizedActual) {
    return false;
  }

  if (
    normalizedExpected === normalizedActual ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  ) {
    return true;
  }

  if (similarity(normalizedExpected, normalizedActual) >= 0.72) {
    return true;
  }

  const expectedTokens = normalizedExpected.split(' ');
  const actualTokens = normalizedActual.split(' ');
  const matchedTokens = expectedTokens.filter((expectedToken) =>
    actualTokens.some((actualToken) => actualToken === expectedToken || similarity(actualToken, expectedToken) >= 0.75),
  ).length;

  return matchedTokens / expectedTokens.length >= 0.7;
}

function similarity(left: string, right: string): number {
  const longest = Math.max(left.length, right.length);
  if (!longest) {
    return 1;
  }

  return 1 - levenshteinDistance(left, right) / longest;
}

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      current[col] = Math.min(
        current[col - 1] + 1,
        previous[col] + 1,
        previous[col - 1] + cost,
      );
    }

    for (let col = 0; col <= right.length; col += 1) {
      previous[col] = current[col];
    }
  }

  return previous[right.length];
}
