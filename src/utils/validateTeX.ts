import renderMathInElement from "katex/contrib/auto-render";

export function validateTeX(str: string): null | string {
  let errorMsg: null | string = null;

  const renderElem = document.createElement("span");
  renderElem.appendChild(document.createTextNode(str));

  renderMathInElement(renderElem, {
    errorCallback: (_msg, err) => {
      errorMsg = err.message;
    },
  });

  return errorMsg;
}
