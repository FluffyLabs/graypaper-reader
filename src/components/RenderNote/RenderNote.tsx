import "katex/dist/katex.css";
import DOMPurify from "dompurify";
import { useMemo } from "react";
import { renderMathToString } from "../../utils/renderMathToString";

export type RenderNoteProps = {
  content: string;
};

export const RenderNote: React.FC<RenderNoteProps> = ({ content }) => {
  const renderedContent = useMemo(() => {
    const math = renderMath(content);
    const links = renderLinks(math);
    return DOMPurify.sanitize(links);
  }, [content]);

  // biome-ignore lint/security/noDangerouslySetInnerHtml: made safe via sanitizer
  return <div dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};

function renderMath(content: string): string {
  try {
    return renderMathToString(content);
  } catch (e) {
    return content;
  }
}

function renderLinks(content: string): string {
  let newContent = content;
  const links = newContent.match(URL_REGEX);
  if (links === null) {
    return newContent;
  }
  for (const link of links) {
    newContent = newContent.replace(link, `<a target="_blank" href="${link}">${shortenLink(link)}</a>`);
  }
  return newContent;
}

function shortenLink(link: string) {
  let newLink = link;
  newLink = newLink.replace("https://", "");
  const [domain, ...rest] = newLink.split("/");
  const restStr = rest.join("/");
  const SPLIT = 6;
  const start = restStr.substring(0, Math.min(SPLIT, restStr.length));
  const end = restStr.length > SPLIT ? `...${restStr.substring(restStr.length - SPLIT)}` : "";
  return `${domain}/${start}${end}`;
}

const URL_REGEX = /(https:\/\/[^\s,?()<>[\]{}]+)/g;
