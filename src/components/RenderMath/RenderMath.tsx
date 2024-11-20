import "katex/dist/katex.css";
import DOMPurify from "dompurify";
import { type RefCallback, useCallback, useEffect, useState } from "react";
import { renderMathToString } from "../../utils/renderMathToString";

export type RenderMathProps = {
  content: string;
};

export const RenderMath: React.FC<RenderMathProps> = ({ content }) => {
  const [rootElem, setRootElem] = useState<HTMLDivElement>();
  const [renderedContent, setRenderedContent] = useState<string>("");

  useEffect(() => {
    if (rootElem) {
      setRenderedContent(DOMPurify.sanitize(renderMathToString(content)));
    }
  }, [content, rootElem]);

  const handleRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    if (node) {
      setRootElem(node);
    }
  }, []);

  // biome-ignore lint/security/noDangerouslySetInnerHtml: made safe via sanitizer
  return <div ref={handleRef} dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};
