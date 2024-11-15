import "katex/dist/katex.css";
import { type PropsWithChildren, type RefCallback, useCallback, useEffect, useState } from "react";
import renderMathInElement from "katex/contrib/auto-render";

export const TeX: React.FC<PropsWithChildren> = ({ children }) => {
  const [rootElem, setRootElem] = useState<HTMLDivElement>();

  useEffect(() => {
    if (rootElem && typeof children === "string") {
      const renderElem = document.createElement("span");
      renderElem.appendChild(document.createTextNode(children));
      renderMathInElement(renderElem, { throwOnError: false, output: "html" });
      rootElem.replaceChildren(renderElem);
    }
  }, [children, rootElem]);

  const handleRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    if (node) {
      setRootElem(node);
    }
  }, []);

  return <div ref={handleRef} />;
};
