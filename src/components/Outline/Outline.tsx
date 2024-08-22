import "./Outline.css";
import { type ReactNode, useCallback, useContext } from "react";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { TOutline } from "../Sidebar/Sidebar";
import type { IPdfContext } from "../PdfProvider/PdfProvider";

type IOutlineProps = {
  outline: TOutline;
};

export function Outline({ outline }: IOutlineProps) {
  const renderOutline = (outline: TOutline) => {
    return (
      <ul>
        {outline.map((item) => (
          <li key={item.title}>
            <Link dest={item.dest}>{item.title}</Link>
            {item.items.length > 0 ? renderOutline(item.items) : null}
          </li>
        ))}
      </ul>
    );
  };

  return <div className="outline">{renderOutline(outline)}</div>;
}

type ILinkProps = {
  dest: TOutline[0]["dest"];
  children: ReactNode;
};

function Link({ dest, children }: ILinkProps) {
  const { linkService } = useContext(PdfContext) as IPdfContext;

  const handleClick = useCallback(() => {
    if (!dest) return;
    linkService.goToDestination(dest);
  }, [linkService, dest]);

  return (
    <a href="#" onClick={handleClick}>
      {children}
    </a>
  );
}
