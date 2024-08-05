import "./Banner.css";

import logo from './logo-128x128.png';
import github from './github-mark.png';
import {Tooltip} from "react-tooltip";

export function Banner() {
    return (
      <div className="banner">
        <a href="https://fluffylabs.dev">
          <img src={logo} width="45" height="45" alt="Fluffy Labs" />
        </a>
        <a href="https://graypaper.fluffylabs.dev">
          Gray Paper Viewer
        </a>

        <div style={{flex: 1}} />
        <a
          data-tooltip-id="github"
          data-tooltip-content="Report an issue or fork on Github"
          data-tooltip-place="bottom"
          target="_blank" href="https://github.com/fluffylabs/graypaper-viewer"
        >
          <img src={github} alt="Github logo" width="45" height="45" />
        </a>
        <Tooltip id="github" />
      </div>
    );
}
