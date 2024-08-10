import "./Banner.css";

import { Tooltip } from "react-tooltip";
import github from "./github-mark.png";
import logo from "./logo-128x128.png";

export function Banner() {
  return (
    <div className="banner no-zoom">
      <a href="https://fluffylabs.dev">
        <img src={logo} width="45" height="45" alt="Fluffy Labs" />
      </a>
      <a href="https://graypaper.fluffylabs.dev">Gray Paper Reader</a>

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
