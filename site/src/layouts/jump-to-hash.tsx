export default (hash: string) => {
  if (!hash || !hash.startsWith('#')) {
    return;
  }

  const elementId = hash.substring(1);

  function tryScroll(attempt: number) {
    const targetElement = document.getElementById(elementId);

    // If element is not ready, keep trying up to 1 second.
    if (!targetElement) {
      if (attempt < 50) {
        setTimeout(() => tryScroll(attempt + 1), 20);
      }
      return;
    }

    // Scroll to the target element.
    window.scroll({ top: Math.max(targetElement.offsetTop - 16, 0) });

    // Update the history.
    if (window.location.hash !== hash) {
      window.history.pushState({}, '', hash);
    }

    // Highlight the target element briefly.
    const oldTransitionProperty = targetElement.style.transitionProperty;
    const oldTransitionDuration = targetElement.style.transitionDuration;
    const oldBgColor = targetElement.style.backgroundColor;
    targetElement.style.transitionProperty = 'background-color';
    targetElement.style.transitionDuration = '0.5s';
    targetElement.style.backgroundColor = 'rgb(186, 231, 255)';
    setTimeout(() => {
      targetElement.style.backgroundColor = oldBgColor;
      setTimeout(() => {
        targetElement.style.transitionProperty = oldTransitionProperty;
        targetElement.style.transitionDuration = oldTransitionDuration;
      }, 500);
    }, 500);
  }

  tryScroll(0);
};
