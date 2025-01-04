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
  const links = content.match(URL_REGEX);
  if (links === null) {
    return content;
  }
  let newContent = "";
  let haystack = content;
  for (const link of links) {
    // to support the same links multiple times we need to move forward in the content.
    const indexOf = haystack.indexOf(link);
    // convert reader links to local links
    const localLink = link.replace("https://graypaper.fluffylabs.dev", "");
    const linkData = `<a target="_blank" href="${localLink}">${shortenLink(localLink)}</a>`;
    haystack = haystack.replace(link, linkData);
    // add that stuff already to the newcontent
    newContent += haystack.substring(0, indexOf + linkData.length);
    // and move forward
    haystack = haystack.substring(indexOf + linkData.length);
  }
  // return the new content and whatever is left.
  return newContent + haystack;
}

function shortenLink(link: string) {
  let newLink = link;
  newLink = newLink.replace("https://", "");
  const [domain, ...rest] = newLink.split("/");
  if (!domain) {
    return rest.join("/");
  }
  const restStr = rest.join("/");
  const SPLIT = 6;
  const start = restStr.substring(0, Math.min(SPLIT, restStr.length));
  const end = restStr.length > SPLIT ? `...${restStr.substring(restStr.length - SPLIT)}` : "";
  return `${domain}/${start}${end}`;
}

const URL_REGEX = /(https:\/\/[^\s,?()<>[\]{}]+)/g;
