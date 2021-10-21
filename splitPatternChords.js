const splitPattern = (pattern, withSpaces) => {
  const initialSpace = pattern.split('x')[0];
  const stepsWithSpaces = pattern.split('x');
  if (initialSpace.length === 0) stepsWithSpaces.shift();

  const counter = initialSpace.length === 0 ? 0 : 1;
  for (let i = counter; i < stepsWithSpaces.length; i++) stepsWithSpaces[i] = 'x' + stepsWithSpaces[i];

  const noEmptySteps = (steps) => steps.filter((step) => step.length > 0);

  if (withSpaces) return noEmptySteps(stepsWithSpaces);

  const stepsAndSpaces = [];
  stepsWithSpaces.forEach((step) => {
    const spaceIndex = step.indexOf('-');
    if (spaceIndex !== -1) {
      const splitHappens = [step.slice(0, spaceIndex), step.slice(spaceIndex)];
      stepsAndSpaces.push(...splitHappens);
    } else {
      stepsAndSpaces.push(step);
    }
  });

  const stepsAndSpacesSeparated = [];
  noEmptySteps(stepsAndSpaces)
    .map((step) => step.split(/(?=-)/g))
    .forEach((step) => stepsAndSpacesSeparated.push(...step));

  return stepsAndSpacesSeparated;
};

module.exports = { splitPattern };
