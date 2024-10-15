import "./Banner.css";

import { Tooltip } from "react-tooltip";
import logo from "./black-h-64.png?prefetch";
import github from "./github-mark-white.png?prefetch";

export function Banner() {
  return (
    <div className="banner">
      <a href="https://fluffylabs.dev">
        <img src={logo} width="144" height="64" alt="Fluffy Labs" />
      </a>
      <a href="">Gray Paper Reader</a>

      <div style={{ flex: 1 }} />
      <a
        data-tooltip-id="github"
        data-tooltip-content="Report an issue or fork on Github"
        data-tooltip-place="bottom"
        target="_blank"
        href="https://github.com/fluffylabs/graypaper-reader"
        rel="noreferrer"
      >
        <img src={github} alt="Github logo" width="45" height="45" />
      </a>
      <Tooltip id="github" />
    </div>
  );
}
