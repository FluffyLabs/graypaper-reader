import renderMathInElement from "katex/contrib/auto-render";

export const DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "\\(", right: "\\)", display: false },
  { left: " $", right: "$ ", display: false },
  { left: "\\begin{equation}", right: "\\end{equation}", display: true },
  { left: "\\begin{align}", right: "\\end{align}", display: true },
  { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
  { left: "\\begin{gather}", right: "\\end{gather}", display: true },
  { left: "\\begin{CD}", right: "\\end{CD}", display: true },
  { left: "\\[", right: "\\]", display: true },
];

export function renderMathToString(str: string): string {
  const renderElem = document.createElement("span");
  renderElem.appendChild(document.createTextNode(str));

  renderMathInElement(renderElem, {
    delimiters: DELIMITERS,
    errorCallback: (_msg, err) => {
      throw err;
    },
  });

  return renderElem.innerHTML;
}
